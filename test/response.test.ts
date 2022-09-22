
jest.mock("../src/props", jest.fn());
jest.mock("../templates/base.html", jest.fn());

import { updateAndRespond } from "../src/response";
import { Request } from "../src/form";
import { Entry } from "../src/sheet";
import { DateTime } from "luxon";
import { Assignment } from "../config/config";
import { addDays, format as formatTime } from "../src/time";
import * as literal from "../config/literals";

let defaultAssignment = "Test HW" as jest.Mocked<Assignment>;

jest.mock("../config/config", () => {
    const moduleMock = jest.requireActual(
        "../config/config"
    );
    let testConfig = {
      ...moduleMock.config,
      assignments: {
        "Test HW": { deadline: "2022-02-01T17:00:00-06:00" },
      },
      policy: {
        maxLateDays: 10,
        maxLateDaysPerAssignment: 2,
        requestPeriodInDays: 4,
        refundPeriodInDays: 4,
      }
    }

    return {
      __esModule: true,
      ...moduleMock,
      config: testConfig,
      default: testConfig,
    };
});

import config from "../config/config";

const testRequest : Request = {
  id: "",
  email: "",
  time: DateTime.now(),
  assignment: defaultAssignment,
  action: {act: "refund", days: 2},
};

const testEntry : Entry = {
  rowIndex: 0,
  days:{
    "Test HW": {
          used: 1,
          free: 0,
      }
  }
};


describe("testing Responses", () => {
    test("summary request would give summary body", () => {
      let summaryRequest: Request ={
        ...testRequest,
        action: {act: "summary"}
      };
      expect(updateAndRespond(testEntry, summaryRequest).body).toStrictEqual([]);
    });

    test("responds appropriately when requesting refund beyond policy refund days", () => {
      let refundRequest: Request ={
        ...testRequest,
        time: DateTime.fromISO("2022-02-06T17:00:00-06:00"),  // beyond refund (4) days since deadline
        action: {act: "refund", days: 1000000}
      };
      expect(
        updateAndRespond(testEntry, refundRequest).body
      ).toStrictEqual(
        literal.refBeyondBody({
          assignment: defaultAssignment, 
          oldDeadline: formatTime(addDays(
            DateTime.fromISO(config.assignments[defaultAssignment].deadline),
            config.policy.refundPeriodInDays))
        })
      );
    });

    test("responds appropriately when requesting refund for an assignment with no used late days", () => {
      let refundRequest: Request ={
        ...testRequest,
        time: DateTime.fromISO("2022-02-01T17:00:00-06:00"), 
        action: {act: "refund", days: 1000000}
      };
      let refundEntry: Entry = {
        ...testEntry,
        days:{
          "Test HW": {
                used: 0,  // nothing requested on the assignment previously to refund
                free: 2,
            }
        }
      };
      expect(
        updateAndRespond(refundEntry, refundRequest).body
      ).toStrictEqual(
        literal.refUnusedBody({
          assignment: defaultAssignment, 
          oldDeadline: formatTime(DateTime.fromISO(config.assignments[defaultAssignment].deadline)),
        })
      );
    });

    test("acknowledge when refund request recieved after the deadline", () => {
      let refundRequest: Request ={
        ...testRequest,
        time: DateTime.fromISO("2022-02-02T17:00:00-06:00"), 
        action: {act: "refund", days: 1000000}
      };
      expect(
        updateAndRespond(testEntry, refundRequest).body
      ).toStrictEqual(
        literal.refRecBody({numOfDays: 1000000}),
      );
    });

    test("responds & refund request recieved before the deadline", () => {
      let usedDays = 3, refundDays=1;
      let refundRequest: Request ={
        ...testRequest,
        time: DateTime.fromISO("2022-01-30T17:00:00-06:00"), 
        action: {act: "refund", days: refundDays} // refund days
      };
      let refundEntry: Entry = {
        ...testEntry,
        days :{
          "Test HW": {
                used: usedDays, 
                free: 0,
            }
        }
      };
      expect(refundEntry.days[defaultAssignment].used).toBe(usedDays);  // 3 day before
      expect(
        updateAndRespond(refundEntry, refundRequest).subject
      ).toStrictEqual(
        literal.refundAppSubject(defaultAssignment, formatTime(DateTime.fromISO("2022-02-03T17:00:00-06:00")))
      );
      expect(refundEntry.days[defaultAssignment].used).toBe(usedDays-refundDays);  // 1 day refunded successfully
    });

    test("responds appropriately when requesting late days after the latest possible day", () => {
      let reqRequest: Request ={
        ...testRequest,
        time: DateTime.fromISO("2022-02-08T17:00:00-06:00"),    // deadline on 02-01; but extension requested 30 days later
        action: {act: "request", days: 7}
      };
      expect(
        updateAndRespond(testEntry, reqRequest).body
      ).toStrictEqual(
        literal.reqBeyondBody({
          assignment: defaultAssignment, 
          oldDeadline: formatTime(DateTime.fromISO("2022-02-05T17:00:00-06:00"))}),
      );
    });

    test("responds appropriately when requesting late days when no days are left", () => {
      let reqRequest: Request ={
        ...testRequest,
        time: DateTime.fromISO("2022-01-20T17:00:00-06:00"), 
        action: {act: "request", days: 1},  // cannot add this 1 day
      };
      let refundEntry: Entry = {
        ...testEntry,
        days :{
          "Test HW": {
                used: 1000,     // too many days previously requested
                free: 0,
            }
        }
      };
      expect(
        updateAndRespond(refundEntry, reqRequest).body
      ).toStrictEqual(
        literal.reqUnusedBody({numOfDays: 1000}),
      );
    });

    test("responds appropriately when requesting more late days than policy", () => {
      let reqRequest: Request ={
        ...testRequest,
        time: DateTime.fromISO("2022-01-20T17:00:00-06:00"), 
        action: {act: "request", days: 100000},     // too many days requested
      };
      expect(
        updateAndRespond(testEntry, reqRequest).body
      ).toStrictEqual(
        literal.reqGloBody({numOfDays: 100000, assignment: defaultAssignment, leftDays: 9}),
      );
    });

    test("responds & changes used days with successful request", () => {
      let reqRequest: Request ={
        ...testRequest,
        time: DateTime.fromISO("2022-01-20T17:00:00-06:00"), 
        action: {act: "request", days: 4},
      };
      let reqEntry: Entry = {
        ...testEntry,
        days :{
          "Test HW": {
                used: 1,
                free: 0,
            }
        }
      };
      expect(reqEntry.days[defaultAssignment].used).toBe(1);  // 1 day before
      expect(
        updateAndRespond(reqEntry, reqRequest).subject
      ).toStrictEqual(
        literal.requestAppSubject(defaultAssignment, formatTime(DateTime.fromISO("2022-02-05T17:00:00-06:00"))),
      );
      expect(reqEntry.days[defaultAssignment].used).toBe(4);  // 5 days after
    });
});
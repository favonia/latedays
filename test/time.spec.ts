import * as time from "../src/time";

describe("time", function () {
  describe("addDays", function () {
    it("one day after 2021/3/13 5pm should be 2021/3/14 6pm (24 hours later)", function () {
      expect(
        time.addDays(time.fromISO("2021-03-13T17:00:00-06:00"), 1)
      ).toStrictEqual(time.fromISO("2021-03-14T18:00:00-05:00"));
    });
    it("one day after 2021/11/6 5pm should be 2021/11/7 5pm (25 hours later)", function () {
      expect(
        time.addDays(time.fromISO("2021-11-06T17:00:00-05:00"), 1)
      ).toStrictEqual(time.fromISO("2021-11-07T17:00:00-06:00"));
    });
  });
});

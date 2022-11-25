import * as sheet from "../sheet";
import * as form from "../form";
import { timeDiff } from "../time";
import { fetchAndWriteUsers, getSubmissions } from "./canvas";
import config, { Assignment } from "../../config/config";

const rosterSheetName = "Roster Sheet";
let cachedRosterSheet: GoogleAppsScript.Spreadsheet.Sheet | null = null;

const rosterHeaders = [sheet.idHeader, "Email", "Canvas_id", "Name"];

/**
 * Adds a new Roster sheet in the same spreadsheet (which is the destination for the Google Form).
 * For integrity reasons, the form & the sheet are to be initialized before the function is called.
 * @returns Roster sheet
 */
export function fetchRoster(): GoogleAppsScript.Spreadsheet.Sheet | null {
  const f = form.ensure();
  let ss: GoogleAppsScript.Spreadsheet.Spreadsheet;
  try {
    ss = SpreadsheetApp.openById(f.getDestinationId());
  } catch {
    console.log(
      "Roster sheet update failed, check if the google form is initialized."
    );
    return null;
  }

  let rosterSheet: GoogleAppsScript.Spreadsheet.Sheet | null;
  rosterSheet = ss.getSheetByName(rosterSheetName);
  if (rosterSheet === null) {
    rosterSheet = ss.insertSheet();
    sheet.initDataSheet(rosterSheet, rosterSheetName, rosterHeaders);
  }
  fetchAndWriteUsers(rosterSheet);
  SpreadsheetApp.flush();
  return rosterSheet;
}

function rosterEnsure(): GoogleAppsScript.Spreadsheet.Sheet | null {
  if (cachedRosterSheet !== null) {
    return cachedRosterSheet;
  }
  return (cachedRosterSheet = fetchRoster());
}

export function test(): null {
  getAffectedUsers("Homework 1");
  return null;
}

/**
 * lateRequested: late days requested (saved as "used days" in the spreadsheet)
 * lateUsed: late days actually used based on the submission times on canvas
 * refundPossible: Requested days + free days - actual used days
 */
type AutoRefunds = {
  assignment: string;
  users: Array<{
    lateRequested: number;
    lateUsed: number;
    refundPossible: number;
    userId: string;
    userEmail: string;
  }>;
};

/**
 * For an assignment, checks all the users that requested late days but did not fully utilize them.
 * In other words, ultimately finds the gap between requested "Used days" and actual "Used days" based on the submission
 *  details for that assignment
 * @param assignment Assignment name (as identifiable by Canvas API)
 * @returns An array of user objects with details about possible left late days, that can be potentially refunded
 */
export function getAffectedUsers(assignment: string): AutoRefunds {
  var result: AutoRefunds = {
    assignment: assignment,
    users: [],
  };
  const ds = sheet.ensure();
  const headers = sheet.ensureHeaders(ds, sheet.expectedHeaders);
  var users = ds
    .getRange(2, 1, ds.getLastRow() - 1, ds.getLastColumn())
    .getValues();
  // get non-null user Id rows
  users = users.filter((row) => row[headers[sheet.idHeader]]);
  const rosterDs = rosterEnsure();
  if (!rosterDs) return result;
  var roster = rosterDs
    .getRange(2, 1, rosterDs.getLastRow() - 1, rosterDs.getLastColumn())
    .getValues();
  const rHeaders = sheet.ensureHeaders(rosterDs, rosterHeaders, true);
  // filter to get required user rows from the entire roster
  roster = roster.filter(
    (row) =>
      users
        .map((r) => r[headers[sheet.idHeader]])
        .indexOf(row[rHeaders[sheet.idHeader]]) >= 0
  );
  const submissions: Map<string, string> = getSubmissions(
    roster.map((r) => r[rHeaders["Canvas_id"]]),
    assignment
  );
  const usedHeaderCol = sheet.usedHeader(assignment),
    freeHeaderCol = sheet.freeHeader(assignment);
  users.forEach((row) => {
    let useRequested = Number(row[headers[usedHeaderCol]]),
      free = Number(row[headers[freeHeaderCol]]);
    let userId = row[headers[sheet.idHeader]];
    let userRosterDetails = roster.find(
      (r) => r[rHeaders[sheet.idHeader]] == userId
    );
    if (useRequested > 0 && userRosterDetails) {
      let submittedTime = submissions.get(
        userRosterDetails[rHeaders["Canvas_id"]]
      );
      if (submittedTime) {
        let usedActual = timeDiff(
          submittedTime,
          config.assignments[assignment as Assignment].deadline
        );
        if (useRequested + free > usedActual) {
          result.users.push({
            lateUsed: usedActual,
            lateRequested: useRequested,
            refundPossible: useRequested + free - usedActual,
            userId: userId,
            userEmail: userRosterDetails[rHeaders["Email"]],
          });
        }
      }
    }
  });
  return result;
}

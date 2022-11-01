import * as sheet from "../sheet";
import * as form from "../form";
import { fetchAndWriteUsers } from "./canvas";


const rosterSheetName = "Roster Sheet";

const rosterHeaders = [
  sheet.idHeader,
  "Email",
  "Canvas_id",
  "Name"
];

/**
 * Adds a new Roster sheet in the same spreadsheet (which is the destiantion for the Google Form).
 * For integrity reasons, the form & the sheet are to be initialized before the function is called.
 * @returns Roster sheet
 */
export function fetchRoster(): GoogleAppsScript.Spreadsheet.Sheet | undefined {
  const f = form.ensure();
  let ss: GoogleAppsScript.Spreadsheet.Spreadsheet;
  try {
    ss = SpreadsheetApp.openById(f.getDestinationId());
  } catch {
    console.log('Roster sheet update failed, check if the google form is initialized.')
    return;
  }

  let rosterSheet: GoogleAppsScript.Spreadsheet.Sheet | null
  rosterSheet = ss.getSheetByName(rosterSheetName)
  if (rosterSheet === null) {
    rosterSheet = ss.insertSheet()
    sheet.initDataSheet(rosterSheet, rosterSheetName, rosterHeaders)
  }
  fetchAndWriteUsers(rosterSheet)
  SpreadsheetApp.flush()
  return rosterSheet
}

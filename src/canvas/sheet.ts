import * as sheet from "../sheet";
import * as form from "../form";
import { fetchAndWriteUsers,getSubmissions } from "./canvas";


const rosterSheetName = "Roster Sheet";
let cachedRosterSheet: GoogleAppsScript.Spreadsheet.Sheet | null = null;

const rosterHeaders = [
  sheet.idHeader,
  "Email",
  "Canvas_id",
  "Name"
];

type Entry = {
  assignment: string
  users: Record<string, { used: number; free: number }>
}

/**
 * Adds a new Roster sheet in the same spreadsheet (which is the destination for the Google Form).
 * For integrity reasons, the form & the sheet are to be initialized before the function is called.
 * @returns Roster sheet
 */
export function fetchRoster(): GoogleAppsScript.Spreadsheet.Sheet | null {
  const f = form.ensure()
  let ss: GoogleAppsScript.Spreadsheet.Spreadsheet
  try {
    ss = SpreadsheetApp.openById(f.getDestinationId())
  } catch {
    console.log('Roster sheet update failed, check if the google form is initialized.')
    return null
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


function rosterEnsure(): GoogleAppsScript.Spreadsheet.Sheet | null {
  if (cachedRosterSheet !== null) {
    return cachedRosterSheet
  }
  return cachedRosterSheet = fetchRoster()
}

export function test(): null {
  getAffectedUsers("Homework 1")
  return null
}

export function getAffectedUsers(assignment: string): Entry {
  const ds = sheet.ensure()
  const headers = sheet.ensureHeaders(ds, sheet.expectedHeaders)
  var users = ds
    .getRange(2, 1, ds.getLastRow() - 1, ds.getLastColumn())
    .getValues()
  // get non-null Id rows
  users = users.filter((row) => row[headers[sheet.idHeader]])
  const rosterDs = rosterEnsure()
  if (rosterDs) {
    var roster = rosterDs.getRange(2, 1, rosterDs.getLastRow()-1, rosterDs.getLastColumn()).getValues()
    const rHeaders = sheet.ensureHeaders(rosterDs, rosterHeaders, true)
    roster = roster.filter((row) => (
      users.map(
        (r) => r[headers[sheet.idHeader]]
      ).indexOf(row[rHeaders[sheet.idHeader]]) >= 0
    ))
    getSubmissions(roster.map((r) => r[rHeaders['Canvas_id']]), assignment)
  }
  const usedHeaderCol = sheet.usedHeader(assignment), freeHeaderCol = sheet.freeHeader(assignment)
  return {
    assignment: assignment,
    users: Object.fromEntries(
      users.map((row) => [
        row[headers[sheet.idHeader]], {
          used: Number(row[headers[usedHeaderCol]]),
          free: Number(row[headers[freeHeaderCol]]),
        }
      ])
    )
  }
}

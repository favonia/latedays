import * as config from "../config/config";
import * as form from "./form";

const propSpreadsheetId = "SPREADSHEET_ID";
const propDataSheetId = "SHEET_ID";

// global name
const callbackNameOnFormSubmit = "callbackOnFormSubmit";

function usedHeader(title: string): string {
  return `Used ${title}`;
}

function freeHeader(title: string): string {
  return `Free ${title}`;
}

function initDataSheet(
  sheet: GoogleAppsScript.Spreadsheet.Sheet
): GoogleAppsScript.Spreadsheet.Sheet {
  try {
    sheet.setName(config.dataSheetName);
  } catch (e) {
    Logger.log("failed to set the name of the data sheet: " + e);
  }

  const row_header_vals = ["ID"];

  Object.keys(config.deadlines).forEach((assign) => {
    row_header_vals.push(usedHeader(assign));
    row_header_vals.push(freeHeader(assign));
  });

  return sheet.appendRow(row_header_vals);
}

export function ensure(): GoogleAppsScript.Spreadsheet.Sheet {
  const props = PropertiesService.getScriptProperties();

  const [ssId, dsId] = [
    props.getProperty(propSpreadsheetId),
    Number(props.getProperty(propDataSheetId)),
  ];
  if (ssId !== null && dsId !== null) {
    const ss = SpreadsheetApp.openById(ssId);
    let ds = ss.getSheets().find((sheet) => sheet.getSheetId() === dsId);
    if (ds === undefined) {
      Logger.log("The impossible happened: data sheet disappeared.");
      ds = ss.insertSheet();
      initDataSheet(ds);
      props.setProperty(propDataSheetId, ds.getSheetId().toString());
    }
    return ds;
  }

  const ss = SpreadsheetApp.create(config.spreadsheetName);

  // set the timezone
  ss.setSpreadsheetTimeZone(config.timezone);

  // link the form
  form.ensure().setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  // trigger on submission
  ScriptApp.newTrigger(callbackNameOnFormSubmit)
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  const ds = ss.getSheets()[0];

  // prepare the data sheet
  initDataSheet(ds);

  // remember the IDs
  props.setProperty(propSpreadsheetId, ss.getId());
  props.setProperty(propDataSheetId, ds.getSheetId().toString());

  return ds;
}

// init guarantees that the sheet exists and is initialized
export function init(): void {
  ensure();
}

type Entry = Record<string, { used: number; free: number }>;

function getHeaders(ds: GoogleAppsScript.Spreadsheet.Sheet): string[] {
  return ds.getRange(1, 1, 1, ds.getLastColumn()).getValues()[0].map(String);
}

/**
 * the first student has the index 0 (though the data would be at the second row)
 * @return 0-indexed row numbers, or -1 if not found
 */
function getRowIndex(
  ds: GoogleAppsScript.Spreadsheet.Sheet,
  id: string
): number {
  return ds
    .getRange(1, 1, ds.getLastRow(), 1)
    .getValues()
    .slice(1) // remove the header; Range still starts from 1 to avoid empty ranges
    .findIndex((row) => String(row[0]) === id);
}

export function readRecord(
  ds: GoogleAppsScript.Spreadsheet.Sheet,
  id: string
): Entry {
  const headers = getHeaders(ds);
  let rowIndex = getRowIndex(ds, id);

  if (rowIndex === -1) {
    ds.appendRow(headers.map((_, index) => (index === 0 ? id : 0)));

    let entry: Entry = {};
    Object.keys(config.deadlines).forEach(function (assign) {
      entry[assign] = { used: 0, free: 0 };
    });

    return entry;
  } else {
    const row = ds
      .getRange(1 + rowIndex + 1, 1, 1, ds.getLastColumn())
      .getValues()[0];

    let entry: Entry = {};
    Object.keys(config.deadlines).forEach(function (assign) {
      entry[assign] = {
        used: Number(row[headers.indexOf(usedHeader(assign))]),
        free: Number(row[headers.indexOf(freeHeader(assign))]),
      };
    });

    return entry;
  }
}

export function writeRecord(
  ds: GoogleAppsScript.Spreadsheet.Sheet,
  id: string,
  entry: Entry
): void {
  const headers = getHeaders(ds);
  let rowIndex = getRowIndex(ds, id);

  if ( rowIndex === -1 ) { 
    Logger.log("The entry for %s was removed.", id)
    return
  }

  const range = ds.getRange(1 + rowIndex + 1, 1, 1, ds.getLastColumn());
  let row: string[] = range.getValues()[0].map(String);
  Object.entries(entry).forEach(function ([assign, days]) {
    row[headers.indexOf(usedHeader(assign))] = String(days.used);
    row[headers.indexOf(freeHeader(assign))] = String(days.free);
  });
  range.setValues([row]);
}

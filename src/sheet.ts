import * as config from "../config/config";
import * as form from "./form";

const propSpreadsheetId = "SPREADSHEET_ID";
const propDataSheetId = "SHEET_ID";

// global name in index.ts
const callbackNameOnFormSubmit = "callbackOnFormSubmit";

const idHeader = "ID";

let cachedSheet: GoogleAppsScript.Spreadsheet.Sheet | null = null;

function usedHeader(title: string): string {
  return `Used ${title}`;
}

function freeHeader(title: string): string {
  return `Free ${title}`;
}

function initDataSheet(
  ds: GoogleAppsScript.Spreadsheet.Sheet
): GoogleAppsScript.Spreadsheet.Sheet {
  try {
    ds.setName(config.dataSheetName);
  } catch (e) {
    Logger.log("failed to set the name of the data sheet: " + e);
  }

  const headers = [idHeader];
  Object.keys(config.deadlines).forEach((assign) => {
    headers.push(usedHeader(assign));
    headers.push(freeHeader(assign));
  });

  return ds.appendRow(headers);
}

export function reset(): void {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty(propSpreadsheetId).deleteProperty(propDataSheetId);
}

export function ensure(): GoogleAppsScript.Spreadsheet.Sheet {
  if (cachedSheet !== null) {
    return cachedSheet;
  }

  const props = PropertiesService.getScriptProperties();

  const [ssId, dsId] = [
    props.getProperty(propSpreadsheetId),
    Number(props.getProperty(propDataSheetId)),
  ];
  if (ssId !== null && dsId !== null) {
    try {
      const ss = SpreadsheetApp.openById(ssId);
      let ds = ss.getSheets().find((sheet) => sheet.getSheetId() === dsId);
      if (ds === undefined) {
        Logger.log("The impossible happened: the data sheet disappeared.");
        ds = ss.insertSheet();
        initDataSheet(ds);
        props.setProperty(propDataSheetId, ds.getSheetId().toString());
      }
      return (cachedSheet = ds);
    } catch (_) {}
  }

  const ss = SpreadsheetApp.create(config.spreadsheetName);
  // set the timezone
  ss.setSpreadsheetTimeZone(config.timezone);

  // link the form
  form.ensure().setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  // set up trigger on submission
  ScriptApp.newTrigger(callbackNameOnFormSubmit)
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  const ds = ss.getSheets()[0];

  // prepare the data sheet
  initDataSheet(ds);

  // remember the IDs
  props
    .setProperty(propSpreadsheetId, ss.getId())
    .setProperty(propDataSheetId, ds.getSheetId().toString());

  return (cachedSheet = ds);
}

// init guarantees that the sheet exists and is initialized
export function init(): void {
  ensure();
}

export type Entry = {
  rowIndex: number;
  days: Record<string, { used: number; free: number }>;
};

function getHeaders(values: any[][]): string[] {
  return values[0].map(String);
}

/**
 * the first student has the index 0 (though the data would be at the second row)
 * @return 0-indexed row numbers, or -1 if not found
 */
function getRowIndex(values: any[][], id: string): number {
  // .slice(1) remove the header; Range still starts from 1 to avoid empty ranges
  return values.slice(1).findIndex((row) => String(row[0]) === id);
}

export function readRecord(
  ds: GoogleAppsScript.Spreadsheet.Sheet,
  id: string
): Entry {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  const values = ds
    .getRange(1, 1, ds.getLastRow(), ds.getLastColumn())
    .getValues();
  const headers = getHeaders(values);
  let rowIndex = getRowIndex(values, id);
  let row: any[] = [];

  if (rowIndex === -1) {
    row = headers.map((_, i) => (i === 0 ? id : 0));
    ds.appendRow(row);
    rowIndex = values.length;
    lock.releaseLock();
  } else {
    lock.releaseLock();
    row = values[rowIndex + 1];
  }

  // XXX O(n^2) for remapping
  const entry: Entry = { rowIndex: rowIndex, days: {} };
  Object.keys(config.deadlines).forEach(function (assign) {
    entry.days[assign] = {
      used: Number(row[headers.indexOf(usedHeader(assign))]),
      free: Number(row[headers.indexOf(freeHeader(assign))]),
    };
  });

  return entry;
}

export function updateRecord(
  ds: GoogleAppsScript.Spreadsheet.Sheet,
  entry: Entry
): void {
  const lastColumn = ds.getLastColumn();
  const headers = getHeaders(ds.getRange(1, 1, 1, lastColumn).getValues());

  const range = ds.getRange(1 + entry.rowIndex + 1, 1, 1, lastColumn);

  // XXX O(n^2) for remapping
  let row: string[] = range.getValues()[0].map(String);
  Object.entries(entry.days).forEach(function ([assign, days]) {
    row[headers.indexOf(usedHeader(assign))] = String(days.used);
    row[headers.indexOf(freeHeader(assign))] = String(days.free);
  });
  range.setValues([row]);
}

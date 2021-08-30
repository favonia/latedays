import config from "../config/config";
import * as form from "./form";

const propDataSheetId = "SHEET_ID";

const idHeader = "ID";

let cachedSheet: GoogleAppsScript.Spreadsheet.Sheet | null = null;

const usedHeader = (title: string): string => `Used ${title}`;
const freeHeader = (title: string): string => `Free ${title}`;

function initDataSheet(
  ds: GoogleAppsScript.Spreadsheet.Sheet
): GoogleAppsScript.Spreadsheet.Sheet {
  try {
    ds.setName(config.sheet.dataSheetName);
  } catch (_) {}

  const headers = [idHeader];
  Object.keys(config.assignments).forEach((assign) => {
    headers.push(usedHeader(assign));
    headers.push(freeHeader(assign));
  });

  return ds.appendRow(headers);
}

export function reset(): void {
  PropertiesService.getScriptProperties().deleteProperty(propDataSheetId);
}

export function ensure(): GoogleAppsScript.Spreadsheet.Sheet {
  if (cachedSheet !== null) {
    return cachedSheet;
  }

  const props = PropertiesService.getScriptProperties();
  const f = form.ensure();

  let dsId: number | null = Number(props.getProperty(propDataSheetId));

  let ss: GoogleAppsScript.Spreadsheet.Spreadsheet;
  try {
    ss = SpreadsheetApp.openById(f.getDestinationId());
  } catch (_) {
    ss = SpreadsheetApp.create(config.sheet.spreadsheetName);
    // set the timezone
    ss.setSpreadsheetTimeZone(config.timezone);
    // link the form
    f.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

    dsId = null;
  }

  let ds: GoogleAppsScript.Spreadsheet.Sheet | undefined;
  if (dsId === null) {
    ds = ss.getSheets()[0];
    initDataSheet(ds);
  } else {
    ds = ss.getSheets().find((sheet) => sheet.getSheetId() === dsId);
    if (ds === undefined) {
      ds = ss.insertSheet();
      initDataSheet(ds);
    } else {
      return (cachedSheet = ds);
    }
  }

  props.setProperty(propDataSheetId, ds.getSheetId().toString());
  return (cachedSheet = ds);
}

// init guarantees that the sheet exists and is initialized
export function init(): void {
  const ds = ensure();
  console.log("Data Sheet URL: %s", ds.getParent().getUrl());
}

export type Entry = {
  rowIndex: number;
  days: Record<string, { used: number; free: number }>;
};

/**
 * the first student has the index 0 (though the data would be at the second row)
 * @return 0-indexed row numbers, or -1 if not found
 */
function getRowIndex(data: any[][], id: string): number {
  // .slice(1) remove the header; Range still starts from 1 to avoid empty ranges
  return data.findIndex((row) => String(row[0]) === id);
}

export function readRecord(
  ds: GoogleAppsScript.Spreadsheet.Sheet,
  id: string
): Entry {
  const [headers, ...values] = ds
    .getRange(1, 1, ds.getLastRow(), ds.getLastColumn())
    .getValues();

  let rowIndex = getRowIndex(values, id);
  let row: any[] = [];

  if (rowIndex === -1) {
    row = headers.map((_, i) => (i === 0 ? id : 0));
    ds.appendRow(row);
    rowIndex = values.length - 1; // "- 1" to remove the header
  } else {
    row = values[rowIndex + 1];
  }

  // XXX O(n^2) for remapping
  const entry: Entry = { rowIndex: rowIndex, days: {} };
  Object.keys(config.assignments).forEach(function (assign) {
    entry.days[assign] = {
      used: Number(
        row[headers.findIndex((v) => String(v) === usedHeader(assign))]
      ),
      free: Number(
        row[headers.findIndex((v) => String(v) === freeHeader(assign))]
      ),
    };
  });

  return entry;
}

export function updateRecord(
  ds: GoogleAppsScript.Spreadsheet.Sheet,
  entry: Entry
): void {
  const lastColumn = ds.getLastColumn();
  const headers = ds.getRange(1, 1, 1, lastColumn).getValues()[0];

  const range = ds.getRange(1 + entry.rowIndex + 1, 1, 1, lastColumn);

  // XXX O(n^2) for remapping
  let row: any[] = range.getValues()[0];
  Object.entries(entry.days).forEach(function ([assign, days]) {
    row[headers.findIndex((v) => String(v) === usedHeader(assign))] = String(
      days.used
    );
    row[headers.findIndex((v) => String(v) === freeHeader(assign))] = String(
      days.free
    );
  });
  range.setValues([row]);
}

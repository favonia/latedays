import config from "../config/config";
import * as form from "./form";

const propDataSheetId = "SHEET_ID";

let cachedSheet: GoogleAppsScript.Spreadsheet.Sheet | null = null;

const idHeader = "ID";
const usedHeader = (title: string): string => `Used ${title}`;
const freeHeader = (title: string): string => `Free ${title}`;

type ParsedHeaders = Record<string, number>;

let cachedParsedHeaders: ParsedHeaders | null = null;

const expectedHeaders = [
  idHeader,
  ...Object.keys(config.assignments).flatMap((assign) => [
    usedHeader(assign),
    freeHeader(assign),
  ]),
];

function ensureHeaders(ds: GoogleAppsScript.Spreadsheet.Sheet): ParsedHeaders {
  if (cachedParsedHeaders !== null) {
    return cachedParsedHeaders;
  }

  let lookup: Record<string, number> = {};
  let headers: any[] = [];
  try {
    headers = ds.getRange(1, 1, 1, ds.getLastColumn()).getValues()[0];
    headers.forEach((value, index) => (lookup[String(value)] ??= index));
  } catch (_) {}

  // add all missing headers
  expectedHeaders.forEach(function (item: string): void {
    if (lookup[item] === undefined) {
      lookup[item] = headers.length;
      headers.push(item);
    }
  });

  ds.getRange(1, 1, 1, headers.length).setValues([headers]);

  return (cachedParsedHeaders = lookup);
}

function initDataSheet(
  ds: GoogleAppsScript.Spreadsheet.Sheet
): GoogleAppsScript.Spreadsheet.Sheet {
  try {
    // This could fail if there's already another sheet with the same name.
    // Not that we really care...
    ds.setName(config.sheet.dataSheetName);
  } catch {}

  const headers = ensureHeaders(ds);

  ds.setFrozenRows(1);
  ds.setFrozenColumns(headers[idHeader] + 1);

  return ds;
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
  } catch {
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
  // string, not Assignment, is used to avoid type-checking trouble
  days: Record<string, { used: number; free: number }>;
};

/**
 * the first student has the index 0 (though the data would be at the second row)
 * @return 0-indexed row numbers, or -1 if not found
 */
function getRowIndex(data: any[][], idColIndex: number, id: string): number {
  return data.findIndex((row) => String(row[idColIndex]) === id);
}

export function readRecord(
  ds: GoogleAppsScript.Spreadsheet.Sheet,
  id: string
): Entry {
  const headers = ensureHeaders(ds);

  let values: any[][] = [];
  try {
    // excluding the headers
    values = ds
      .getRange(2, 1, ds.getLastRow() - 1, ds.getLastColumn())
      .getValues();
  } catch {}

  let rowIndex = getRowIndex(values, headers[idHeader], id);
  let row: any[] = [];

  if (rowIndex === -1) {
    Object.entries(headers).map(
      ([header, index]) => (row[index] = header === idHeader ? id : 0)
    );
    rowIndex = values.length;
    ds.appendRow(row);
  } else {
    row = values[rowIndex];
  }

  return {
    rowIndex: rowIndex,
    days: Object.fromEntries(
      Object.keys(config.assignments).map((assign) => [
        assign,
        {
          used: Number(row[headers[usedHeader(assign)]]),
          free: Number(row[headers[freeHeader(assign)]]),
        },
      ])
    ),
  };
}

export function updateRecord(
  ds: GoogleAppsScript.Spreadsheet.Sheet,
  entry: Entry
): void {
  const headers = ensureHeaders(ds);

  const range = ds.getRange(1 + entry.rowIndex + 1, 1, 1, ds.getLastColumn());
  let row: any[] = range.getValues()[0];
  Object.entries(entry.days).forEach(function ([assign, days]) {
    row[headers[usedHeader(assign)]] = days.used;
    row[headers[freeHeader(assign)]] = days.free;
  });
  range.setValues([row]);
}

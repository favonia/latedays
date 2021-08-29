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

type Entry = {
  rowNum: number;
  id: string;
  days: Record<string, { used: number; free: number }>;
};

export function readRecord(id: string): Entry {
  const ds = ensure();

  const header = ds.getRange(1, 1, 1, ds.getLastColumn()).getValues()[0];

  let rowNum = ds
    .getRange(1, 1, ds.getLastRow(), 1)
    .getValues()
    .slice(1)
    .findIndex((row) => String(row[0]) === id);
  if (rowNum === -1) {
    let row = header.map((_, index) => (index === 0 ? id : 0));
    ds.appendRow(row);
    rowNum = ds
      .getRange(1, 1, ds.getLastRow(), 1)
      .getValues()
      .slice(1)
      .findIndex((row) => String(row[0]) === id);

    let days: Record<string, { used: number; free: number }> = {};
    Object.keys(config.deadlines).forEach(function (assign) {
      days[assign] = { used: 0, free: 0 };
    });

    return {
      rowNum: rowNum,
      id: id,
      days: days,
    };
  } else {
    const row = ds
      .getRange(1 + rowNum + 1, 1, 1, ds.getLastColumn())
      .getValues()[0];

    let days: Record<string, { used: number; free: number }> = {};
    Object.keys(config.deadlines).forEach(function (assign) {
      days[assign] = {
        used: Number(row[header.indexOf(usedHeader(assign))]),
        free: Number(row[header.indexOf(freeHeader(assign))]),
      };
    });

    return {
      rowNum: rowNum,
      id: id,
      days: days,
    };
  }
}

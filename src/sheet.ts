import * as config from "../config/config";
import form from "./form";

const propSpreadsheetId = "SPREADSHEET_ID";
const propDataSheetId = "SHEET_ID";

function prepareDataSheet(
  sheet: GoogleAppsScript.Spreadsheet.Sheet
): GoogleAppsScript.Spreadsheet.Sheet {
  try {
    sheet.setName(config.dataSheetName);
  } catch (e) {
    Logger.log("failed to set the name of the data sheet: " + e);
  }

  const row_header_vals = ["ID"];

  Object.keys(config.deadlines).forEach((hw) => {
    row_header_vals.push(`${hw}`);
    row_header_vals.push(`Free ${hw}`);
  });

  return sheet.appendRow(row_header_vals);
}

export function ensure(
  entrypoint: (event: GoogleAppsScript.Events.SheetsOnFormSubmit) => void
): [
  GoogleAppsScript.Spreadsheet.Spreadsheet,
  GoogleAppsScript.Spreadsheet.Sheet
] {
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
      prepareDataSheet(ds);
      props.setProperty(propDataSheetId, ds.getSheetId().toString());
    }
    return [ss, ds];
  }

  const ss = SpreadsheetApp.create(config.spreadsheetName);
  const ds = ss.getSheets()[0];

  // prepare the data sheet
  prepareDataSheet(ds);

  // set the timezone
  ss.setSpreadsheetTimeZone(config.timezone);

  // link the form
  form.ensure().setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // trigger on submission
  ScriptApp.newTrigger(entrypoint.name)
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  // remember the IDs
  props.setProperty(propSpreadsheetId, ss.getId());
  props.setProperty(propDataSheetId, ds.getSheetId().toString());

  return [ss, ds];
}

const props = PropertiesService.getScriptProperties();

export const get = (k: string): string | null => props.getProperty(k);
export const del = (k: string): GoogleAppsScript.Properties.Properties =>
  props.deleteProperty(k);
export const set = (
  k: string,
  v: string
): GoogleAppsScript.Properties.Properties => props.setProperty(k, v);

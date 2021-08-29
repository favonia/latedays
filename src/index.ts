import * as form from "./form";
import * as sheet from "./sheet";
import * as response from "./response";

export function init() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  form.init();
  sheet.init();
  lock.releaseLock();
}

// @ts-ignore: global
global.init = init;

// @ts-ignore: global
global.callbackOnFormSubmit = response.handle;

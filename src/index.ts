import * as form from "./form";
import * as sheet from "./sheet";
import * as response from "./response";

export function init() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    form.init();
    sheet.init();
  } finally {
    lock.releaseLock();
  }
}
// @ts-ignore: global
global.init = init;

export function reset() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    form.reset();
    sheet.reset();
  } finally {
    lock.releaseLock();
  }
}
// @ts-ignore: global
global.reset = reset;

// @ts-ignore: global
global.callbackOnFormSubmit = response.handle;

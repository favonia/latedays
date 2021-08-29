import * as form from "./form";
import * as sheet from "./sheet";
import * as response from "./response";

function withLock(f: (...args: any[]) => void): (...args: any[]) => void {
  return (...args: any[]) => {
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      f(...args);
    } finally {
      lock.releaseLock();
    }
  };
}

export function init() {
  form.init();
  sheet.init();
}
// @ts-ignore: global
global.init = withLock(init);

export function reset() {
  form.reset();
  sheet.reset();
}
// @ts-ignore: global
global.reset = withLock(reset);

// @ts-ignore: global
global.callbackOnFormSubmit = withLock(response.handle);

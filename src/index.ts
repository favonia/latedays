import * as form from "./form";
import * as sheet from "./sheet";
import * as canvasSheet from "./canvas/sheet";
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

export function init(): void {
  form.init();
  sheet.init();
}
// @ts-ignore: global
global.init = withLock(init);

export function reset(): void {
  form.reset();
  sheet.reset();
}
// @ts-ignore: global
global.reset = withLock(reset);

export function regenerateForm(): void {
  form.regenerate();
}
// @ts-ignore: global
global.regenerateForm = withLock(regenerateForm);

// @ts-ignore: global
global.callbackOnFormSubmit = withLock(response.handle);

// @ts-ignore: global
global.fetchRoster = withLock(canvasSheet.fetchRoster);

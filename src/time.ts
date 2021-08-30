import config from "../config/config";

import dayjs from "dayjs";
import minMax from "dayjs/plugin/minMax";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(minMax);
dayjs.extend(timezone);

dayjs.tz.setDefault(config.timezone);

// The type of time across the scripts.
export type Time = dayjs.Dayjs;

export function newTime(date?: string | Date | Time): Time {
  return dayjs(date);
}

/**
 * Return the new deadline after applying the given late days.
 *
 * @remarks In case the length of a day differs from 24 hours,
 * use the latest possible deadline among different calculation
 * methods. The most common reason is daylight saving changes.
 *
 * @param days - the number of applied late days.
 */
declare module "dayjs" {
  export interface Dayjs {
    addDays(days: number): Time;
  }
}
dayjs.extend((_options, dayjsClass, _dayjsFactory) => {
  dayjsClass.prototype.addDays = function (days: number): Time {
    return dayjs.max(this.add(days, "day"), this.add(days * 24, "hour"));
  };
});

export function format(t: Time): string {
  return t.format("YYYY/MM/DD HH:mm:ss");
}

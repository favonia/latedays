import * as config from "../config/config";

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
 * @param original - the original deadline.
 * @param days - the number of applied late days.
 */
export function addDays(original: Time, days: number): Time {
  return dayjs.max(original.add(days, "day"), original.add(days * 24, "hour"));
}

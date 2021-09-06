import { DateTime } from "luxon";
import config from "../config/config";

// The type of time across the scripts.
export type Time = DateTime;

export function fromISO(date: string): Time {
  return DateTime.fromISO(date).setZone(config.timezone);
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
export function addDays(original: Time, days: number): Time {
  return DateTime.max(
    original.plus({ hours: 24 * days }),
    original.plus({ days: days })
  );
}

export function format(t: Time): string {
  return t
    .setLocale("en")
    .setZone(config.timezone)
    .toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS);
}

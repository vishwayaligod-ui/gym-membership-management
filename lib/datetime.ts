/**
 * Date/time helpers for gym-timezone aware scheduling.
 *
 * Membership `endDate` values are stored as UTC midnight of the expiry
 * calendar date (they are set from `YYYY-MM-DD` date inputs). All helpers
 * below work with UTC calendar dates for membership dates and with the
 * gym's IANA timezone for "today", so reminders fire on the correct
 * local day for the gym (default Asia/Kolkata) regardless of server TZ.
 */

/** Format a Date as 'YYYY-MM-DD' in the given IANA timezone. */
export function getDateStringInTimeZone(date: Date, timeZone: string): string {
  // en-CA yields ISO-like YYYY-MM-DD formatting.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts;
}

/** Add days to a 'YYYY-MM-DD' string (UTC-safe) and return 'YYYY-MM-DD'. */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** UTC [start, end) range covering the whole UTC calendar day of dateStr. */
export function getUtcDayRange(dateStr: string): { start: Date; end: Date } {
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Format a Date (interpreted as UTC calendar date) as 'DD MMM YYYY'. */
export function formatUtcDateForDisplay(date: Date): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

/** UTC 'YYYY-MM-DD' of a Date (used for receipt filenames). */
export function getUtcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

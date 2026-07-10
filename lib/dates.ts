// Pure date-key helpers — no React, no DB, no Expo imports (CLAUDE.md conventions).
// Every day-boundary decision in the app goes through these; nothing else may
// do inline date math (SPEC.md section 8.3).

const MS_PER_DAY = 86_400_000;

/** Local calendar date of a unix-ms timestamp as a YYYY-MM-DD key. */
export function toLocalDateKey(unixMs: number): string {
  const date = new Date(unixMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Signed calendar days from one date key to another. Keys parse as UTC dates,
 * so the count is exact across DST, month, and year boundaries.
 */
export function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((Date.parse(toKey) - Date.parse(fromKey)) / MS_PER_DAY);
}

/**
 * The Monday of the week containing a date key. "This week" everywhere in the
 * app means this Monday–Sunday range.
 */
export function startOfWeekKey(dateKey: string): string {
  const date = new Date(Date.parse(dateKey));
  const daysSinceMonday = (date.getUTCDay() + 6) % 7; // getUTCDay: 0 = Sunday
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

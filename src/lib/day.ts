// Daily boundaries. Everyone gets the same homes per calendar day in US Eastern time.

export const GAME_TZ = "America/New_York";
/** Day #1 of the game. */
export const LAUNCH_DAY = "2026-10-12";

const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: GAME_TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** "YYYY-MM-DD" for the Eastern-time calendar day containing `date`. */
export function dayKey(date: Date = new Date()): string {
  return fmt.format(date);
}

export function isDayKey(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
}

/** Calendar arithmetic on day keys (time zone free). */
export function addDays(key: string, n: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export function dayNumber(key: string): number {
  return daysBetween(LAUNCH_DAY, key) + 1;
}

/** Milliseconds until the next midnight in Eastern time. */
export function msUntilNextDay(now: Date = new Date()): number {
  const today = dayKey(now);
  // Binary search for the boundary: DST-safe without a time zone library.
  let lo = now.getTime();
  let hi = lo + 26 * 3_600_000;
  while (hi - lo > 1_000) {
    const mid = Math.floor((lo + hi) / 2);
    if (dayKey(new Date(mid)) === today) lo = mid;
    else hi = mid;
  }
  return hi - now.getTime();
}

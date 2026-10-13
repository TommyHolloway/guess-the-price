import { addDays } from "../day";
import { drawDay } from "../draw";
import { homeSource } from "./source";
import { gameStore, type DailySet } from "./store";

/** Homes featured in the last two weeks are skipped while the pool allows. */
const NO_REPEAT_DAYS = 14;

/** The day's set, drawing and saving it on first request (the nightly cron normally does this ahead of time). */
export async function getOrCreateDay(day: string): Promise<DailySet> {
  const store = gameStore();
  const existing = await store.getDay(day);
  if (existing) return existing;
  const pool = await homeSource().recentlySold(day);
  const recent = await store.homeIdsOn(Array.from({ length: NO_REPEAT_DAYS }, (_, i) => addDays(day, -(i + 1))));
  return store.saveDay({ day, homes: drawDay(pool, day, recent) });
}

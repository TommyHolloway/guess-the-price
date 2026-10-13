import { addDays, daysBetween } from "./day";
import { HOMES_PER_DAY, MAX_POINTS, type Tier } from "./scoring";

export type Guess = { guess: number; price: number; points: number; pctError: number; tier: Tier };

/** One day's play, as kept in the browser (and, later, in Supabase per player). */
export type DayPlay = { day: string; guesses: Guess[] };

export const isComplete = (p: DayPlay) => p.guesses.length >= HOMES_PER_DAY;
export const dayScore = (p: DayPlay) => p.guesses.reduce((s, g) => s + g.points, 0);
export const MAX_SCORE = HOMES_PER_DAY * MAX_POINTS;

export type Stats = {
  played: number;
  currentStreak: number;
  maxStreak: number;
  average: number;
  best: number;
  tiers: Record<Tier, number>;
  /** Final scores bucketed by 100: [0-99, 100-199, …, 400-500]. */
  distribution: number[];
};

/**
 * Streaks count consecutive completed days. Today's streak still stands if the last completed day is yesterday
 * (the player just hasn't played yet today).
 */
export function computeStats(history: Record<string, DayPlay>, today: string): Stats {
  const done = Object.values(history)
    .filter(isComplete)
    .sort((a, b) => a.day.localeCompare(b.day));
  const scores = done.map(dayScore);
  const tiers: Record<Tier, number> = { green: 0, yellow: 0, red: 0 };
  for (const p of done) for (const g of p.guesses) tiers[g.tier]++;
  const distribution = [0, 0, 0, 0, 0];
  for (const s of scores) distribution[Math.min(4, Math.floor(s / 100))]++;

  let maxStreak = 0;
  let run = 0;
  for (let i = 0; i < done.length; i++) {
    run = i > 0 && daysBetween(done[i - 1].day, done[i].day) === 1 ? run + 1 : 1;
    maxStreak = Math.max(maxStreak, run);
  }
  const last = done.at(-1);
  const alive = last && (last.day === today || last.day === addDays(today, -1));

  return {
    played: done.length,
    currentStreak: alive ? run : 0,
    maxStreak,
    average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    best: scores.length ? Math.max(...scores) : 0,
    tiers,
    distribution,
  };
}

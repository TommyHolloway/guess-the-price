import { rng } from "./random";

/** Below this many other guesses, there's no "% guessed higher" line yet. */
export const MIN_CROWD = 10;

export type Crowd = { count: number; higher: number };

export function crowdLine(c: Crowd | null): { pctHigher: number; count: number } | null {
  if (!c || c.count < MIN_CROWD) return null;
  return { pctHigher: Math.round((100 * c.higher) / c.count), count: c.count };
}

/**
 * A simulated crowd for the sample homes only, so the "% guessed higher" beat can be seen in development before
 * real players exist. Guesses scatter log-normally around the price, slightly high (people overestimate).
 */
export function simulatedCrowd(homeId: string, price: number, n = 240): number[] {
  const r = rng(`crowd:${homeId}`);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const z = Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
    out.push(Math.round(price * Math.exp(0.06 + 0.38 * z)));
  }
  return out;
}

export function countHigher(guesses: readonly number[], guess: number): Crowd {
  return { count: guesses.length, higher: guesses.filter((g) => g > guess).length };
}

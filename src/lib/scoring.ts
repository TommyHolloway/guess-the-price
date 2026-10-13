// Guessing and scoring. Pure functions, unit-tested.

export const MIN_PRICE = 50_000;
export const MAX_PRICE = 10_000_000;
export const MAX_POINTS = 100;
export const HOMES_PER_DAY = 5;

/** Error at which a guess scores nothing (60% off). Points fall linearly to it. */
const ZERO_POINTS_AT = 0.6;

export type Tier = "green" | "yellow" | "red";
export const TIER_EMOJI: Record<Tier, string> = { green: "🟩", yellow: "🟨", red: "🟥" };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Slider position (0..1) to a price on a log scale, rounded to a readable step. */
export function sliderToPrice(t: number): number {
  const raw = MIN_PRICE * Math.pow(MAX_PRICE / MIN_PRICE, clamp(t, 0, 1));
  return clamp(roundPrice(raw), MIN_PRICE, MAX_PRICE);
}

export function priceToSlider(price: number): number {
  const p = clamp(price, MIN_PRICE, MAX_PRICE);
  return Math.log(p / MIN_PRICE) / Math.log(MAX_PRICE / MIN_PRICE);
}

/** $1K steps under $1M, $5K steps under $3M, $25K steps above. */
export function roundPrice(p: number): number {
  const step = p < 1_000_000 ? 1_000 : p < 3_000_000 ? 5_000 : 25_000;
  return Math.round(p / step) * step;
}

/** Parse a typed price: "450000", "$450,000", "450k", "1.2m", "1.2 mil". Null when unreadable. */
export function parsePriceInput(input: string): number | null {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[$,\s]/g, "");
  const m = /^(\d+(?:\.\d+)?)(k|m|mil|million)?$/.exec(s);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const mult = m[2] === "k" ? 1_000 : m[2] ? 1_000_000 : 1;
  const price = Math.round(n * mult);
  return Number.isFinite(price) && price > 0 ? price : null;
}

export function pctError(guess: number, actual: number): number {
  return Math.abs(guess - actual) / actual;
}

export function points(guess: number, actual: number): number {
  const err = pctError(guess, actual);
  return Math.round(MAX_POINTS * Math.max(0, 1 - err / ZERO_POINTS_AT));
}

export function tier(guess: number, actual: number): Tier {
  const err = pctError(guess, actual);
  return err <= 0.05 ? "green" : err <= 0.15 ? "yellow" : "red";
}

/** "$212K", "$1.25M", "$950". */
export function formatPrice(p: number): string {
  const a = Math.abs(p);
  if (a >= 1_000_000) return `$${trim(a / 1_000_000, 2)}M`;
  if (a >= 1_000) return `$${trim(a / 1_000, a >= 100_000 ? 0 : 1)}K`;
  return `$${Math.round(a)}`;
}

export function formatFullPrice(p: number): string {
  return `$${Math.round(p).toLocaleString("en-US")}`;
}

function trim(n: number, digits: number): string {
  const s = n.toFixed(digits);
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
}

/** The fun line on the reveal, e.g. "Off by $212K. Too high." */
export function revealLine(guess: number, actual: number): string {
  const err = pctError(guess, actual);
  const diff = formatPrice(guess - actual);
  if (err <= 0.01) return "Dead on. Are you an appraiser?";
  if (err <= 0.05) return `Off by just ${diff}. Sharp eye.`;
  const dir = guess > actual ? "Too high" : "Too low";
  if (err <= 0.15) return `Off by ${diff}. ${dir}, but close.`;
  if (err <= 0.4) return `Off by ${diff}. ${dir}.`;
  return guess > actual ? `Off by ${diff}. Someone's been watching luxury TV.` : `Off by ${diff}. In this economy?`;
}

import { dayNumber } from "./day";
import { TIER_EMOJI, type Tier } from "./scoring";
import { MAX_SCORE } from "./stats";

const TIER_CODE: Record<Tier, string> = { green: "g", yellow: "y", red: "r" };
const CODE_TIER: Record<string, Tier> = { g: "green", y: "yellow", r: "red" };

export const encodeTiers = (tiers: Tier[]) => tiers.map((t) => TIER_CODE[t]).join("");
export const decodeTiers = (code: string): Tier[] =>
  [...code.slice(0, 10)].map((c) => CODE_TIER[c]).filter((t): t is Tier => Boolean(t));

export type ShareResult = { day: string; score: number; tiers: Tier[]; streak: number };

/** The share landing URL: it carries the result so link previews can render the score card. */
export function shareUrl(origin: string, r: ShareResult): string {
  const q = new URLSearchParams({ d: r.day, g: encodeTiers(r.tiers), t: String(r.score), s: String(r.streak) });
  return `${origin}/s?${q}`;
}

export function shareText(r: ShareResult): string {
  const lines = [
    `Guess the Price #${dayNumber(r.day)} 🏠 ${r.score}/${MAX_SCORE}`,
    r.tiers.map((t) => TIER_EMOJI[t]).join(""),
  ];
  if (r.streak > 1) lines.push(`🔥 ${r.streak}-day streak`);
  return lines.join("\n");
}

export function shareTargets(text: string, url: string) {
  const full = `${text}\n${url}`;
  return {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(full)}`,
    // iOS opens Messages with the body prefilled; "&body" is the form both iOS and Android accept.
    imessage: `sms:&body=${encodeURIComponent(full)}`,
  };
}

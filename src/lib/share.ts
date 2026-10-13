import { dayNumber } from "./day";
import { TIER_EMOJI, type Tier } from "./scoring";
import { rankFor } from "./rank";

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

/** Matches the result screen: rank and score, the emoji line, the streak. */
export function shareText(r: ShareResult): string {
  const rank = rankFor(r.score);
  const lines = [
    `Guess the Price #${dayNumber(r.day)} 🏠`,
    `${rank.emoji} ${rank.title} · ${r.score} pts`,
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

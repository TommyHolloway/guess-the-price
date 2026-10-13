import type { Metadata } from "next";
import Link from "next/link";
import { dayNumber, isDayKey } from "@/lib/day";
import { rankFor } from "@/lib/rank";
import { decodeTiers } from "@/lib/share";
import { TIER_EMOJI } from "@/lib/scoring";
import { MAX_SCORE } from "@/lib/stats";

type Search = Promise<{ d?: string; g?: string; t?: string; s?: string }>;

/** Shared results land here: the link preview shows the score card, the page invites a new player in. */
export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const { d = "", g = "", t = "0", s = "0" } = await searchParams;
  const og = `/api/og?${new URLSearchParams({ d, g, t, s })}`;
  const rank = rankFor(Math.min(MAX_SCORE, Number(t) || 0));
  const title = `${rank.emoji} ${rank.title} · ${t} pts on Guess the Price${isDayKey(d) ? ` #${dayNumber(d)}` : ""}`;
  const description = "5 homes that just sold. Guess the prices. Can you beat my score?";
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}

export default async function SharedResult({ searchParams }: { searchParams: Search }) {
  const { d = "", g = "", t = "0" } = await searchParams;
  const tiers = decodeTiers(g);
  const score = Math.min(MAX_SCORE, Number(t) || 0);
  const rank = rankFor(score);
  return (
    <div className="result-card relative mx-auto mt-6 max-w-md px-6 pt-9 pb-9 text-center text-white">
      <p className="font-display text-sm tracking-[0.2em] text-gold">
        A FRIEND PLAYED{isDayKey(d) ? ` #${dayNumber(d)}` : ""}
      </p>
      <div className="mt-2 text-6xl" aria-hidden>
        {rank.emoji}
      </div>
      <h1 className="font-display text-5xl drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]">{rank.title}</h1>
      <p className="font-display mt-1 text-4xl text-gold">{score} pts</p>
      <p className="mt-3 text-3xl tracking-widest">{tiers.map((x) => TIER_EMOJI[x]).join("")}</p>
      <p className="mt-4 text-white/85">5 homes that just sold. Guess their prices. Can you beat it?</p>
      <Link href="/" className="btn-toy font-display mt-5 block bg-brand py-4 text-2xl text-white">
        Play today&apos;s homes
      </Link>
    </div>
  );
}

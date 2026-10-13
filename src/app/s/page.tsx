import type { Metadata } from "next";
import Link from "next/link";
import { dayNumber, isDayKey } from "@/lib/day";
import { decodeTiers } from "@/lib/share";
import { TIER_EMOJI } from "@/lib/scoring";
import { MAX_SCORE } from "@/lib/stats";

type Search = Promise<{ d?: string; g?: string; t?: string; s?: string }>;

/** Shared results land here: the link preview shows the score card, the page invites a new player in. */
export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const { d = "", g = "", t = "0", s = "0" } = await searchParams;
  const og = `/api/og?${new URLSearchParams({ d, g, t, s })}`;
  const title = `${t}/${MAX_SCORE} on Guess the Price${isDayKey(d) ? ` #${dayNumber(d)}` : ""}`;
  const description = "Guess what 5 recently sold homes went for. Can you beat it?";
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
  return (
    <div className="mx-auto mt-8 max-w-md rounded-2xl border border-line bg-card p-6 text-center">
      <p className="text-sm text-muted">A friend scored{isDayKey(d) ? ` on #${dayNumber(d)}` : ""}</p>
      <p className="text-6xl font-extrabold tabular-nums">
        {Math.min(MAX_SCORE, Number(t) || 0)}
        <span className="text-2xl text-muted">/{MAX_SCORE}</span>
      </p>
      <p className="mt-2 text-3xl">{tiers.map((x) => TIER_EMOJI[x]).join("")}</p>
      <p className="mt-4">Five homes that sold this month. Guess their prices.</p>
      <Link href="/" className="mt-5 block rounded-xl bg-brand py-3 text-lg font-extrabold text-brand-ink">
        Play today&apos;s homes
      </Link>
    </div>
  );
}

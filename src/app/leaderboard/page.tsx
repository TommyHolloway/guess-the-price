import type { Metadata } from "next";
import Link from "next/link";
import { gameStore } from "@/lib/data/store";
import { dayKey, dayNumber } from "@/lib/day";
import { TIER_EMOJI } from "@/lib/scoring";
import { STATES } from "@/lib/states";

export const metadata: Metadata = { title: "Leaderboard · Guess the Price" };
export const dynamic = "force-dynamic";

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state: raw } = await searchParams;
  const state = raw && STATES[raw] ? raw : undefined;
  const day = dayKey();
  const rows = await gameStore().leaderboard(day, state);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-4xl text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]">
        Leaderboard <span className="text-lg text-gold">#{dayNumber(day)}</span>
      </h1>
      <form className="flex gap-2" action="/leaderboard">
        <select
          name="state"
          defaultValue={state ?? ""}
          className="flex-1 rounded-xl border-[3px] border-white bg-card px-2 py-2"
        >
          <option value="">🇺🇸 National</option>
          {Object.entries(STATES).map(([code, s]) => (
            <option key={code} value={code}>
              {s.name}
            </option>
          ))}
        </select>
        <button className="btn-toy bg-brand px-5 text-white">Show</button>
      </form>
      <ol className="panel divide-y divide-line overflow-hidden">
        {rows.length === 0 && (
          <li className="p-4 text-center text-sm text-muted">
            No scores yet{state ? ` in ${STATES[state].name}` : ""} today.{" "}
            <Link href="/" className="underline">
              Be the first
            </Link>
            .
          </li>
        )}
        {rows.map((r, i) => (
          <li key={`${r.playerId}`} className="flex items-center gap-3 px-4 py-2.5">
            <span className="font-display w-7 text-center text-lg text-muted tabular-nums">
              {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
            </span>
            <span className="flex-1 truncate font-medium">
              {r.name ?? "Anonymous"} {r.state && <span className="text-xs text-muted">{r.state}</span>}
            </span>
            <span className="text-sm">{r.tiers.map((t) => TIER_EMOJI[t]).join("")}</span>
            <span className="font-display w-12 text-right text-xl tabular-nums">{r.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

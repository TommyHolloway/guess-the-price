"use client";
import { useSyncExternalStore } from "react";
import { loadHistory } from "@/lib/client/storage";
import { dayKey } from "@/lib/day";
import { TIER_EMOJI } from "@/lib/scoring";
import { computeStats, type Stats } from "@/lib/stats";

const noop = () => () => {};
let cache: { key: string; stats: Stats } | null = null;

/** Reads stats from this browser's history (stable snapshot so useSyncExternalStore doesn't loop). */
function snapshot(): Stats {
  const raw = (() => {
    try {
      return localStorage.getItem("gtp:history") ?? "";
    } catch {
      return "";
    }
  })();
  const key = `${dayKey()}|${raw}`;
  if (cache?.key !== key) cache = { key, stats: computeStats(loadHistory(), dayKey()) };
  return cache.stats;
}

export default function StatsView() {
  const stats = useSyncExternalStore(noop, snapshot, () => null);
  if (!stats) return null;
  const tiles = [
    ["Played", stats.played],
    ["Streak", stats.currentStreak],
    ["Best streak", stats.maxStreak],
    ["Average", stats.average],
    ["Best", stats.best],
  ] as const;
  const maxBucket = Math.max(1, ...stats.distribution);
  const totalGuesses = stats.tiers.green + stats.tiers.yellow + stats.tiers.red;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Your stats</h1>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {tiles.map(([label, v]) => (
          <div key={label} className="rounded-xl border border-line bg-card p-3 text-center">
            <div className="text-2xl font-extrabold tabular-nums">{v}</div>
            <div className="text-xs text-muted">{label}</div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="font-bold">Score distribution</h2>
        <div className="mt-2 space-y-1.5">
          {stats.distribution.map((n, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-16 text-muted tabular-nums">{i === 4 ? "400–500" : `${i * 100}–${i * 100 + 99}`}</span>
              <div className="h-5 rounded bg-brand" style={{ width: `${Math.max(4, (n / maxBucket) * 100)}%` }} />
              <span className="tabular-nums">{n}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="font-bold">Accuracy</h2>
        <p className="mt-1 text-sm text-muted">
          {totalGuesses
            ? `${TIER_EMOJI.green} ${stats.tiers.green} within 5% · ${TIER_EMOJI.yellow} ${stats.tiers.yellow} within 15% · ${TIER_EMOJI.red} ${stats.tiers.red} further off`
            : "Finish a day to see how close you get."}
        </p>
      </section>
    </div>
  );
}

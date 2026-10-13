"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { PublicHome } from "@/lib/homes";
import { loadHistory, loadPrefs, playerId, savePrefs } from "@/lib/client/storage";
import { buzz, play } from "@/lib/client/sound";
import { isStreakMilestone, nextRank, rankFor } from "@/lib/rank";
import { formatPrice, TIER_EMOJI, type Tier } from "@/lib/scoring";
import { computeStats, dayScore, type DayPlay } from "@/lib/stats";
import { STATES } from "@/lib/states";
import AdSlot from "./AdSlot";
import Confetti from "./Confetti";
import Countdown from "./Countdown";
import ShareCard from "./ShareCard";

const TILE_BG: Record<Tier, string> = { green: "bg-green", yellow: "bg-yellow", red: "bg-red" };
const TILE_BORDER: Record<Tier, string> = { green: "border-green", yellow: "border-yellow", red: "border-red" };

/** The end of the day: the result card (what the share image shows), share actions, the score reel. */
export default function Result({
  day,
  dayNumber,
  homes,
  play: dayPlay,
  justFinished,
}: {
  day: string;
  dayNumber: number;
  homes: PublicHome[];
  play: DayPlay;
  justFinished: boolean;
}) {
  const score = dayScore(dayPlay);
  const stats = computeStats(loadHistory(), day);
  const tiers = dayPlay.guesses.map((g) => g.tier);
  const rank = rankFor(score);
  const up = nextRank(score);
  const milestone = isStreakMilestone(stats.currentStreak);

  useEffect(() => {
    if (!justFinished) return;
    play("fanfare");
    buzz([40, 60, 40, 60, 80]);
  }, [justFinished]);

  return (
    <div className="mx-auto grid max-w-xl gap-4 lg:max-w-5xl lg:grid-cols-2 lg:items-start" data-testid="final">
      <div className="min-w-0 space-y-4">
        <section className="result-card relative px-5 pt-6 pb-6 text-center" data-testid="result-card">
          {justFinished && (milestone || rank.min >= 300) && <Confetti seed={`final:${day}`} count={60} />}
          <p className="font-display text-sm tracking-[0.2em] text-gold">GUESS THE PRICE #{dayNumber}</p>
          <div className={`mt-2 text-6xl ${justFinished ? "animate-pop" : ""}`} aria-hidden>
            {rank.emoji}
          </div>
          <h1 className="font-display text-5xl text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]">{rank.title}</h1>
          <p className="font-display mt-1 text-4xl text-gold">{score} pts</p>
          <div className="mt-5 flex justify-center gap-2.5 [perspective:600px]">
            {tiers.map((t, i) => (
              <span
                key={i}
                className={`animate-flip h-12 w-12 rounded-xl border-4 border-white ${TILE_BG[t]} shadow-[0_5px_0_rgba(0,0,0,0.35)]`}
                style={{ animationDelay: justFinished ? `${200 + i * 140}ms` : "0ms" }}
                aria-label={t}
              />
            ))}
          </div>
          <p className="mt-5 font-semibold text-white/90">
            {milestone ? (
              <span className="font-display text-xl text-gold">🔥 {stats.currentStreak}-day streak! 🔥</span>
            ) : stats.currentStreak > 1 ? (
              `🔥 ${stats.currentStreak}-day streak`
            ) : (
              "🔥 Streak started. Come back tomorrow!"
            )}
          </p>
          {up && (
            <p className="mt-1 text-sm text-white/70">
              {up.needed} pts from {up.rank.emoji} {up.rank.title}
            </p>
          )}
        </section>

        <section className="card p-4">
          <ShareCard result={{ day, score, tiers, streak: stats.currentStreak }} />
        </section>
      </div>

      <div className="min-w-0 space-y-4">
        <section className="card p-4">
          <h2 className="font-display text-xl">Today&apos;s homes</h2>
          <ol className="mt-2 space-y-2">
            {dayPlay.guesses.map((g, i) => (
              <li
                key={i}
                className={`flex items-center gap-3 rounded-xl border-l-[6px] bg-bg p-2 ${TILE_BORDER[g.tier]}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={homes[i].photos[0]} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {homes[i].city}, {homes[i].state}
                  </p>
                  <p className="text-xs text-muted tabular-nums">
                    You {formatPrice(g.guess)} · Sold {formatPrice(g.price)}
                  </p>
                </div>
                <span className="font-display text-xl tabular-nums">
                  {TIER_EMOJI[g.tier]} {g.points}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <PostScore day={day} guesses={dayPlay.guesses.map((g) => g.guess)} />

        <p className="text-center text-sm text-white/75">
          New homes in <Countdown /> ·{" "}
          <Link href="/stats" className="underline">
            Your stats
          </Link>
        </p>
        <AdSlot id="final" />
      </div>
    </div>
  );
}

function PostScore({ day, guesses }: { day: string; guesses: number[] }) {
  const [prefs, setPrefs] = useState(loadPrefs);
  const [status, setStatus] = useState<"idle" | "sending" | "posted" | "error">("idle");

  const post = async () => {
    setStatus("sending");
    savePrefs(prefs);
    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        day,
        playerId: playerId(),
        name: prefs.name?.trim() || undefined,
        state: prefs.state || undefined,
        guesses,
      }),
    }).catch(() => null);
    setStatus(res?.ok ? "posted" : "error");
  };

  if (status === "posted")
    return (
      <p className="text-center text-sm">
        Posted!{" "}
        <Link href={`/leaderboard${prefs.state ? `?state=${prefs.state}` : ""}`} className="font-bold underline">
          See the leaderboard
        </Link>
      </p>
    );

  return (
    <section className="card p-4">
      <h2 className="font-display text-xl">Join today&apos;s leaderboard</h2>
      <div className="mt-2 flex gap-2">
        <input
          value={prefs.name ?? ""}
          onChange={(e) => setPrefs({ ...prefs, name: e.target.value })}
          placeholder="Name (optional)"
          maxLength={24}
          className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2"
        />
        <select
          value={prefs.state ?? ""}
          onChange={(e) => setPrefs({ ...prefs, state: e.target.value })}
          className="rounded-lg border border-line bg-white px-2 py-2"
          aria-label="Your state"
        >
          <option value="">State</option>
          {Object.keys(STATES).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <button onClick={post} disabled={status === "sending"} className="btn-toy mt-2 w-full bg-ink py-2.5 text-white">
        Post my score
      </button>
      {status === "error" && <p className="mt-2 text-sm text-red">Couldn&apos;t post. Try again.</p>}
    </section>
  );
}

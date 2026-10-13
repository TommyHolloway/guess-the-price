"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Agent, PublicHome } from "@/lib/homes";
import { loadHistory, loadPrefs, playerId, saveDayPlay, savePrefs } from "@/lib/client/storage";
import { formatFullPrice, formatPrice, HOMES_PER_DAY, revealLine, TIER_EMOJI, type Tier } from "@/lib/scoring";
import { computeStats, dayScore, MAX_SCORE, type DayPlay, type Guess } from "@/lib/stats";
import { STATES } from "@/lib/states";
import AdSlot from "./AdSlot";
import Countdown from "./Countdown";
import MapPanel from "./MapPanel";
import Photos from "./Photos";
import PriceInput from "./PriceInput";
import ShareCard from "./ShareCard";

type Daily = { day: string; dayNumber: number; homes: PublicHome[] };
type Reveal = Guess & { host: Agent | null; listingAgent: Agent | null };

const START_GUESS = 400_000;
const TIER_TEXT: Record<Tier, string> = { green: "text-green", yellow: "text-yellow", red: "text-red" };

export default function Game() {
  const [daily, setDaily] = useState<Daily | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [play, setPlay] = useState<DayPlay | null>(null);
  const [guess, setGuess] = useState(START_GUESS);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/daily")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: Daily) => {
        setDaily(d);
        setPlay(loadHistory()[d.day] ?? { day: d.day, guesses: [] });
      })
      .catch(() => setError("Couldn't load today's homes. Try again in a moment."));
  }, []);

  if (error) return <p className="mt-10 text-center text-muted">{error}</p>;
  if (!daily || !play) return <p className="mt-10 text-center text-muted">Loading today&apos;s homes…</p>;

  const done = play.guesses.length >= HOMES_PER_DAY;
  if (done && !reveal) return <Final daily={daily} play={play} />;

  const index = reveal ? play.guesses.length - 1 : play.guesses.length;
  const home = daily.homes[index];

  const lockIn = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: daily.day, index, guess }),
      });
      if (res.status === 409) {
        // Midnight ET passed mid-game: start the new day.
        window.location.reload();
        return;
      }
      if (!res.ok) throw new Error();
      const r = await res.json();
      const g: Guess = { guess, price: r.price, points: r.points, pctError: r.pctError, tier: r.tier };
      const next = { ...play, guesses: [...play.guesses, g] };
      saveDayPlay(next);
      setPlay(next);
      setReveal({ ...g, host: r.host, listingAgent: r.listingAgent });
    } catch {
      setError("Something went wrong scoring that guess. Reload to continue.");
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    setReveal(null);
    setGuess(START_GUESS);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          #{daily.dayNumber} · Home {index + 1} of {HOMES_PER_DAY}
        </span>
        <span className="flex gap-1" aria-label="Progress">
          {daily.homes.map((_, i) => (
            <span key={i}>{play.guesses[i] ? TIER_EMOJI[play.guesses[i].tier] : i === index ? "🏠" : "⬜"}</span>
          ))}
        </span>
      </div>

      <MapPanel home={home} />
      <Photos photos={home.photos} alt={`Home in ${home.city}, ${home.state}`} />
      <Facts home={home} />

      <section className="rounded-2xl border border-line bg-card p-4">
        {reveal ? (
          <RevealCard reveal={reveal} last={index === HOMES_PER_DAY - 1} onNext={next} />
        ) : (
          <>
            <PriceInput value={guess} onChange={setGuess} />
            <button
              onClick={lockIn}
              disabled={busy}
              className="mt-4 w-full rounded-xl bg-brand py-3 text-lg font-extrabold text-brand-ink disabled:opacity-60"
            >
              {busy ? "Checking…" : "Lock in guess"}
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function Facts({ home }: { home: PublicHome }) {
  const items = [
    [home.beds, "beds"],
    [home.baths, "baths"],
    [home.sqft.toLocaleString("en-US"), "sq ft"],
    [home.yearBuilt ?? "—", "built"],
  ] as const;
  return (
    <div className="rounded-2xl border border-line bg-card p-3">
      <div className="grid grid-cols-4 text-center">
        {items.map(([v, label]) => (
          <div key={label}>
            <div className="text-lg font-bold">{v}</div>
            <div className="text-xs text-muted">{label}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-sm text-muted">
        {home.propertyType === "condo" ? "Condo" : "Single-family home"} in {home.city}, {home.state}
      </p>
    </div>
  );
}

function RevealCard({ reveal, last, onNext }: { reveal: Reveal; last: boolean; onNext: () => void }) {
  const credit = reveal.host ?? reveal.listingAgent;
  return (
    <div className="text-center" data-testid="reveal">
      <p className="text-sm text-muted">Sold for</p>
      <p className="text-4xl font-extrabold tabular-nums">{formatFullPrice(reveal.price)}</p>
      <p className="mt-1 text-sm text-muted">You guessed {formatFullPrice(reveal.guess)}</p>
      <div className="mt-3 flex items-center justify-center gap-4">
        <span className={`text-2xl font-extrabold ${TIER_TEXT[reveal.tier]}`}>
          {TIER_EMOJI[reveal.tier]} {Math.round(reveal.pctError * 100)}% off
        </span>
        <span className="text-2xl font-extrabold">+{reveal.points}</span>
      </div>
      <p className="mt-2 font-medium">{revealLine(reveal.guess, reveal.price)}</p>
      {credit && (
        <p className="mt-3 text-xs text-muted">
          {reveal.host ? "Today's host: " : "Listed by "}
          {credit.name}
          {credit.brokerage ? `, ${credit.brokerage}` : ""}
        </p>
      )}
      <button onClick={onNext} className="mt-4 w-full rounded-xl bg-ink py-3 text-lg font-extrabold text-white">
        {last ? "See your score" : "Next home →"}
      </button>
      <AdSlot id="reveal" />
    </div>
  );
}

function Final({ daily, play }: { daily: Daily; play: DayPlay }) {
  const score = dayScore(play);
  const stats = computeStats(loadHistory(), daily.day);
  const tiers = play.guesses.map((g) => g.tier);
  return (
    <div className="space-y-4" data-testid="final">
      <section className="rounded-2xl border border-line bg-card p-5 text-center">
        <p className="text-sm text-muted">Guess the Price #{daily.dayNumber}</p>
        <p className="text-6xl font-extrabold tabular-nums">
          {score}
          <span className="text-2xl text-muted">/{MAX_SCORE}</span>
        </p>
        <p className="mt-1 text-sm">
          🔥 {stats.currentStreak}-day streak · best {stats.maxStreak}
        </p>
        <ul className="mt-4 divide-y divide-line text-left text-sm">
          {play.guesses.map((g, i) => (
            <li key={i} className="flex items-center justify-between py-2">
              <span>
                {TIER_EMOJI[g.tier]} {daily.homes[i].city}, {daily.homes[i].state}
              </span>
              <span className="tabular-nums text-muted">
                {formatPrice(g.guess)} vs {formatPrice(g.price)} · <b className="text-ink">{g.points}</b>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-card p-4">
        <ShareCard result={{ day: daily.day, score, tiers, streak: stats.currentStreak }} />
      </section>

      <PostScore day={daily.day} guesses={play.guesses.map((g) => g.guess)} />

      <p className="text-center text-sm text-muted">
        New homes in <Countdown /> ·{" "}
        <Link href="/stats" className="underline">
          Your stats
        </Link>
      </p>
      <AdSlot id="final" />
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
    <section className="rounded-2xl border border-line bg-card p-4">
      <h2 className="font-bold">Join today&apos;s leaderboard</h2>
      <div className="mt-2 flex gap-2">
        <input
          value={prefs.name ?? ""}
          onChange={(e) => setPrefs({ ...prefs, name: e.target.value })}
          placeholder="Name (optional)"
          maxLength={24}
          className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2"
        />
        <select
          value={prefs.state ?? ""}
          onChange={(e) => setPrefs({ ...prefs, state: e.target.value })}
          className="rounded-lg border border-line px-2 py-2"
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
      <button
        onClick={post}
        disabled={status === "sending"}
        className="mt-2 w-full rounded-xl bg-ink py-2.5 font-bold text-white disabled:opacity-60"
      >
        Post my score
      </button>
      {status === "error" && <p className="mt-2 text-sm text-red">Couldn&apos;t post. Try again.</p>}
    </section>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import type { PublicHome } from "@/lib/homes";
import { loadHistory, playerId, saveDayPlay } from "@/lib/client/storage";
import { HOMES_PER_DAY } from "@/lib/scoring";
import { computeStats, type DayPlay, type Guess } from "@/lib/stats";
import Hud from "./Hud";
import MapPanel from "./MapPanel";
import Photos from "./Photos";
import PriceInput from "./PriceInput";
import Result from "./Result";
import RevealSequence, { type Reveal } from "./RevealSequence";
import StartScreen from "./StartScreen";

type Daily = { day: string; dayNumber: number; homes: PublicHome[] };

const START_GUESS = 400_000;

export default function Game() {
  const [daily, setDaily] = useState<Daily | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [play, setPlay] = useState<DayPlay | null>(null);
  const [guess, setGuess] = useState(START_GUESS);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  /** False while the current reveal is still in suspense: its tile and points stay hidden. */
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Set when the last reveal is dismissed, so the result screen celebrates once (not on every revisit). */
  const [justFinished, setJustFinished] = useState(false);
  /** Past the start screen. */
  const [started, setStarted] = useState(false);
  /** The "Home 3 of 5" card shown between homes (index of the next home), or null. */
  const [between, setBetween] = useState<number | null>(null);
  const betweenTimer = useRef<number | undefined>(undefined);

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
  if (done && !reveal)
    return (
      <Result day={daily.day} dayNumber={daily.dayNumber} homes={daily.homes} play={play} justFinished={justFinished} />
    );

  if (!started)
    return (
      <StartScreen
        dayNumber={daily.dayNumber}
        streak={computeStats(loadHistory(), daily.day).currentStreak}
        resumeAt={play.guesses.length}
        onPlay={() => setStarted(true)}
      />
    );

  const index = reveal ? play.guesses.length - 1 : play.guesses.length;
  const home = daily.homes[index];
  const shownGuesses = play.guesses.filter((_, i) => i < index || revealed);
  const score = shownGuesses.reduce((sum, g) => sum + g.points, 0);

  const lockIn = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: daily.day, index, guess, playerId: playerId() }),
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
      setRevealed(false);
      setReveal({ ...g, host: r.host, listingAgent: r.listingAgent, crowd: r.crowd });
    } catch {
      setError("Something went wrong scoring that guess. Reload to continue.");
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    if (play.guesses.length >= HOMES_PER_DAY) setJustFinished(true);
    else {
      setBetween(play.guesses.length);
      clearTimeout(betweenTimer.current);
      betweenTimer.current = window.setTimeout(() => setBetween(null), 900);
    }
    setReveal(null);
    setGuess(START_GUESS);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto grid max-w-xl gap-3 lg:max-w-none lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_auto_auto_1fr] lg:gap-x-6 lg:gap-y-4">
      <div className="lg:col-span-2">
        <Hud dayNumber={daily.dayNumber} tiers={shownGuesses.map((g) => g.tier)} current={index} score={score} />
      </div>

      {between !== null && (
        <button
          className="fixed inset-0 z-40 grid place-items-center overflow-hidden bg-[#1c0f52]/40 backdrop-blur-[2px]"
          onClick={() => setBetween(null)}
          aria-label="Continue"
          data-testid="between"
        >
          <div className="interstitial stage px-10 py-6 text-center">
            <p className="font-display text-sm tracking-[0.25em] text-gold">NEXT UP</p>
            <p className="font-display text-5xl text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]">
              Home {between + 1}
              <span className="text-2xl text-white/70"> of {HOMES_PER_DAY}</span>
            </p>
            <p className="mt-1 font-semibold text-white/90">📍 {daily.homes[between].stateName}</p>
          </div>
        </button>
      )}

      <div className="lg:col-start-2 lg:row-start-2">
        <MapPanel home={home} />
      </div>
      <div className="lg:col-start-1 lg:row-span-3 lg:row-start-2">
        <Photos photos={home.photos} alt={`Home in ${home.city}, ${home.state}`} />
      </div>
      <div className="lg:col-start-2 lg:row-start-3">
        <Facts home={home} />
      </div>

      {/* Phones: a bottom sheet that is always on screen. Tablets: inline. Desktop: the last card in the right column. */}
      <BottomSheet>
        {reveal ? (
          <RevealSequence
            key={index}
            reveal={reveal}
            first={index === 0}
            last={index === HOMES_PER_DAY - 1}
            onNext={next}
            onRevealed={() => setRevealed(true)}
          />
        ) : (
          <>
            <PriceInput value={guess} onChange={setGuess} />
            <button
              onClick={lockIn}
              disabled={busy}
              className="btn-toy mt-3 w-full bg-brand py-3.5 text-xl text-brand-ink"
            >
              {busy ? "Checking…" : "Lock in guess"}
            </button>
          </>
        )}
      </BottomSheet>
    </div>
  );
}

/** Fixed to the bottom on phones (with a spacer so content can scroll clear of it); inline on tablets and desktop. */
function BottomSheet({ children }: { children: React.ReactNode }) {
  const [height, setHeight] = useState(0);
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return (
    <>
      <div className="md:hidden" style={{ height }} aria-hidden />
      <section
        ref={setEl}
        className="pb-safe fixed inset-x-0 bottom-0 z-20 rounded-t-3xl border-t border-line bg-card/95 px-4 pt-4 shadow-[0_-8px_30px_rgb(0_0_0/0.08)] backdrop-blur md:static md:rounded-2xl md:border md:bg-card md:p-5 md:shadow-sm md:backdrop-blur-none lg:col-start-2 lg:row-start-4 lg:self-start"
      >
        <div className="mx-auto max-w-xl">{children}</div>
      </section>
    </>
  );
}

function Facts({ home }: { home: PublicHome }) {
  const items = [
    [home.beds, "bd"],
    [home.baths, "ba"],
    [home.sqft.toLocaleString("en-US"), "sq ft"],
    [home.yearBuilt ?? "—", "built"],
  ] as const;
  return (
    <div className="rounded-2xl border border-line bg-card px-3 py-2.5 lg:p-4">
      <div className="grid grid-cols-4 divide-x divide-line text-center">
        {items.map(([v, label]) => (
          <div key={label}>
            <div className="text-base font-bold tabular-nums lg:text-xl">{v}</div>
            <div className="text-[11px] tracking-wide text-muted uppercase">{label}</div>
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-center text-xs text-muted lg:mt-3 lg:text-sm">
        {home.propertyType === "condo" ? "Condo" : "Single-family home"} in {home.city}, {home.state}
      </p>
    </div>
  );
}

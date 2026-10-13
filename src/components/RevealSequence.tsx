"use client";
import { useEffect, useRef, useState } from "react";
import type { Agent } from "@/lib/homes";
import { buzz, play } from "@/lib/client/sound";
import { formatFullPrice, revealLine, TIER_EMOJI, type Tier } from "@/lib/scoring";
import type { Guess } from "@/lib/stats";
import AdSlot from "./AdSlot";
import Confetti from "./Confetti";
import PriceScale from "./PriceScale";

export type Reveal = Guess & {
  host: Agent | null;
  listingAgent: Agent | null;
  crowd: { pctHigher: number; count: number } | null;
};

type Stage = "suspense" | "count" | "done";

/** The first reveal of the day gets the full drumroll; homes 2 to 5 a quick one. Any tap skips to the result. */
const TIMING = { first: { suspense: 1400, count: 1000 }, quick: { suspense: 550, count: 550 } };
const WAY_OFF = 0.4;
const TIER_TEXT: Record<Tier, string> = { green: "text-green", yellow: "text-yellow-ink", red: "text-red" };
const TIER_BADGE: Record<Tier, string> = { green: "NAILED IT!", yellow: "CLOSE!", red: "MISSED" };

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export default function RevealSequence({
  reveal,
  first,
  last,
  onNext,
  onRevealed,
}: {
  reveal: Reveal;
  first: boolean;
  last: boolean;
  onNext: () => void;
  /** Called once the result is showing, so the rest of the screen (score, tiles) can catch up without spoiling it. */
  onRevealed: () => void;
}) {
  const timing = first ? TIMING.first : TIMING.quick;
  const [stage, setStage] = useState<Stage>("suspense");
  const [progress, setProgress] = useState(0);
  const skipped = useRef(false);

  // Suspense, then the count. Reduced motion goes straight to the result.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => finish(), 0);
      return () => clearTimeout(t);
    }
    play(first ? "drumroll" : "drumrollShort");
    const t = setTimeout(() => setStage((s) => (s === "suspense" ? "count" : s)), timing.suspense);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stage !== "count") return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / timing.count);
      setProgress(easeOut(t));
      if (t < 1) raf = requestAnimationFrame(step);
      else finish();
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function finish() {
    if (skipped.current) return;
    skipped.current = true;
    setProgress(1);
    setStage("done");
    onRevealed();
    if (reveal.tier === "green") {
      play("nailed");
      buzz([30, 40, 30]);
    } else if (reveal.tier === "yellow") {
      play("close");
      buzz(30);
    } else {
      play("miss");
      buzz(reveal.pctError > WAY_OFF ? [80, 50, 80] : 60);
    }
  }

  const done = stage === "done";
  const shown = reveal.guess + (reveal.price - reveal.guess) * progress;
  const credit = reveal.host ?? reveal.listingAgent;
  const shake = done && reveal.pctError > WAY_OFF;

  return (
    <div
      className={`relative text-center ${shake ? "animate-shake" : ""}`}
      data-testid="reveal"
      data-stage={stage}
      onClick={() => !done && finish()}
    >
      {done && reveal.tier === "green" && <Confetti seed={`${reveal.price}:${reveal.guess}`} />}

      {stage === "suspense" ? (
        <div className="py-2">
          <p className="text-xs font-bold tracking-[0.2em] text-muted uppercase">You locked in</p>
          <p className="font-display text-4xl tabular-nums">{formatFullPrice(reveal.guess)}</p>
          <p className="mt-3 text-lg font-bold" data-testid="crowd">
            {reveal.crowd ? (
              <>
                <span className="font-display text-2xl text-brand">{reveal.crowd.pctHigher}%</span> of players guessed
                higher
              </>
            ) : (
              "You're one of the first to guess this home"
            )}
          </p>
          <div className="mt-4 flex justify-center gap-1.5" aria-label="Revealing">
            {[0, 1, 2].map((i) => (
              <span key={i} className="drum-dot" style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">Tap to skip</p>
        </div>
      ) : (
        <>
          <p className="text-xs font-bold tracking-[0.2em] text-muted uppercase">Sold for</p>
          <p className={`font-display text-5xl tabular-nums ${done ? "animate-pop" : ""}`}>{formatFullPrice(shown)}</p>
          <PriceScale guess={reveal.guess} price={reveal.price} progress={progress} tier={reveal.tier} />
          <div className={`transition-opacity duration-200 ${done ? "opacity-100" : "opacity-0"}`}>
            <div className="flex items-center justify-center gap-3">
              <span
                className={`font-display rounded-full px-3 py-1 text-sm tracking-wide text-white ${
                  { green: "bg-green", yellow: "bg-yellow text-ink", red: "bg-red" }[reveal.tier]
                } ${done ? "animate-stamp" : ""}`}
              >
                {TIER_EMOJI[reveal.tier]} {TIER_BADGE[reveal.tier]}
              </span>
              <span className={`font-display text-2xl ${TIER_TEXT[reveal.tier]}`}>
                {Math.round(reveal.pctError * 100)}% off
              </span>
              <span className="font-display text-3xl">+{reveal.points}</span>
            </div>
            <p className="mt-1.5 font-semibold">{revealLine(reveal.guess, reveal.price)}</p>
            {credit && (
              <p className="mt-2 text-xs text-muted">
                {reveal.host ? "Today's host: " : "Listed by "}
                {credit.name}
                {credit.brokerage ? `, ${credit.brokerage}` : ""}
              </p>
            )}
            <button
              onClick={onNext}
              disabled={!done}
              autoFocus
              className="btn-toy mt-3 w-full bg-ink py-3.5 text-lg text-white"
            >
              {last ? "See your score" : "Next home →"}
            </button>
            {done && <AdSlot id="reveal" />}
          </div>
        </>
      )}
    </div>
  );
}

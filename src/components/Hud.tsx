"use client";
import type { Tier } from "@/lib/scoring";
import AnimatedNumber from "./AnimatedNumber";
import SoundToggle from "./SoundToggle";

const TILE: Record<Tier, string> = { green: "bg-green", yellow: "bg-yellow", red: "bg-red" };

/** The score bar: day number, one tile per home (flipping to its colour as it's revealed), running score, sound. */
export default function Hud({
  dayNumber,
  tiers,
  current,
  score,
}: {
  dayNumber: number;
  /** Revealed tiers so far. */
  tiers: Tier[];
  /** Index of the home being played, or -1 when none is. */
  current: number;
  score: number;
}) {
  return (
    <div className="hud flex items-center gap-2 px-3 py-2" data-testid="hud">
      <span className="font-display text-sm text-gold">#{dayNumber}</span>
      <div className="flex flex-1 justify-center gap-1.5 [perspective:400px]" aria-label="Progress">
        {Array.from({ length: 5 }, (_, i) => {
          const t = tiers[i];
          return (
            <span
              key={`${i}-${t ?? "x"}`}
              className={`grid h-7 w-7 place-items-center rounded-md border-2 text-xs font-bold lg:h-9 lg:w-9 lg:text-sm ${
                t
                  ? `animate-flip border-white ${TILE[t]}`
                  : i === current
                    ? "animate-pulse-soft border-gold bg-white/15 text-gold"
                    : "border-white/30 text-white/40"
              }`}
              aria-label={t ? `Home ${i + 1}: ${t}` : `Home ${i + 1}`}
            >
              {t ? "" : i === current ? "?" : i + 1}
            </span>
          );
        })}
      </div>
      <span className="font-display min-w-[4.5rem] text-right text-xl text-white tabular-nums" data-testid="score">
        <AnimatedNumber value={score} />
        <span className="ml-0.5 text-xs text-gold">PTS</span>
      </span>
      <SoundToggle className="bg-white/10" />
    </div>
  );
}

"use client";
import { useState } from "react";
import { play } from "@/lib/client/sound";
import { TIER_EMOJI } from "@/lib/scoring";
import SoundToggle from "./SoundToggle";

/** The lobby: an animated house over five face-down cards (today's homes), the streak and a big Play button. */
export default function StartScreen({
  dayNumber,
  streak,
  resumeAt,
  onPlay,
}: {
  dayNumber: number;
  streak: number;
  /** Home index to continue from, when the day is partly played. */
  resumeAt: number;
  onPlay: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const go = () => {
    play("tick");
    setLeaving(true);
    setTimeout(onPlay, 450);
  };
  return (
    <div className={`stage mx-auto max-w-xl px-5 pt-6 pb-8 text-center lg:max-w-2xl ${leaving ? "deal-out" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="font-display rounded-full bg-white/10 px-3 py-1 text-sm text-gold">Daily #{dayNumber}</span>
        <SoundToggle className="bg-white/10" />
      </div>

      <HeroHouse />

      <div className="mt-2 flex justify-center" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`face-card ${i < resumeAt ? "played" : ""}`}
            style={{ "--i": i, "--rot": `${(i - 2) * 9}deg` } as React.CSSProperties}
          >
            <span className="font-display text-2xl">{i < resumeAt ? "✓" : "?"}</span>
            <span className="font-display absolute top-1 left-2 text-sm opacity-70">{i + 1}</span>
          </div>
        ))}
      </div>

      <h1 className="font-display mt-8 text-4xl text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.35)] sm:text-5xl">
        Guess the Price
      </h1>
      <p className="mt-1 text-white/85">5 homes that just sold. How close can you get?</p>
      {streak > 0 && <p className="font-display mt-3 text-xl text-gold">🔥 {streak}-day streak. Keep it alive!</p>}

      <button
        onClick={go}
        className="btn-toy font-display mt-6 w-full max-w-sm bg-brand py-4 text-2xl text-white"
        data-testid="play"
        autoFocus
      >
        {resumeAt > 0 ? `Continue · Home ${resumeAt + 1}` : "Play today's homes"}
      </button>

      <p className="mt-5 text-sm text-white/70">
        {TIER_EMOJI.green} within 5% · {TIER_EMOJI.yellow} within 15% · {TIER_EMOJI.red} further · 100 pts a home
      </p>
    </div>
  );
}

/** A felt-toy house with a swinging "?" price tag, puffing chimney and twinkling windows. */
function HeroHouse() {
  return (
    <svg viewBox="0 0 240 190" className="hero-house mx-auto mt-4 w-56 sm:w-64" role="img" aria-label="A house">
      <g className="smoke">
        <circle cx="172" cy="34" r="7" />
        <circle cx="180" cy="20" r="9" />
        <circle cx="170" cy="6" r="6" />
      </g>
      <rect x="160" y="44" width="20" height="34" rx="3" fill="#8f3a22" />
      <path d="M120 22 212 98H28z" fill="#ff5a36" stroke="#1b1240" strokeWidth="6" strokeLinejoin="round" />
      <rect x="44" y="94" width="152" height="86" rx="6" fill="#fff6e0" stroke="#1b1240" strokeWidth="6" />
      <rect
        x="64"
        y="112"
        width="36"
        height="30"
        rx="4"
        className="window"
        fill="#ffc928"
        stroke="#1b1240"
        strokeWidth="5"
      />
      <rect
        x="140"
        y="112"
        width="36"
        height="30"
        rx="4"
        className="window w2"
        fill="#ffc928"
        stroke="#1b1240"
        strokeWidth="5"
      />
      <rect x="104" y="132" width="32" height="48" rx="4" fill="#3b1c97" stroke="#1b1240" strokeWidth="5" />
      <circle cx="128" cy="157" r="3" fill="#ffc928" />
      <g className="tag">
        <line x1="208" y1="104" x2="214" y2="128" stroke="#1b1240" strokeWidth="3" />
        <g transform="rotate(14 222 146)">
          <rect x="196" y="126" width="52" height="38" rx="9" fill="#ffc928" stroke="#1b1240" strokeWidth="5" />
          <circle cx="206" cy="145" r="4" fill="#1b1240" />
          <text
            x="230"
            y="157"
            textAnchor="middle"
            fontSize="28"
            fontWeight="900"
            fill="#1b1240"
            fontFamily="var(--font-display)"
          >
            ?
          </text>
        </g>
      </g>
    </svg>
  );
}

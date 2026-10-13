import { rng } from "@/lib/random";

const COLORS = ["#ffc928", "#ff5a36", "#2fbf71", "#4f8cff", "#ff4f9a", "#ffffff"];

/** A one-shot confetti burst from the middle of its container. Seeded, so render stays pure. */
export default function Confetti({ seed, count = 44 }: { seed: string; count?: number }) {
  const r = rng(`confetti:${seed}`);
  const pieces = Array.from({ length: count }, (_, i) => {
    const angle = r() * Math.PI * 2;
    const dist = 110 + r() * 170;
    return {
      i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 60,
      rot: Math.round(r() * 720 - 360),
      color: COLORS[i % COLORS.length],
      w: 6 + Math.round(r() * 6),
      delay: Math.round(r() * 120),
    };
  });
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-visible" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.i}
          className="confetti-piece"
          style={
            {
              "--x": `${p.x}px`,
              "--y": `${p.y}px`,
              "--r": `${p.rot}deg`,
              background: p.color,
              width: p.w,
              height: p.w * 0.6,
              animationDelay: `${p.delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

import { formatPrice, priceToSlider, type Tier } from "@/lib/scoring";

const TIER_BG: Record<Tier, string> = { green: "bg-green", yellow: "bg-yellow", red: "bg-red" };

/**
 * The $50K–$10M scale with your pin and the sold price. `progress` (0..1) slides the sold marker from your guess to
 * the real price, so the gap opens up as the price counts.
 */
export default function PriceScale({
  guess,
  price,
  progress,
  tier,
}: {
  guess: number;
  price: number;
  progress: number;
  tier: Tier;
}) {
  const g = priceToSlider(guess) * 100;
  const p = priceToSlider(price) * 100;
  const at = g + (p - g) * progress;
  const lo = Math.min(g, at);
  const hi = Math.max(g, at);
  return (
    <div className="relative mx-1 mt-9 mb-7" aria-hidden>
      <div className="h-3 rounded-full bg-ink/10" />
      <div
        className={`absolute top-0 h-3 rounded-full ${TIER_BG[tier]}`}
        style={{ left: `${lo}%`, width: `${hi - lo}%` }}
      />
      <Marker at={g} label="You" className="bg-ink text-white" below={false} />
      {progress > 0 && (
        <Marker at={at} label={progress >= 1 ? formatPrice(price) : "Sold"} className="bg-gold text-ink" below />
      )}
    </div>
  );
}

function Marker({ at, label, className, below }: { at: number; label: string; className: string; below: boolean }) {
  return (
    <div className="absolute top-1.5 -translate-x-1/2" style={{ left: `${at}%` }}>
      <div className={`h-5 w-5 -translate-y-1/2 rounded-full border-[3px] border-white shadow ${className}`} />
      <span
        className={`absolute left-1/2 -translate-x-1/2 rounded-md px-1.5 py-0.5 text-[11px] font-bold whitespace-nowrap ${className} ${
          below ? "top-3.5" : "-top-9"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

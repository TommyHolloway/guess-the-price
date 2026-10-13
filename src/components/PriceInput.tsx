"use client";
import { useState } from "react";
import { formatFullPrice, MAX_PRICE, MIN_PRICE, parsePriceInput, priceToSlider, sliderToPrice } from "@/lib/scoring";

/** Log-scale slider from $50K to $10M with the value shown live, plus a type-in option. */
export default function PriceInput({ value, onChange }: { value: number; onChange: (p: number) => void }) {
  const [typing, setTyping] = useState<string | null>(null);
  const typed = typing === null ? null : parsePriceInput(typing);
  const typedOk = typed !== null && typed >= MIN_PRICE && typed <= MAX_PRICE;

  return (
    <div>
      <div className="flex items-baseline justify-center gap-2">
        {typing === null ? (
          <button
            className="text-4xl font-extrabold tabular-nums lg:text-5xl"
            onClick={() => setTyping(String(value))}
            aria-label="Type a price"
            data-testid="price"
          >
            {formatFullPrice(value)}
          </button>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typedOk) onChange(typed);
              setTyping(null);
            }}
          >
            <input
              autoFocus
              inputMode="decimal"
              value={typing}
              onChange={(e) => setTyping(e.target.value)}
              onBlur={() => {
                if (typedOk) onChange(typed);
                setTyping(null);
              }}
              placeholder="e.g. 450k or 1.2m"
              className="w-56 rounded-xl border border-line bg-card px-3 py-1 text-center text-3xl font-extrabold"
              aria-label="Your guess in dollars"
            />
          </form>
        )}
      </div>
      <p className="mt-1 h-4 text-center text-xs text-muted">
        {typing === null
          ? "Tap the price to type it"
          : typedOk
            ? `= ${formatFullPrice(typed)}`
            : "Between $50K and $10M, like 450k or 1.2m"}
      </p>
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={priceToSlider(value)}
        onChange={(e) => onChange(sliderToPrice(Number(e.target.value)))}
        className="price-slider mt-3 w-full cursor-pointer"
        aria-label="Your guess"
      />
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>$50K</span>
        <span>$700K</span>
        <span>$10M</span>
      </div>
    </div>
  );
}

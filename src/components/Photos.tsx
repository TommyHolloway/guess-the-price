"use client";
import { useRef, useState } from "react";

/** Swipeable photo carousel (scroll-snap), with arrows on wider screens and dots. */
export default function Photos({ photos, alt }: { photos: string[]; alt: string }) {
  const strip = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const go = (i: number) => {
    const s = strip.current;
    if (s) s.scrollTo({ left: i * s.clientWidth, behavior: "smooth" });
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-card">
      <div
        ref={strip}
        className="no-scrollbar flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => setAt(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {photos.map((src, i) => (
          // Listing photos come from many hosts; plain <img> avoids configuring every domain for next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={`${alt}, photo ${i + 1}`}
            className="h-full w-full shrink-0 snap-center object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}
      </div>
      {at > 0 && (
        <button aria-label="Previous photo" onClick={() => go(at - 1)} className="arrow left-2">
          ‹
        </button>
      )}
      {at < photos.length - 1 && (
        <button aria-label="Next photo" onClick={() => go(at + 1)} className="arrow right-2">
          ›
        </button>
      )}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {photos.map((_, i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === at ? "bg-white" : "bg-white/50"}`} />
        ))}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, GeoJSONSource } from "maplibre-gl";
import type { PublicHome } from "@/lib/homes";

const STYLE = process.env.NEXT_PUBLIC_MAP_STYLE ?? "https://tiles.openfreemap.org/styles/positron";
const US_VIEW = { center: [-98.5, 39.5] as [number, number], zoom: 2.8 };
const STATE_MS = 1100;
const CITY_MS = 1300;

/** A polygon approximating a circle, for the neighbourhood hint. */
function circle([lng, lat]: [number, number], radiusKm: number, steps = 64) {
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    coords.push([
      lng + (radiusKm * Math.cos(a)) / (111.32 * Math.cos((lat * Math.PI) / 180)),
      lat + (radiusKm * Math.sin(a)) / 111.32,
    ]);
  }
  return { type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: [coords] } };
}

/**
 * The map: flies to the home's state, then its city (under 3 seconds, skippable), then rings the neighbourhood.
 * Falls back to a text label when WebGL or the tiles aren't available.
 */
export default function MapPanel({ home }: { home: PublicHome }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const timers = useRef<number[]>([]);
  const [failed, setFailed] = useState(false);
  /** The home whose intro has finished; the intro is playing while this differs from the current home. */
  const [doneFor, setDoneFor] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    import("maplibre-gl")
      .then(({ Map, setWorkerUrl }) => {
        if (disposed || !el.current) return;
        setWorkerUrl("/maplibre-gl-worker.mjs");
        const m = new Map({ container: el.current, style: STYLE, ...US_VIEW, attributionControl: { compact: true } });
        m.on("error", (e) => {
          console.warn("map:", e.error?.message);
          // The style itself didn't load (offline, blocked tiles host): show the text fallback instead of a blank box.
          if (!m.isStyleLoaded()) setFailed(true);
        });
        m.on("load", () => {
          m.addSource("hint", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          m.addLayer({
            id: "hint-fill",
            type: "fill",
            source: "hint",
            paint: { "fill-color": "#e2572b", "fill-opacity": 0.18 },
          });
          m.addLayer({
            id: "hint-line",
            type: "line",
            source: "hint",
            paint: { "line-color": "#e2572b", "line-width": 2.5, "line-dasharray": [2, 1.5] },
          });
          setReady(true);
        });
        map.current = m;
      })
      .catch(() => setFailed(true));
    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const finish = (h: PublicHome) => {
    const m = map.current;
    if (!m) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    m.stop();
    m.jumpTo({ center: h.hint.center, zoom: 12.3 });
    (m.getSource("hint") as GeoJSONSource | undefined)?.setData(circle(h.hint.center, h.hint.radiusKm));
    setDoneFor(h.id);
  };

  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    (m.getSource("hint") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: [] });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      timers.current = [window.setTimeout(() => finish(home), 0)];
      return () => timers.current.forEach(clearTimeout);
    }
    m.flyTo({ center: home.stateCenter, zoom: 5.6, duration: STATE_MS, essential: true });
    timers.current = [
      window.setTimeout(
        () => m.flyTo({ center: home.cityCenter, zoom: 11.3, duration: CITY_MS, essential: true }),
        STATE_MS,
      ),
      window.setTimeout(() => finish(home), STATE_MS + CITY_MS + 150),
    ];
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home.id, ready]);

  return (
    <div className="relative h-32 overflow-hidden rounded-[20px] border-[3px] border-white bg-[#e8eef0] shadow-[0_6px_0_rgb(0_0_0/0.35)] sm:h-44 lg:h-60">
      <div ref={el} className="absolute inset-0" data-testid="map" />
      {failed && (
        <div className="absolute inset-0 grid place-items-center bg-[#e8eef0] text-sm text-muted">
          Somewhere in {home.city}, {home.state}
        </div>
      )}
      <div className="pointer-events-none absolute top-2 left-2 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold shadow-sm">
        📍 {home.city}, {home.stateName}
      </div>
      {ready && doneFor !== home.id && (
        <button
          onClick={() => finish(home)}
          className="absolute right-2 bottom-2 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white"
        >
          Skip ⏭
        </button>
      )}
    </div>
  );
}

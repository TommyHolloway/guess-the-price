import { describe, expect, it } from "vitest";
import { sampleHomes } from "@/lib/data/sample";
import { drawDay, neighborhoodHint, priceTier, toPublic } from "@/lib/draw";
import { isEligible, rejectReason, type Home } from "@/lib/homes";
import { EXCLUDED_STATES } from "@/lib/states";

const day = "2026-10-13";
const pool = sampleHomes(day);

describe("eligibility", () => {
  const ok = pool[0];
  it("accepts the sample homes", () => expect(pool.every((h) => isEligible(h, day))).toBe(true));
  it.each<[Partial<Home>, string]>([
    [{ state: "TX" }, "excluded_state"],
    [{ photos: ["a", "b", "c", "d"] }, "few_photos"],
    [{ soldPrice: 0 }, "no_price"],
    [{ soldPrice: 12_000_000 }, "price_range"],
    [{ soldDate: "2026-08-01" }, "stale"],
  ])("rejects %o", (patch, reason) => expect(rejectReason({ ...ok, ...patch }, day)).toBe(reason));
});

describe("drawDay", () => {
  const homes = drawDay(pool, day);
  it("is the same for everyone on a day and changes day to day", () => {
    expect(drawDay(pool, day).map((h) => h.id)).toEqual(homes.map((h) => h.id));
    expect(drawDay(pool, "2026-10-14").map((h) => h.id)).not.toEqual(homes.map((h) => h.id));
  });
  it("draws 5 distinct homes from 5 states, none in non-disclosure states", () => {
    expect(homes).toHaveLength(5);
    expect(new Set(homes.map((h) => h.id)).size).toBe(5);
    expect(new Set(homes.map((h) => h.state)).size).toBe(5);
    expect(homes.some((h) => EXCLUDED_STATES.has(h.state))).toBe(false);
  });
  it("mixes price tiers every day", () => {
    for (let i = 0; i < 30; i++) {
      const d = `2026-11-${String(i + 1).padStart(2, "0")}`;
      const tiers = new Set(drawDay(sampleHomes(d), d).map((h) => priceTier(h.soldPrice)));
      expect(tiers).toEqual(new Set(["cheap", "mid", "luxury"]));
    }
  });
  it("avoids recently featured homes", () => {
    const recent = new Set(homes.map((h) => h.id));
    expect(drawDay(pool, day, recent).some((h) => recent.has(h.id))).toBe(false);
  });
});

describe("hints", () => {
  it("contain the home without centring on it", () => {
    for (const h of pool) {
      const hint = neighborhoodHint(h);
      const [lng, lat] = h.location;
      const dx = (hint.center[0] - lng) * 111.32 * Math.cos((lat * Math.PI) / 180);
      const dy = (hint.center[1] - lat) * 111.32;
      const km = Math.hypot(dx, dy);
      expect(km).toBeGreaterThan(0.2 * hint.radiusKm);
      expect(km).toBeLessThan(0.7 * hint.radiusKm);
    }
  });
  it("public homes carry no price or exact location", () => {
    const pub = toPublic(pool[0]) as Record<string, unknown>;
    expect(pub.soldPrice).toBeUndefined();
    expect(pub.location).toBeUndefined();
    expect(pub.listingAgent).toBeUndefined();
  });
});

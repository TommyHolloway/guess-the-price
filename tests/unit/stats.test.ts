import { describe, expect, it } from "vitest";
import { decodeTiers, encodeTiers, shareTargets, shareText } from "@/lib/share";
import { computeStats, type DayPlay, type Guess } from "@/lib/stats";

const g = (points: number, tier: Guess["tier"] = "green"): Guess => ({
  guess: 1,
  price: 1,
  points,
  pctError: 0,
  tier,
});
const playOn = (day: string, pts = 80): DayPlay => ({ day, guesses: [g(pts), g(pts), g(pts), g(pts), g(pts, "red")] });
const hist = (...plays: DayPlay[]) => Object.fromEntries(plays.map((p) => [p.day, p]));

describe("computeStats", () => {
  it("counts streaks through yesterday", () => {
    const h = hist(playOn("2026-10-10"), playOn("2026-10-11"), playOn("2026-10-12"));
    expect(computeStats(h, "2026-10-13").currentStreak).toBe(3);
    expect(computeStats(h, "2026-10-14").currentStreak).toBe(0);
  });
  it("breaks on a missed day and keeps the best run", () => {
    const h = hist(playOn("2026-10-01"), playOn("2026-10-02"), playOn("2026-10-03"), playOn("2026-10-12"));
    const s = computeStats(h, "2026-10-13");
    expect(s.currentStreak).toBe(1);
    expect(s.maxStreak).toBe(3);
  });
  it("ignores unfinished days and buckets scores", () => {
    const partial: DayPlay = { day: "2026-10-13", guesses: [g(100)] };
    const s = computeStats(hist(playOn("2026-10-12", 100), partial), "2026-10-13");
    expect(s.played).toBe(1);
    expect(s.best).toBe(500);
    expect(s.distribution).toEqual([0, 0, 0, 0, 1]);
    expect(s.tiers).toEqual({ green: 4, yellow: 0, red: 1 });
  });
});

describe("share", () => {
  it("writes a Wordle-style line", () => {
    const text = shareText({
      day: "2026-10-13",
      score: 412,
      tiers: ["green", "yellow", "red", "green", "yellow"],
      streak: 3,
    });
    expect(text).toBe("Guess the Price #2 🏠 412/500\n🟩🟨🟥🟩🟨\n🔥 3-day streak");
  });
  it("round-trips tiers and builds share links", () => {
    expect(decodeTiers(encodeTiers(["green", "red", "yellow"]))).toEqual(["green", "red", "yellow"]);
    const t = shareTargets("hi", "https://x.test/s");
    expect(t.whatsapp).toContain("wa.me");
    expect(t.imessage.startsWith("sms:")).toBe(true);
  });
});

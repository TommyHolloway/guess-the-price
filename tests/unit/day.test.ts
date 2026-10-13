import { describe, expect, it } from "vitest";
import { addDays, dayKey, dayNumber, msUntilNextDay } from "@/lib/day";

describe("day boundaries (ET)", () => {
  it("switches at midnight Eastern, not UTC", () => {
    expect(dayKey(new Date("2026-10-14T03:59:00Z"))).toBe("2026-10-13"); // 23:59 EDT
    expect(dayKey(new Date("2026-10-14T04:00:00Z"))).toBe("2026-10-14");
    expect(dayKey(new Date("2026-12-01T04:59:00Z"))).toBe("2026-11-30"); // 23:59 EST
  });
  it("counts to the next midnight ET", () => {
    expect(Math.round(msUntilNextDay(new Date("2026-10-14T03:00:00Z")) / 60_000)).toBe(60);
  });
  it("numbers days from launch", () => {
    expect(dayNumber("2026-10-12")).toBe(1);
    expect(dayNumber(addDays("2026-10-12", 30))).toBe(31);
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });
});

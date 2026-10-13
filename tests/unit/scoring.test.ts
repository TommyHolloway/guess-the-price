import { describe, expect, it } from "vitest";
import {
  formatPrice,
  MAX_PRICE,
  MIN_PRICE,
  parsePriceInput,
  points,
  priceToSlider,
  revealLine,
  sliderToPrice,
  tier,
} from "@/lib/scoring";

describe("slider", () => {
  it("spans $50K to $10M on a log scale", () => {
    expect(sliderToPrice(0)).toBe(MIN_PRICE);
    expect(sliderToPrice(1)).toBe(MAX_PRICE);
    expect(sliderToPrice(0.5)).toBe(707_000);
  });
  it("round-trips within a rounding step", () => {
    for (const p of [50_000, 123_000, 650_000, 1_250_000, 4_500_000]) {
      expect(Math.abs(sliderToPrice(priceToSlider(p)) - p) / p).toBeLessThan(0.01);
    }
  });
});

describe("parsePriceInput", () => {
  it.each([
    ["450000", 450_000],
    ["$450,000", 450_000],
    ["450k", 450_000],
    ["1.2m", 1_200_000],
    ["1.25 mil", 1_250_000],
    ["abc", null],
    ["", null],
  ])("%s → %s", (input, want) => expect(parsePriceInput(input)).toBe(want));
});

describe("points and tiers", () => {
  it("gives 100 for an exact guess and nothing at 60% off", () => {
    expect(points(500_000, 500_000)).toBe(100);
    expect(points(650_000, 500_000)).toBe(50);
    expect(points(650_000, 500_000)).toBe(points(350_000, 500_000));
    expect(points(5_000_000, 500_000)).toBe(0);
  });
  it("bands at 5% and 15%", () => {
    expect(tier(105_000, 100_000)).toBe("green");
    expect(tier(110_000, 100_000)).toBe("yellow");
    expect(tier(115_000, 100_000)).toBe("yellow");
    expect(tier(116_000, 100_000)).toBe("red");
  });
});

describe("formatting", () => {
  it("formats compactly", () => {
    expect(formatPrice(212_000)).toBe("$212K");
    expect(formatPrice(150_000)).toBe("$150K");
    expect(formatPrice(2_000_000)).toBe("$2M");
    expect(formatPrice(1_250_000)).toBe("$1.25M");
    expect(formatPrice(-45_500)).toBe("$45.5K");
  });
  it("tells you how far off you were", () => {
    expect(revealLine(650_000, 500_000)).toBe("Off by $150K. Too high.");
    expect(revealLine(500_000, 500_000)).toMatch(/Dead on/);
  });
});

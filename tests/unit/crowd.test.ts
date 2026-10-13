import { describe, expect, it } from "vitest";
import { countHigher, crowdLine, simulatedCrowd } from "@/lib/crowd";

describe("crowd", () => {
  it("needs enough guesses before saying anything", () => {
    expect(crowdLine({ count: 9, higher: 3 })).toBeNull();
    expect(crowdLine({ count: 40, higher: 26 })).toEqual({ pctHigher: 65, count: 40 });
  });
  it("simulates a believable, repeatable crowd for sample homes", () => {
    const c = simulatedCrowd("s01", 300_000);
    expect(c).toEqual(simulatedCrowd("s01", 300_000));
    const above = countHigher(c, 300_000);
    expect(above.higher / above.count).toBeGreaterThan(0.45);
    expect(above.higher / above.count).toBeLessThan(0.7);
  });
});

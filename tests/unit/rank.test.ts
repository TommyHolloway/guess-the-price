import { describe, expect, it } from "vitest";
import { nextRank, rankFor } from "@/lib/rank";

describe("ranks", () => {
  it.each([
    [0, "Tourist"],
    [149, "Tourist"],
    [150, "House Hunter"],
    [300, "Agent"],
    [412, "Agent"],
    [425, "Appraiser"],
    [500, "Appraiser"],
  ])("%i → %s", (score, title) => expect(rankFor(score).title).toBe(title));
  it("says what the next rank needs", () => {
    expect(nextRank(412)).toEqual({ rank: expect.objectContaining({ title: "Appraiser" }), needed: 13 });
    expect(nextRank(480)).toBeNull();
  });
});

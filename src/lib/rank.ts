// Rank titles for a day's score: the headline of the result and share card.

export type Rank = { title: string; emoji: string; min: number };

/** Highest first. */
export const RANKS: Rank[] = [
  { title: "Appraiser", emoji: "🏆", min: 425 },
  { title: "Agent", emoji: "🔑", min: 300 },
  { title: "House Hunter", emoji: "🏡", min: 150 },
  { title: "Tourist", emoji: "🏚️", min: 0 },
];

export function rankFor(score: number): Rank {
  return RANKS.find((r) => score >= r.min) ?? RANKS[RANKS.length - 1];
}

/** The next rank up and how many points it needs, or null at the top. */
export function nextRank(score: number): { rank: Rank; needed: number } | null {
  const i = RANKS.indexOf(rankFor(score));
  return i > 0 ? { rank: RANKS[i - 1], needed: RANKS[i - 1].min - score } : null;
}

/** Streak lengths that get a celebration. */
export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 365];
export const isStreakMilestone = (streak: number) => STREAK_MILESTONES.includes(streak);

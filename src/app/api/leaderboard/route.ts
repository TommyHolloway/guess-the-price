import { NextResponse } from "next/server";
import { gameStore } from "@/lib/data/store";
import { dayKey, isDayKey } from "@/lib/day";
import { STATES } from "@/lib/states";

export const dynamic = "force-dynamic";

/** National (or ?state=XX) leaderboard for today (or ?day=YYYY-MM-DD). Player ids are not exposed. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const day = q.get("day") ?? dayKey();
  const state = q.get("state") ?? undefined;
  if (!isDayKey(day) || (state && !STATES[state])) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const rows = await gameStore().leaderboard(day, state);
  return NextResponse.json({
    day,
    state: state ?? null,
    rows: rows.map((r, i) => ({
      rank: i + 1,
      name: r.name ?? "Anonymous",
      state: r.state ?? null,
      score: r.score,
      tiers: r.tiers,
    })),
  });
}

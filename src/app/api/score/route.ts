import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateDay } from "@/lib/data/daily";
import { gameStore } from "@/lib/data/store";
import { dayKey } from "@/lib/day";
import { HOMES_PER_DAY, MAX_PRICE, MIN_PRICE, points, tier } from "@/lib/scoring";
import { STATES } from "@/lib/states";

export const dynamic = "force-dynamic";

const Body = z.object({
  day: z.string(),
  playerId: z.string().min(8).max(64),
  name: z.string().trim().min(1).max(24).optional(),
  state: z.string().length(2).optional(),
  guesses: z.array(z.number().min(MIN_PRICE).max(MAX_PRICE)).length(HOMES_PER_DAY),
});

/** Posts a finished game to the leaderboards. The server scores the guesses itself. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const { day, playerId, name, state, guesses } = parsed.data;
  if (day !== dayKey()) return NextResponse.json({ error: "that day is over" }, { status: 409 });
  if (state && !STATES[state]) return NextResponse.json({ error: "unknown state" }, { status: 400 });
  const { homes } = await getOrCreateDay(day);
  const score = guesses.reduce((s, g, i) => s + points(g, homes[i].soldPrice), 0);
  const tiers = guesses.map((g, i) => tier(g, homes[i].soldPrice));
  await gameStore().submitScore({ day, playerId, name, state, score, tiers });
  return NextResponse.json({ score, tiers });
}

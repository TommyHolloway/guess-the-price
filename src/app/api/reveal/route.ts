import { NextResponse } from "next/server";
import { z } from "zod";
import { countHigher, crowdLine, MIN_CROWD, simulatedCrowd } from "@/lib/crowd";
import { getOrCreateDay } from "@/lib/data/daily";
import { homeSource } from "@/lib/data/source";
import { gameStore } from "@/lib/data/store";
import { dayKey } from "@/lib/day";
import { MAX_PRICE, MIN_PRICE, pctError, points, revealLine, tier } from "@/lib/scoring";

export const dynamic = "force-dynamic";

const Body = z.object({
  day: z.string(),
  index: z.number().int().min(0).max(4),
  guess: z.number().min(MIN_PRICE).max(MAX_PRICE),
  playerId: z.string().min(8).max(64),
});

/** Scores one guess and says how the crowd guessed. Prices are only revealed for today's game. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const { day, index, guess, playerId } = parsed.data;
  if (day !== dayKey()) return NextResponse.json({ error: "that day is over" }, { status: 409 });
  const home = (await getOrCreateDay(day)).homes[index];
  if (!home) return NextResponse.json({ error: "no such home" }, { status: 404 });
  const price = home.soldPrice;
  const store = gameStore();
  // The crowd is read before this guess is added, so a player never compares against themselves.
  const real = await store.crowd(day, index, guess, playerId);
  await store.recordGuess(day, index, playerId, guess);
  const crowd =
    homeSource().name === "sample" && real.count < MIN_CROWD
      ? countHigher(simulatedCrowd(home.id, price), guess)
      : real;
  return NextResponse.json({
    crowd: crowdLine(crowd),
    price,
    soldDate: home.soldDate,
    pctError: pctError(guess, price),
    points: points(guess, price),
    tier: tier(guess, price),
    line: revealLine(guess, price),
    host: home.host ?? null,
    listingAgent: home.listingAgent ?? null,
  });
}

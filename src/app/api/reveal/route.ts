import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateDay } from "@/lib/data/daily";
import { dayKey } from "@/lib/day";
import { MAX_PRICE, MIN_PRICE, pctError, points, revealLine, tier } from "@/lib/scoring";

export const dynamic = "force-dynamic";

const Body = z.object({
  day: z.string(),
  index: z.number().int().min(0).max(4),
  guess: z.number().min(MIN_PRICE).max(MAX_PRICE),
});

/** Scores one guess. Prices are only revealed for today's game. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const { day, index, guess } = parsed.data;
  if (day !== dayKey()) return NextResponse.json({ error: "that day is over" }, { status: 409 });
  const home = (await getOrCreateDay(day)).homes[index];
  if (!home) return NextResponse.json({ error: "no such home" }, { status: 404 });
  const price = home.soldPrice;
  return NextResponse.json({
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

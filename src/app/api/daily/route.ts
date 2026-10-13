import { NextResponse } from "next/server";
import { getOrCreateDay } from "@/lib/data/daily";
import { dayKey, dayNumber } from "@/lib/day";
import { toPublic } from "@/lib/draw";

export const dynamic = "force-dynamic";

/** Today's five homes, without prices or exact locations. */
export async function GET() {
  const day = dayKey();
  const set = await getOrCreateDay(day);
  return NextResponse.json({ day, dayNumber: dayNumber(day), homes: set.homes.map(toPublic) });
}

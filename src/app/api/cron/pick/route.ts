import { NextResponse } from "next/server";
import { getOrCreateDay } from "@/lib/data/daily";
import { addDays, dayKey } from "@/lib/day";

export const dynamic = "force-dynamic";

/**
 * Nightly (vercel.json): makes sure today's and tomorrow's homes are picked and cached. Vercel Cron sends
 * `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const today = dayKey();
  const picked = [];
  for (const day of [today, addDays(today, 1)]) {
    const set = await getOrCreateDay(day);
    picked.push({ day, homes: set.homes.map((h) => `${h.city}, ${h.state}`) });
  }
  return NextResponse.json({ picked });
}

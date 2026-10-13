import { ImageResponse } from "next/og";
import { dayNumber, isDayKey } from "@/lib/day";
import { decodeTiers } from "@/lib/share";
import { MAX_SCORE } from "@/lib/stats";

const COLORS = { green: "#22a35a", yellow: "#e8b500", red: "#d9413a" };

/** The share card image: day, score, one coloured square per home, streak. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const day = q.get("d") ?? "";
  const tiers = decodeTiers(q.get("g") ?? "");
  const score = Math.max(0, Math.min(MAX_SCORE, Number(q.get("t")) || 0));
  const streak = Math.max(0, Number(q.get("s")) || 0);
  const title = isDayKey(day) ? `Guess the Price #${dayNumber(day)}` : "Guess the Price";
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #fff8ec 0%, #ffe7c2 100%)",
        color: "#1d1a16",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 56, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 120, fontWeight: 800, marginTop: 10 }}>{`${score}/${MAX_SCORE}`}</div>
      <div style={{ display: "flex", gap: 22, marginTop: 24 }}>
        {tiers.map((t, i) => (
          <div key={i} style={{ width: 96, height: 96, borderRadius: 18, background: COLORS[t] }} />
        ))}
      </div>
      <div style={{ fontSize: 36, marginTop: 36, color: "#6b5d4c" }}>
        {streak > 1 ? `${streak}-day streak · Can you beat it?` : "Can you beat it?"}
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}

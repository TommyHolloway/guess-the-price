import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { GOLD, STAGE, TILE } from "@/lib/brand/theme";
import { dayNumber, isDayKey } from "@/lib/day";
import { rankFor } from "@/lib/rank";
import { decodeTiers } from "@/lib/share";
import { MAX_SCORE } from "@/lib/stats";

const font = readFile(join(process.cwd(), "assets/fonts/LilitaOne.woff"));

/** Marquee bulbs along an edge of the card. */
function Bulbs({ n }: { n: number }) {
  return (
    <div style={{ display: "flex", width: "100%", justifyContent: "space-between", flexShrink: 0 }}>
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            background: i % 2 ? "#fff3c4" : GOLD,
            boxShadow: `0 0 12px ${GOLD}`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * The share card (link preview on X, iMessage, WhatsApp): the same result screen the player saw. Rank, score, one
 * tile per home, streak. 1200×630, the size X and iMessage both show large.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const day = q.get("d") ?? "";
  const tiers = decodeTiers(q.get("g") ?? "");
  const score = Math.max(0, Math.min(MAX_SCORE, Number(q.get("t")) || 0));
  const streak = Math.max(0, Math.floor(Number(q.get("s")) || 0));
  const rank = rankFor(score);
  const title = isDayKey(day) ? `GUESS THE PRICE #${dayNumber(day)}` : "GUESS THE PRICE";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        padding: 28,
        background: `radial-gradient(circle at 50% 0%, ${STAGE.top} 0%, ${STAGE.bottom} 75%)`,
        fontFamily: "Lilita",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          border: `6px solid ${GOLD}`,
          borderRadius: 36,
          padding: 22,
        }}
      >
        <Bulbs n={22} />
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
        >
          <div style={{ fontSize: 38, color: GOLD, letterSpacing: 4 }}>{title}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 28, marginTop: 6 }}>
            <div style={{ fontSize: 108, color: "white", textShadow: `0 6px 0 ${STAGE.ink}` }}>
              {rank.title.toUpperCase()}
            </div>
            <div style={{ fontSize: 72, color: GOLD, textShadow: `0 5px 0 ${STAGE.ink}` }}>{`${score} PTS`}</div>
          </div>
          <div style={{ display: "flex", gap: 22, marginTop: 26 }}>
            {(tiers.length ? tiers : Array(5).fill(null)).map((t, i) => (
              <div
                key={i}
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 22,
                  background: t ? TILE[t as keyof typeof TILE] : "rgba(255,255,255,.15)",
                  border: "6px solid white",
                  boxShadow: `0 8px 0 ${STAGE.ink}`,
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 36, color: STAGE.cream, marginTop: 30 }}>
            {streak > 1 ? `${streak}-DAY STREAK · CAN YOU BEAT IT?` : "CAN YOU BEAT IT?"}
          </div>
        </div>
        <Bulbs n={22} />
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Lilita", data: await font, weight: 400, style: "normal" }],
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    },
  );
}

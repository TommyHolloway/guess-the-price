import { ImageResponse } from "next/og";
import { ICON_SVG } from "@/lib/brand/icon";

const SIZES = new Set([180, 192, 512]);

/** PNG app icons for the web manifest and iOS home screen. */
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.has(size)) return new Response("not found", { status: 404 });
  const src = `data:image/svg+xml;base64,${Buffer.from(ICON_SVG).toString("base64")}`;
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={src} width={size} height={size} />
    </div>,
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=604800, immutable" } },
  );
}

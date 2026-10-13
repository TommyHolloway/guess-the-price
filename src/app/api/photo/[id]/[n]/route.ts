import { rng } from "@/lib/random";

/** Drawn placeholder photos for the sample homes: a facade first, then rooms. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  const r = rng(`photo:${id}`);
  const hue = Math.floor(r() * 360);
  const wall = `hsl(${hue} 35% ${70 + r() * 15}%)`;
  const trim = `hsl(${(hue + 180) % 360} 25% 35%)`;
  const idx = Number(n) || 0;
  const rooms = ["", "Living room", "Kitchen", "Bedroom", "Backyard"];
  const body =
    idx === 0
      ? `<rect width="800" height="600" fill="#bfe3f5"/><rect y="440" width="800" height="160" fill="#7cb46b"/>
         <polygon points="190,250 400,120 610,250" fill="${trim}"/>
         <rect x="210" y="250" width="380" height="220" fill="${wall}"/>
         <rect x="370" y="350" width="60" height="120" fill="${trim}"/>
         <rect x="250" y="300" width="80" height="60" fill="#e9f6ff" stroke="${trim}" stroke-width="6"/>
         <rect x="470" y="300" width="80" height="60" fill="#e9f6ff" stroke="${trim}" stroke-width="6"/>`
      : idx === 4
        ? `<rect width="800" height="600" fill="#bfe3f5"/><rect y="360" width="800" height="240" fill="#6aa65c"/>
           <circle cx="160" cy="330" r="80" fill="#3f7d3a"/><rect x="150" y="330" width="20" height="90" fill="#6b4a2b"/>
           <rect x="420" y="420" width="260" height="70" rx="12" fill="${wall}"/>`
        : `<rect width="800" height="600" fill="${wall}"/><rect y="440" width="800" height="160" fill="#c8a27a"/>
           <rect x="520" y="110" width="180" height="180" fill="#e9f6ff" stroke="#fff" stroke-width="10"/>
           <rect x="120" y="340" width="300" height="110" rx="18" fill="${trim}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">${body}
    <text x="24" y="580" font-family="system-ui,sans-serif" font-size="22" fill="rgba(0,0,0,.45)">Sample photo${
      rooms[idx] ? ` · ${rooms[idx]}` : ""
    }</text></svg>`;
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400, immutable" },
  });
}

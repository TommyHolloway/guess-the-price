import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Guess the Price",
    short_name: "Guess Price",
    description: "Five recently sold US homes a day. Guess what they sold for.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff8ec",
    theme_color: "#fff8ec",
    categories: ["games", "entertainment"],
    icons: [
      { src: "/api/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/api/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/api/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

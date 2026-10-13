// MapLibre 6 loads its tile worker from a file next to its own module, which bundlers move. Serve a copy from
// public/ instead (MapPanel calls setWorkerUrl). Runs on install and before builds so the copy matches the package.
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("public", { recursive: true });
copyFileSync("node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", "public/maplibre-gl-worker.mjs");

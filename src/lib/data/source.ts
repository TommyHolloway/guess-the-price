import type { Home } from "../homes";
import { sampleHomes } from "./sample";

/** Where candidate homes come from. The draw filters and picks; a source only lists recent sales. */
export interface HomeSource {
  name: string;
  recentlySold(today: string): Promise<Home[]>;
}

export const sampleSource: HomeSource = {
  name: "sample",
  recentlySold: async (today) => sampleHomes(today),
};

/**
 * Redfin data API on RapidAPI (ntd119). Not wired yet: the endpoint paths and response fields still need to be
 * checked against the API's docs with a key, then mapped to `Home` here (photos, sold price and date, beds, baths,
 * sqft, year built, property type, lat/lng, listing agent). Until then the game runs on `sampleSource`.
 *
 * Risk: this API is an unofficial Redfin scraper; Redfin's terms and the photo copyrights belong to others. Fine for
 * a test, but move to agent-supplied listings or a licensed feed before scaling.
 */
export const redfinSource: HomeSource = {
  name: "redfin",
  async recentlySold() {
    throw new Error("Redfin source is not wired yet (see src/lib/data/source.ts)");
  },
};

export function homeSource(): HomeSource {
  return process.env.HOME_SOURCE === "redfin" ? redfinSource : sampleSource;
}

import { z } from "zod";
import { EXCLUDED_STATES, STATES } from "./states";
import { MAX_PRICE, MIN_PRICE } from "./scoring";

export const MIN_PHOTOS = 5;
/** Only homes sold within this many days of the draw. */
export const MAX_SOLD_AGE_DAYS = 30;

export const AgentSchema = z.object({
  name: z.string(),
  brokerage: z.string().optional(),
  email: z.string().email().optional(),
  photoUrl: z.string().optional(),
});
export type Agent = z.infer<typeof AgentSchema>;

/** A sold home as we store it. The exact location and price never leave the server before the reveal. */
export const HomeSchema = z.object({
  id: z.string(),
  city: z.string(),
  state: z.string().length(2),
  /** City centre, for the map intro. */
  cityCenter: z.tuple([z.number(), z.number()]),
  /** Exact location: used only to place the neighbourhood hint. */
  location: z.tuple([z.number(), z.number()]),
  beds: z.number(),
  baths: z.number(),
  sqft: z.number(),
  yearBuilt: z.number().optional(),
  propertyType: z.enum(["single_family", "condo"]),
  soldPrice: z.number(),
  soldDate: z.string(),
  photos: z.array(z.string()),
  listingAgent: AgentSchema.optional(),
  /** Set when a realtor host picked this home: credited on the reveal card. */
  host: AgentSchema.optional(),
  sourceUrl: z.string().optional(),
});
export type Home = z.infer<typeof HomeSchema>;

export type Hint = { center: [number, number]; radiusKm: number };

/** What the browser gets before guessing. */
export type PublicHome = Pick<
  Home,
  "id" | "city" | "state" | "cityCenter" | "beds" | "baths" | "sqft" | "yearBuilt" | "propertyType" | "photos"
> & { stateName: string; stateCenter: [number, number]; hint: Hint };

export type Rejection =
  "excluded_state" | "unknown_state" | "few_photos" | "no_price" | "price_range" | "type" | "stale";

/** Why a home can't be featured, or null when it can. */
export function rejectReason(home: Home, today: string): Rejection | null {
  if (EXCLUDED_STATES.has(home.state)) return "excluded_state";
  if (!STATES[home.state]) return "unknown_state";
  if (home.photos.length < MIN_PHOTOS) return "few_photos";
  if (!(home.soldPrice > 0)) return "no_price";
  if (home.soldPrice < MIN_PRICE || home.soldPrice > MAX_PRICE) return "price_range";
  if (home.propertyType !== "single_family" && home.propertyType !== "condo") return "type";
  const age = (Date.parse(`${today}T00:00:00Z`) - Date.parse(home.soldDate)) / 86_400_000;
  if (!(age >= 0 && age <= MAX_SOLD_AGE_DAYS)) return "stale";
  return null;
}

export function isEligible(home: Home, today: string): boolean {
  return rejectReason(home, today) === null;
}

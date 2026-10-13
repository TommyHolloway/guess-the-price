import { HOMES_PER_DAY } from "./scoring";
import { isEligible, type Hint, type Home, type PublicHome } from "./homes";
import { STATES } from "./states";
import { pick, rng, shuffle, weightedPick, type Rng } from "./random";

export type PriceTier = "cheap" | "mid" | "luxury";

export function priceTier(price: number): PriceTier {
  return price < 350_000 ? "cheap" : price < 1_200_000 ? "mid" : "luxury";
}

/** Every day mixes tiers: at least one cheap, two mid and one luxury, plus one wildcard, in shuffled order. */
const TIER_PLAN: (PriceTier | null)[] = ["cheap", "mid", "mid", "luxury", null];

/**
 * Draw the day's homes: for each slot a weighted random state (more homes, more weight, damped by a square root so
 * small states still show up), then a city, then a home. States repeat only when the pool runs out of new ones.
 * `recentIds` (homes featured lately) are skipped while enough others remain.
 */
export function drawDay(pool: readonly Home[], day: string, recentIds: ReadonlySet<string> = new Set()): Home[] {
  const r = rng(`draw:${day}`);
  const eligible = pool.filter((h) => isEligible(h, day));
  const fresh = eligible.filter((h) => !recentIds.has(h.id));
  let remaining = fresh.length >= HOMES_PER_DAY ? fresh : eligible;
  const chosen: Home[] = [];
  const usedStates = new Set<string>();

  for (const want of shuffle(r, TIER_PLAN)) {
    if (remaining.length === 0) break;
    const inTier = want ? remaining.filter((h) => priceTier(h.soldPrice) === want) : remaining;
    const tierPool = inTier.length ? inTier : remaining;
    const newStates = tierPool.filter((h) => !usedStates.has(h.state));
    const home = drawHome(r, newStates.length ? newStates : tierPool);
    chosen.push(home);
    usedStates.add(home.state);
    remaining = remaining.filter((h) => h.id !== home.id);
  }
  return chosen;
}

function drawHome(r: Rng, homes: readonly Home[]): Home {
  const byState = groupBy(homes, (h) => h.state);
  const state = weightedPick(r, [...byState.keys()].sort(), (s) => Math.sqrt(byState.get(s)!.length));
  const byCity = groupBy(byState.get(state)!, (h) => h.city);
  const city = pick(r, [...byCity.keys()].sort());
  return pick(r, byCity.get(city)!);
}

function groupBy<T>(items: readonly T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const t of items) m.set(key(t), [...(m.get(key(t)) ?? []), t]);
  return m;
}

const KM_PER_DEG_LAT = 111.32;

/**
 * The neighbourhood hint: a circle that contains the home but is not centred on it, so the exact address
 * can't be read off the map. The home sits up to 60% of the radius from the centre.
 */
export function neighborhoodHint(home: Home, radiusKm = 1.5): Hint {
  const r = rng(`hint:${home.id}`);
  const [lng, lat] = home.location;
  const angle = r() * 2 * Math.PI;
  const dist = (0.25 + 0.35 * r()) * radiusKm;
  const dLat = (dist * Math.sin(angle)) / KM_PER_DEG_LAT;
  const dLng = (dist * Math.cos(angle)) / (KM_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180));
  return { center: [round(lng + dLng, 4), round(lat + dLat, 4)], radiusKm };
}

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

export function toPublic(home: Home): PublicHome {
  const st = STATES[home.state];
  return {
    id: home.id,
    city: home.city,
    state: home.state,
    stateName: st.name,
    stateCenter: st.center,
    cityCenter: home.cityCenter,
    beds: home.beds,
    baths: home.baths,
    sqft: home.sqft,
    yearBuilt: home.yearBuilt,
    propertyType: home.propertyType,
    photos: home.photos,
    hint: neighborhoodHint(home),
  };
}

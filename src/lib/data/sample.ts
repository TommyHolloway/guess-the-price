import { addDays } from "../day";
import type { Home } from "../homes";
import { rng } from "../random";

/**
 * Sample homes for development and demos. These are fictional listings (no real addresses, sales or agents)
 * placed in real cities, with drawn placeholder photos. Prices are plausible for each market, not real sales.
 */
type Row = [
  id: string,
  city: string,
  state: string,
  lng: number,
  lat: number,
  beds: number,
  baths: number,
  sqft: number,
  year: number,
  type: "single_family" | "condo",
  price: number,
];

// prettier-ignore
const ROWS: Row[] = [
  ["s01", "Cleveland", "OH", -81.69, 41.5, 3, 1, 1240, 1924, "single_family", 129_000],
  ["s02", "Columbus", "OH", -83.0, 39.96, 4, 2.5, 2210, 2004, "single_family", 389_000],
  ["s03", "Detroit", "MI", -83.05, 42.33, 3, 1, 1100, 1941, "single_family", 84_000],
  ["s04", "Ann Arbor", "MI", -83.74, 42.28, 4, 3, 2650, 1998, "single_family", 715_000],
  ["s05", "Pittsburgh", "PA", -79.99, 40.44, 3, 1.5, 1480, 1915, "single_family", 219_000],
  ["s06", "Philadelphia", "PA", -75.17, 39.95, 2, 2, 1150, 2012, "condo", 455_000],
  ["s07", "Brooklyn", "NY", -73.95, 40.68, 2, 1, 980, 1931, "condo", 1_085_000],
  ["s08", "Buffalo", "NY", -78.88, 42.89, 4, 2, 1890, 1908, "single_family", 249_000],
  ["s09", "Boston", "MA", -71.06, 42.36, 3, 2, 1420, 1899, "condo", 1_190_000],
  ["s10", "Worcester", "MA", -71.8, 42.26, 3, 1.5, 1560, 1955, "single_family", 435_000],
  ["s11", "Hartford", "CT", -72.68, 41.76, 3, 2, 1650, 1926, "single_family", 289_000],
  ["s12", "Greenwich", "CT", -73.63, 41.03, 6, 6.5, 6900, 2007, "single_family", 6_450_000],
  ["s13", "Baltimore", "MD", -76.61, 39.29, 3, 2, 1380, 1920, "single_family", 179_000],
  ["s14", "Arlington", "VA", -77.1, 38.88, 4, 3.5, 3100, 1949, "single_family", 1_650_000],
  ["s15", "Richmond", "VA", -77.44, 37.54, 3, 2, 1720, 1938, "single_family", 365_000],
  ["s16", "Charlotte", "NC", -80.84, 35.23, 4, 2.5, 2480, 2015, "single_family", 489_000],
  ["s17", "Asheville", "NC", -82.55, 35.6, 2, 2, 1290, 1988, "single_family", 418_000],
  ["s18", "Atlanta", "GA", -84.39, 33.75, 5, 4.5, 4300, 2001, "single_family", 1_395_000],
  ["s19", "Savannah", "GA", -81.1, 32.08, 3, 2.5, 1950, 1890, "single_family", 612_000],
  ["s20", "Miami", "FL", -80.19, 25.76, 2, 2, 1210, 2016, "condo", 735_000],
  ["s21", "Tampa", "FL", -82.46, 27.95, 3, 2, 1640, 1962, "single_family", 459_000],
  ["s22", "Naples", "FL", -81.79, 26.14, 4, 4.5, 4100, 2019, "single_family", 4_250_000],
  ["s23", "Nashville", "TN", -86.78, 36.16, 3, 2.5, 2050, 2018, "single_family", 649_000],
  ["s24", "Memphis", "TN", -90.05, 35.15, 3, 2, 1450, 1958, "single_family", 149_000],
  ["s25", "Chicago", "IL", -87.63, 41.88, 2, 2, 1300, 2006, "condo", 399_000],
  ["s26", "Peoria", "IL", -89.59, 40.69, 3, 1, 1200, 1950, "single_family", 98_000],
  ["s27", "Minneapolis", "MN", -93.27, 44.98, 4, 2, 2100, 1912, "single_family", 465_000],
  ["s28", "Milwaukee", "WI", -87.91, 43.04, 3, 1, 1320, 1928, "single_family", 189_000],
  ["s29", "Denver", "CO", -104.99, 39.74, 3, 2.5, 1880, 1906, "single_family", 795_000],
  ["s30", "Aspen", "CO", -106.82, 39.19, 5, 6, 5200, 2010, "single_family", 9_400_000],
  ["s31", "Phoenix", "AZ", -112.07, 33.45, 4, 2, 1950, 1979, "single_family", 449_000],
  ["s32", "Scottsdale", "AZ", -111.93, 33.49, 2, 2, 1250, 2003, "condo", 525_000],
  ["s33", "Las Vegas", "NV", -115.14, 36.17, 3, 2.5, 1820, 2005, "single_family", 435_000],
  ["s34", "Seattle", "WA", -122.33, 47.61, 3, 2, 1700, 1925, "single_family", 1_025_000],
  ["s35", "Spokane", "WA", -117.43, 47.66, 3, 2, 1600, 1948, "single_family", 345_000],
  ["s36", "Portland", "OR", -122.68, 45.52, 3, 1.5, 1540, 1912, "single_family", 585_000],
  ["s37", "Los Angeles", "CA", -118.24, 34.05, 3, 2, 1450, 1947, "single_family", 1_275_000],
  ["s38", "San Francisco", "CA", -122.42, 37.77, 2, 2, 1100, 2008, "condo", 1_190_000],
  ["s39", "Fresno", "CA", -119.79, 36.74, 3, 2, 1380, 1972, "single_family", 365_000],
  ["s40", "Atherton", "CA", -122.2, 37.46, 6, 7, 7100, 2012, "single_family", 9_850_000],
  ["s41", "Honolulu", "HI", -157.86, 21.31, 1, 1, 640, 1975, "condo", 389_000],
  ["s42", "Birmingham", "AL", -86.8, 33.52, 3, 2, 1500, 1951, "single_family", 159_000],
  ["s43", "Louisville", "KY", -85.76, 38.25, 3, 2, 1650, 1935, "single_family", 255_000],
  ["s44", "Indianapolis", "IN", -86.16, 39.77, 3, 2, 1580, 1964, "single_family", 225_000],
  ["s45", "Omaha", "NE", -95.94, 41.26, 4, 3, 2400, 1995, "single_family", 345_000],
  ["s46", "Des Moines", "IA", -93.61, 41.59, 3, 1.5, 1350, 1940, "single_family", 179_000],
  ["s47", "Portland", "ME", -70.26, 43.66, 3, 2, 1600, 1890, "single_family", 565_000],
  ["s48", "Burlington", "VT", -73.21, 44.48, 3, 1.5, 1450, 1920, "single_family", 475_000],
  ["s49", "Charleston", "SC", -79.93, 32.78, 4, 3.5, 2900, 1850, "single_family", 1_895_000],
  ["s50", "Oklahoma City", "OK", -97.52, 35.47, 3, 2, 1700, 1985, "single_family", 219_000],
];

/** Sample homes as if sold 3 to 28 days before `today`, so they stay eligible on any day. */
export function sampleHomes(today: string): Home[] {
  return ROWS.map(([id, city, state, lng, lat, beds, baths, sqft, yearBuilt, propertyType, soldPrice]) => {
    const r = rng(`sample:${id}`);
    return {
      id,
      city,
      state,
      cityCenter: [lng, lat],
      location: [lng + (r() - 0.5) * 0.08, lat + (r() - 0.5) * 0.06],
      beds,
      baths,
      sqft,
      yearBuilt,
      propertyType,
      soldPrice,
      soldDate: addDays(today, -(3 + Math.floor(r() * 26))),
      photos: [0, 1, 2, 3, 4].map((n) => `/api/photo/${id}/${n}`),
    };
  });
}

export function sampleHome(id: string): Home | undefined {
  return sampleHomes("2000-01-01").find((h) => h.id === id);
}

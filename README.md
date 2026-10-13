# Guess the Price

A daily web game: guess the sale price of 5 recently sold US homes. Same homes for everyone, resetting at midnight ET.
Built to be shared (Wordle-style emoji line), with streaks, stats and national/state leaderboards.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # lint + typecheck + unit tests
```

With no environment variables it runs on **sample homes** (fictional listings in real cities, drawn placeholder
photos) and an **in-memory store** (leaderboards reset with the server).

## How it works

- `src/lib/` is the pure domain core, unit-tested in `tests/unit/`:
  - `scoring.ts`: log-scale slider ($50K–$10M), typed-price parsing, points (100 for exact, falling linearly to 0 at
    60% off), tiers (🟩 ≤5%, 🟨 ≤15%, 🟥 beyond) and the reveal line ("Off by $212K. Too high.").
  - `day.ts`: Eastern-time day keys, day numbers (`LAUNCH_DAY` is #1) and the countdown to midnight ET.
  - `homes.ts` + `states.ts`: the `Home` shape and the eligibility filter (non-disclosure states excluded, 5+ photos,
    sold price present, single-family or condo, $50K–$10M, sold in the last 30 days).
  - `draw.ts`: the daily draw. Seeded by the date: a weighted random state, then a city, then a home, mixing price
    tiers (cheap, two mid, luxury, one wildcard), five different states, no repeats from the last 14 days. Also the
    neighbourhood hint: a circle that contains the home but isn't centred on it.
  - `stats.ts` / `share.ts`: streaks, distribution, share text and links.
  - `data/`: `HomeSource` (sample now, Redfin later), `GameStore` (memory, or Supabase over PostgREST), and
    `getOrCreateDay`.
- Prices and exact locations never reach the browser before the reveal: `/api/daily` sends public fields only,
  `/api/reveal` scores one guess, and `/api/score` re-scores the five guesses server-side before posting to the
  leaderboard.
- `/api/cron/pick` (Vercel Cron, nightly, `Authorization: Bearer $CRON_SECRET`) pre-picks today's and tomorrow's homes.
- `/s?d&g&t&s` is the share landing page; its link preview is `/api/og` (Vercel OG).
- Progress, history and stats live in `localStorage` for now (`src/lib/client/storage.ts`).

## Environment

| Variable                                    | Purpose                                                      |
| ------------------------------------------- | ------------------------------------------------------------ |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Use Supabase (run `supabase/schema.sql` first). Server only. |
| `CRON_SECRET`                               | Protects `/api/cron/pick`.                                   |
| `HOME_SOURCE=redfin`, `RAPIDAPI_KEY`        | Real homes. **Not wired yet**, see below.                    |
| `NEXT_PUBLIC_MAP_STYLE`                     | MapLibre style URL (default: OpenFreeMap Positron, no key).  |
| `NEXT_PUBLIC_ADS_ENABLED=1`                 | Show ad slots on reveal and result screens.                  |

## Not built yet

- **Redfin data** (`src/lib/data/source.ts`): the RapidAPI (ntd119) endpoints and fields need checking with a key, then
  mapping to `Home`. It's an unofficial Redfin scraper; move to agent-supplied listings or a licensed feed before
  scaling.
- **Accounts** (Supabase auth) so streaks and stats follow players across devices; today they're per browser.
- **Email/SMS reminders**, **Pro** (Stripe: past days, unlimited practice, ad-free, deeper stats), **realtor hosts**
  (listing-agent outreach, host picks; the reveal card already credits `home.host` or `home.listingAgent`), and the
  ad network itself.

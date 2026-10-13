import type { Home } from "../homes";
import type { Crowd } from "../crowd";
import type { Tier } from "../scoring";

/** A day's five homes, picked once and shared by every player. */
export type DailySet = { day: string; homes: Home[] };

export type ScoreEntry = {
  day: string;
  playerId: string;
  name?: string;
  state?: string;
  score: number;
  tiers: Tier[];
};

export interface GameStore {
  getDay(day: string): Promise<DailySet | null>;
  /** Saves the set unless one already exists for that day; returns the stored set. */
  saveDay(set: DailySet): Promise<DailySet>;
  /** Home ids featured on the given days. */
  homeIdsOn(days: string[]): Promise<Set<string>>;
  /** First submission per player per day wins. */
  submitScore(entry: ScoreEntry): Promise<void>;
  leaderboard(day: string, state?: string, limit?: number): Promise<ScoreEntry[]>;
  /** Records a player's guess for one home (first one counts). */
  recordGuess(day: string, index: number, playerId: string, guess: number): Promise<void>;
  /** How many players guessed this home, and how many of them guessed above `guess`, leaving out `playerId`. */
  crowd(day: string, index: number, guess: number, playerId: string): Promise<Crowd>;
}

type Mem = {
  days: Map<string, DailySet>;
  scores: Map<string, ScoreEntry>;
  guesses: Map<string, Map<string, number>>;
};
const g = globalThis as unknown as { __gtpMem?: Mem };

/** In-memory store for development: resets with the server. */
export function memoryStore(): GameStore {
  const mem = (g.__gtpMem ??= { days: new Map(), scores: new Map(), guesses: new Map() });
  mem.guesses ??= new Map();
  return {
    async getDay(day) {
      return mem.days.get(day) ?? null;
    },
    async saveDay(set) {
      if (!mem.days.has(set.day)) mem.days.set(set.day, set);
      return mem.days.get(set.day)!;
    },
    async homeIdsOn(days) {
      return new Set(days.flatMap((d): string[] => mem.days.get(d)?.homes.map((h: Home) => h.id) ?? []));
    },
    async submitScore(e) {
      const key = `${e.day}:${e.playerId}`;
      if (!mem.scores.has(key)) mem.scores.set(key, e);
    },
    async leaderboard(day, state, limit = 50) {
      return [...mem.scores.values()]
        .filter((e) => e.day === day && (!state || e.state === state))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    },
    async recordGuess(day, index, playerId, guess) {
      const key = `${day}:${index}`;
      const m = mem.guesses.get(key) ?? new Map<string, number>();
      if (!m.has(playerId)) m.set(playerId, guess);
      mem.guesses.set(key, m);
    },
    async crowd(day, index, guess, playerId) {
      const others = [...(mem.guesses.get(`${day}:${index}`) ?? new Map()).entries()]
        .filter(([p]) => p !== playerId)
        .map(([, g]) => g);
      return { count: others.length, higher: others.filter((g) => g > guess).length };
    },
  };
}

/** Supabase over PostgREST (tables in supabase/schema.sql). Server-only: uses the service role key. */
export function supabaseStore(url: string, key: string): GameStore {
  const rest = `${url.replace(/\/$/, "")}/rest/v1`;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  const call = async (path: string, init: RequestInit = {}) => {
    const res = await fetch(`${rest}/${path}`, {
      ...init,
      headers: { ...headers, ...init.headers },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    return res.status === 204 || res.status === 201 ? null : res.json();
  };
  const store: GameStore = {
    async getDay(day) {
      const rows = (await call(`daily_sets?day=eq.${day}&select=day,homes`)) as DailySet[];
      return rows[0] ?? null;
    },
    async saveDay(set) {
      await call("daily_sets?on_conflict=day", {
        method: "POST",
        body: JSON.stringify(set),
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      });
      return (await store.getDay(set.day))!;
    },
    async homeIdsOn(days) {
      if (!days.length) return new Set();
      const rows = (await call(`daily_sets?day=in.(${days.join(",")})&select=homes`)) as Pick<DailySet, "homes">[];
      return new Set(rows.flatMap((r) => r.homes.map((h) => h.id)));
    },
    async submitScore(e) {
      await call("scores?on_conflict=day,player_id", {
        method: "POST",
        body: JSON.stringify({
          day: e.day,
          player_id: e.playerId,
          name: e.name ?? null,
          state: e.state ?? null,
          score: e.score,
          tiers: e.tiers,
        }),
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      });
    },
    async leaderboard(day, state, limit = 50) {
      const filter = state ? `&state=eq.${encodeURIComponent(state)}` : "";
      const rows = (await call(
        `scores?day=eq.${day}${filter}&select=day,player_id,name,state,score,tiers&order=score.desc,created_at.asc&limit=${limit}`,
      )) as {
        day: string;
        player_id: string;
        name: string | null;
        state: string | null;
        score: number;
        tiers: Tier[];
      }[];
      return rows.map((r) => ({
        day: r.day,
        playerId: r.player_id,
        name: r.name ?? undefined,
        state: r.state ?? undefined,
        score: r.score,
        tiers: r.tiers,
      }));
    },
    async recordGuess(day, index, playerId, guess) {
      await call("guesses?on_conflict=day,home_index,player_id", {
        method: "POST",
        body: JSON.stringify({ day, home_index: index, player_id: playerId, guess }),
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      });
    },
    async crowd(day, index, guess, playerId) {
      const base = `guesses?day=eq.${day}&home_index=eq.${index}&player_id=neq.${encodeURIComponent(playerId)}&select=guess`;
      const count = async (filter: string) => {
        const res = await fetch(`${rest}/${base}${filter}`, {
          method: "HEAD",
          headers: { ...headers, Prefer: "count=exact" },
          cache: "no-store",
        });
        return Number(res.headers.get("content-range")?.split("/")[1] ?? 0);
      };
      const [all, higher] = await Promise.all([count(""), count(`&guess=gt.${guess}`)]);
      return { count: all, higher };
    },
  };
  return store;
}

export function gameStore(): GameStore {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  return SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? supabaseStore(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : memoryStore();
}

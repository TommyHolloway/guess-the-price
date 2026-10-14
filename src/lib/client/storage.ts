"use client";
import type { DayPlay } from "../stats";

// Per-browser state. Supabase auth will carry this across devices later; storage can fail (private mode), so
// every access is guarded and the game still plays without it.

const HISTORY = "gtp:history";
const PLAYER = "gtp:player";
const PREFS = "gtp:prefs";

export type Prefs = { name?: string; state?: string };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: progress just won't survive a reload.
  }
}

export const loadHistory = () => read<Record<string, DayPlay>>(HISTORY, {});
export const saveDayPlay = (play: DayPlay) => write(HISTORY, { ...loadHistory(), [play.day]: play });

export const loadPrefs = () => read<Prefs>(PREFS, {});
export const savePrefs = (p: Prefs) => write(PREFS, p);

export function playerId(): string {
  let id = read<string | null>(PLAYER, null);
  if (!id) {
    id = crypto.randomUUID();
    write(PLAYER, id);
  }
  return id;
}

/** Forgets one day's play (development only: lets the game be replayed). */
export function clearDayPlay(day: string) {
  const h = loadHistory();
  delete h[day];
  write(HISTORY, h);
}

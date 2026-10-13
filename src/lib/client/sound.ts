"use client";

// Game sounds, synthesised with Web Audio (no files to load). Muted by default; the 🔊 toggle turns them on.

const KEY = "gtp:sound";
let ctx: AudioContext | null = null;
const listeners = new Set<() => void>();

export function soundOn(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export function setSound(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Storage blocked: the setting lasts for this page only.
  }
  listeners.forEach((l) => l());
  if (on) play("tick");
}

export function subscribeSound(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(a: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.18) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(a.destination);
  o.start(start);
  o.stop(start + dur + 0.02);
}

function drumroll(a: AudioContext, t: number, dur: number) {
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const beat = (i / a.sampleRate) * 22; // 22 hits a second
    const env = Math.pow(1 - (beat % 1), 6) * (0.5 + (0.5 * i) / len); // each hit decays; the roll swells
    d[i] = (Math.random() * 2 - 1) * env;
  }
  const src = a.createBufferSource();
  const filter = a.createBiquadFilter();
  const g = a.createGain();
  src.buffer = buf;
  filter.type = "bandpass";
  filter.frequency.value = 900;
  g.gain.value = 0.35;
  src.connect(filter).connect(g).connect(a.destination);
  src.start(t);
}

export type SoundName = "tick" | "drumroll" | "drumrollShort" | "nailed" | "close" | "miss" | "fanfare";

export function play(name: SoundName) {
  if (!soundOn()) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.01;
  switch (name) {
    case "tick":
      return tone(a, 1400, t, 0.05, "square", 0.05);
    case "drumroll":
      return drumroll(a, t, 1.3);
    case "drumrollShort":
      return drumroll(a, t, 0.45);
    case "nailed": // bright arpeggio
      return [523, 659, 784, 1047].forEach((f, i) => tone(a, f, t + i * 0.08, 0.35, "triangle"));
    case "close": // cha-ching
      tone(a, 1318, t, 0.12, "square", 0.08);
      return tone(a, 1760, t + 0.1, 0.4, "square", 0.08);
    case "miss": // game-show buzzer
      return tone(a, 110, t, 0.45, "sawtooth", 0.12);
    case "fanfare":
      return [392, 523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
        tone(a, f, t + i * 0.11, i === 6 ? 0.6 : 0.2, "triangle"),
      );
  }
}

/** A short buzz on phones that allow it (not iOS Safari). */
export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Not supported.
  }
}

"use client";
import { useSyncExternalStore } from "react";
import { setSound, soundOn, subscribeSound } from "@/lib/client/sound";

export default function SoundToggle({ className = "" }: { className?: string }) {
  const on = useSyncExternalStore(subscribeSound, soundOn, () => false);
  return (
    <button
      onClick={() => setSound(!on)}
      aria-label={on ? "Mute sounds" : "Turn sounds on"}
      aria-pressed={on}
      className={`grid h-9 w-9 place-items-center rounded-full text-lg ${className}`}
    >
      {on ? "🔊" : "🔇"}
    </button>
  );
}

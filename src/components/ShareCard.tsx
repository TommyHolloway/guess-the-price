"use client";
import { useState } from "react";
import { shareTargets, shareText, shareUrl, type ShareResult } from "@/lib/share";

/** One-tap share: the native sheet where available, plus X, iMessage, WhatsApp and copy. */
export default function ShareCard({ result }: { result: ShareResult }) {
  const [copied, setCopied] = useState(false);
  const url = shareUrl(window.location.origin, result);
  const text = shareText(result);
  const targets = shareTargets(text, url);
  const canNative = typeof navigator.share === "function";

  const native = async () => {
    try {
      await navigator.share({ text, url });
    } catch {
      // Cancelled.
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the buttons still work.
    }
  };

  const btn = "rounded-xl px-3 py-2.5 text-sm font-bold text-center";
  return (
    <div>
      <pre className="rounded-xl bg-bg p-3 text-center font-sans text-lg leading-relaxed whitespace-pre-wrap">
        {text}
      </pre>
      {canNative && (
        <button onClick={native} className={`${btn} mt-3 w-full bg-brand text-brand-ink`}>
          Share your score
        </button>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <a href={targets.x} target="_blank" rel="noopener" className={`${btn} bg-black text-white`}>
          X
        </a>
        <a href={targets.imessage} className={`${btn} bg-[#34c759] text-white`}>
          iMessage
        </a>
        <a href={targets.whatsapp} target="_blank" rel="noopener" className={`${btn} bg-[#25d366] text-white`}>
          WhatsApp
        </a>
        <button onClick={copy} className={`${btn} border border-line bg-card`}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

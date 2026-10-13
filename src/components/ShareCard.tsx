"use client";
import { useState } from "react";
import { shareTargets, shareText, shareUrl, type ShareResult } from "@/lib/share";

/**
 * Share actions: the native sheet where there is one (phones), otherwise Copy, plus X, iMessage and WhatsApp. Below,
 * the link preview friends will see, so players know what they're posting.
 */
export default function ShareCard({ result }: { result: ShareResult }) {
  const [copied, setCopied] = useState(false);
  const url = shareUrl(window.location.origin, result);
  const text = shareText(result);
  const targets = shareTargets(text, url);
  const canNative = typeof navigator.share === "function";
  const preview = url.replace("/s?", "/api/og?");

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
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: the other buttons still work.
    }
  };

  const small = "btn-toy py-2.5 text-center text-sm";
  return (
    <div>
      <button
        onClick={canNative ? native : copy}
        className="btn-toy w-full bg-brand py-4 text-xl text-brand-ink"
        data-testid="share-primary"
      >
        {canNative ? "Share my score" : copied ? "Copied! Paste it anywhere" : "Copy my score"}
      </button>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        <a href={targets.x} target="_blank" rel="noopener" className={`${small} bg-black text-white`}>
          𝕏 Post
        </a>
        <a href={targets.imessage} className={`${small} bg-[#34c759] text-white`}>
          iMessage
        </a>
        <a href={targets.whatsapp} target="_blank" rel="noopener" className={`${small} bg-[#25d366] text-white`}>
          WhatsApp
        </a>
      </div>
      {canNative && (
        <button onClick={copy} className="mt-2 w-full text-center text-sm font-semibold text-muted underline">
          {copied ? "Copied!" : "Copy text instead"}
        </button>
      )}
      <figure className="mt-4">
        <figcaption className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
          What friends will see
        </figcaption>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview}
          alt="Your share card"
          width={1200}
          height={630}
          className="aspect-[1200/630] w-full rounded-xl border border-line bg-[#1c0f52]"
        />
      </figure>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { ADSENSE_CLIENT } from "@/config/site";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * A single AdSense display unit. Renders nothing until a real `slot` id is
 * passed (slots live in src/config/site.ts and are empty until the site is
 * approved) — so there are never empty ad boxes on the page pre-approval.
 */
export default function AdUnit({
  slot,
  className,
  format = "auto",
}: {
  slot?: string;
  className?: string;
  format?: string;
}) {
  useEffect(() => {
    if (!slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // adsbygoogle.js not loaded yet / blocked — ignore.
    }
  }, [slot]);

  if (!slot) return null;

  return (
    <ins
      className={["adsbygoogle", className].filter(Boolean).join(" ")}
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}

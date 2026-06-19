"use client";

import { useState } from "react";
import { CITY_BY_SLUG } from "@/config/cities";
import type { Stats } from "@/lib/types";

export default function SpikeBanner({
  spikes,
  onCity,
}: {
  spikes: Stats["spikes"];
  onCity: (slug: string) => void;
}) {
  const sig = spikes.map((s) => `${s.city}:${s.ratio}`).join(",");
  const [dismissed, setDismissed] = useState("");

  if (spikes.length === 0 || dismissed === sig) return null;

  return (
    <div className="flex items-center gap-2 border-b border-signal-warn/30 bg-signal-warn/10 px-4 py-1.5 text-xs">
      <span className="shrink-0 font-semibold text-signal-warn">⚠ Activity spike</span>
      <div className="flex flex-wrap gap-2">
        {spikes.map((s) => (
          <button
            key={s.city}
            onClick={() => onCity(s.city)}
            title={`${s.recent} articles this hour vs ${s.baseline}/h baseline`}
            className="rounded-full bg-signal-warn/15 px-2 py-0.5 text-signal-warn hover:bg-signal-warn/25"
          >
            {CITY_BY_SLUG[s.city]?.name ?? s.city} ↑ {s.ratio}×
          </button>
        ))}
      </div>
      <button onClick={() => setDismissed(sig)} className="ml-auto text-muted hover:text-slate-200" aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

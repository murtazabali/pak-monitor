"use client";

import type { Cluster } from "@/lib/cluster";

/** Horizontal strip of the most-reported stories (cross-outlet = breaking). */
export default function TrendingStrip({
  clusters,
  onOpen,
}: {
  clusters: Cluster[];
  onOpen: (id: string) => void;
}) {
  const trending = clusters
    .filter((c) => c.sources.length >= 2)
    .sort((a, b) => b.sources.length - a.sources.length)
    .slice(0, 6);

  if (trending.length === 0) return null;

  return (
    <div className="flex items-center gap-2 border-b border-edge/60 bg-base-900/40 px-4 py-2">
      <span className="shrink-0 text-xs font-semibold text-signal-warn">🔥 Trending</span>
      <div className="scroll-thin flex gap-2 overflow-x-auto">
        {trending.map((c) => (
          <a
            key={c.id}
            href={c.lead.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onOpen(c.lead.id)}
            title={c.lead.title}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-edge bg-base-800/60 px-2.5 py-1 text-xs text-slate-300 hover:border-accent/40 hover:text-accent"
          >
            <span className="rounded-full bg-signal-warn/20 px-1.5 font-mono text-[10px] text-signal-warn">
              {c.sources.length}
            </span>
            <span className="max-w-[16rem] truncate" dir="auto">
              {c.lead.title}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

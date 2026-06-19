"use client";

import { useEffect, useState } from "react";
import type { Stats, FeedHealth } from "@/lib/types";
import { CITY_BY_SLUG } from "@/config/cities";
import { CATEGORY_BY_SLUG } from "@/config/categories";
import { sourceColor } from "@/config/sources";
import { timeAgo } from "@/lib/timeago";
import Sparkline from "./Sparkline";

function TopList({
  title,
  entries,
  color,
  label,
}: {
  title: string;
  entries: Array<[string, number]>;
  color?: (k: string) => string;
  label?: (k: string) => string;
}) {
  const top = entries.sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(1, ...top.map(([, n]) => n));
  if (top.length === 0) return null;
  return (
    <div>
      <h3 className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">{title}</h3>
      <div className="flex flex-col gap-1">
        {top.map(([k, n]) => (
          <div key={k} className="flex items-center gap-2 text-xs">
            <span className="w-28 shrink-0 truncate text-slate-300">{label ? label(k) : k}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-base-800">
              <div
                className="h-full rounded-full"
                style={{ width: `${(n / max) * 100}%`, background: color ? color(k) : "#22d3ee" }}
              />
            </div>
            <span className="w-8 shrink-0 text-right font-mono text-muted">{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsPanel({
  open,
  onClose,
  citiesParam,
  onEntityClick,
}: {
  open: boolean;
  onClose: () => void;
  citiesParam: string;
  onEntityClick?: (name: string) => void;
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<FeedHealth[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    let cancel = false;
    setNow(Date.now());
    fetch(`/api/stats?cities=${encodeURIComponent(citiesParam)}`)
      .then((r) => r.json())
      .then((d) => !cancel && setStats(d))
      .catch(() => {});
    fetch(`/api/health`)
      .then((r) => r.json())
      .then((d) => !cancel && setHealth(d.feeds ?? []))
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [open, citiesParam]);

  if (!open) return null;

  const maxKw = Math.max(1, ...(stats?.topKeywords ?? []).map((k) => k.count));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="scroll-thin relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-edge bg-base-900 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-edge bg-base-900/95 px-4 py-3 backdrop-blur">
          <h2 className="font-mono text-sm font-bold tracking-tight text-slate-100">📊 Statistics</h2>
          <button onClick={onClose} className="rounded px-2 py-1 text-sm text-muted hover:bg-base-700/60 hover:text-slate-200">
            ✕
          </button>
        </div>

        {!stats ? (
          <div className="p-6 text-center text-sm text-muted">Loading…</div>
        ) : (
          <div className="flex flex-col gap-5 p-4">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  Articles (last 24h activity)
                </span>
                <span className="font-mono text-lg font-bold text-accent">{stats.total}</span>
              </div>
              <Sparkline data={stats.perHour} width={360} height={56} />
            </div>

            <TopList
              title="Top cities"
              entries={Object.entries(stats.byCity)}
              label={(k) => CITY_BY_SLUG[k]?.name ?? k}
            />
            <TopList
              title="Categories"
              entries={Object.entries(stats.byCategory)}
              color={(k) => CATEGORY_BY_SLUG[k]?.color ?? "#22d3ee"}
              label={(k) => CATEGORY_BY_SLUG[k]?.label ?? k}
            />
            <TopList title="Top sources" entries={Object.entries(stats.bySource)} color={sourceColor} />

            {stats.topEntities?.length > 0 && (
              <div>
                <h3 className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                  Most mentioned (click to search)
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {stats.topEntities.map((e) => (
                    <button
                      key={e.name}
                      onClick={() => {
                        onEntityClick?.(e.name);
                        onClose();
                      }}
                      className="rounded-full border border-edge bg-base-800/60 px-2 py-0.5 text-xs text-slate-300 hover:border-accent/40 hover:text-accent"
                    >
                      {e.name} <span className="text-muted">{e.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {stats.topKeywords.length > 0 && (
              <div>
                <h3 className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">Keywords</h3>
                <div className="flex flex-wrap gap-x-2.5 gap-y-1">
                  {stats.topKeywords.map((k) => (
                    <span
                      key={k.word}
                      className="text-slate-300"
                      style={{ fontSize: `${0.7 + (k.count / maxKw) * 0.8}rem`, opacity: 0.55 + (k.count / maxKw) * 0.45 }}
                    >
                      {k.word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {health.length > 0 && (
              <div>
                <h3 className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                  Feed health ({health.filter((f) => f.ok).length}/{health.length})
                </h3>
                <div className="flex flex-col gap-1">
                  {health.map((f) => (
                    <div key={f.id} className="flex items-center gap-2 text-[11px]">
                      <span className={f.ok ? "text-signal-live" : "text-signal-alert"}>{f.ok ? "●" : "○"}</span>
                      <span className="w-32 shrink-0 truncate text-slate-300">
                        {f.outlet}
                        <span className="text-muted"> · {f.name}</span>
                      </span>
                      <span className="w-10 text-right font-mono text-muted">{f.items}</span>
                      <span className="flex-1 truncate text-right text-muted">
                        {f.error ? f.error : timeAgo(f.lastFetch, now)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

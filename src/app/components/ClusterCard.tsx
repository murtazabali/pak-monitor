"use client";

import { useState } from "react";
import type { Cluster } from "@/lib/cluster";
import { sourceColor } from "@/config/sources";
import ArticleCard from "./ArticleCard";

export default function ClusterCard({
  cluster,
  now,
  isRead,
  watch,
  onOpen,
  focused = false,
}: {
  cluster: Cluster;
  now: number;
  isRead: (id: string) => boolean;
  watch: string[];
  onOpen: (id: string) => void;
  focused?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const multi = cluster.sources.length > 1;

  return (
    <div
      role="listitem"
      data-focused={focused ? "true" : undefined}
      className={focused ? "rounded-lg ring-2 ring-accent/70" : undefined}
    >
      <ArticleCard
        article={cluster.lead}
        now={now}
        read={isRead(cluster.lead.id)}
        watch={watch}
        onOpen={() => onOpen(cluster.lead.id)}
      />

      {multi && (
        <div className="mt-1 flex items-center gap-2 pl-3">
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-full border border-signal-info/40 bg-signal-info/10 px-2 py-0.5 text-[11px] font-medium text-signal-info hover:bg-signal-info/20"
          >
            📡 {cluster.sources.length} outlets reporting
            <span className="text-[9px]">{open ? "▾" : "▸"}</span>
          </button>
          <div className="flex -space-x-1">
            {cluster.sources.slice(0, 6).map((s) => (
              <span
                key={s}
                title={s}
                className="h-2.5 w-2.5 rounded-full ring-1 ring-base-900"
                style={{ background: sourceColor(s) }}
              />
            ))}
          </div>
        </div>
      )}

      {open && multi && (
        <ul className="ml-3 mt-1 flex flex-col gap-1 border-l border-edge/60 pl-3">
          {cluster.articles.slice(1).map((a) => (
            <li key={a.id} className="text-xs">
              <a
                href={a.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onOpen(a.id)}
                className="flex items-baseline gap-1.5 text-slate-400 hover:text-accent"
              >
                <span
                  className="shrink-0 font-mono uppercase"
                  style={{ color: sourceColor(a.source) }}
                >
                  {a.source}
                </span>
                <span dir="auto" className="clamp-1">
                  {a.title}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

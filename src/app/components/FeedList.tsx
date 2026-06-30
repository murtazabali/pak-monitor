"use client";

import { useEffect, useState } from "react";
import type { Cluster } from "@/lib/cluster";
import ClusterCard from "./ClusterCard";

interface Props {
  clusters: Cluster[];
  isRead: (id: string) => boolean;
  watch: string[];
  onOpen: (id: string) => void;
  focusedId?: string;
  emptyHint?: string;
  /** Deterministic first-render "now" for build-time baked cards (avoids a
   *  hydration mismatch on the "x min ago" labels). */
  initialNow?: number;
}

export default function FeedList({ clusters, isRead, watch, onOpen, focusedId, emptyHint, initialNow }: Props) {
  // Seed from the snapshot time (when rendering baked cards) so the server and
  // first client render agree; re-tick every 60s so the "x min ago" labels stay
  // fresh — and correct to the real clock immediately after mount.
  const [now, setNow] = useState(() => initialNow ?? Date.now());
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (clusters.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center text-muted">
        <div className="text-3xl opacity-40">📡</div>
        <p className="text-sm">{emptyHint ?? "Waiting for news to come in…"}</p>
      </div>
    );
  }

  return (
    <div role="list" className="flex flex-col gap-2">
      {clusters.map((c) => (
        <ClusterCard
          key={c.id}
          cluster={c}
          now={now}
          isRead={isRead}
          watch={watch}
          onOpen={onOpen}
          focused={c.id === focusedId}
        />
      ))}
    </div>
  );
}

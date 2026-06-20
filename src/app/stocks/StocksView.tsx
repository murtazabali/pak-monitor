"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Article, MarketSnapshot } from "@/lib/types";
import { clusterArticles } from "@/lib/cluster";
import { isLocalArticle } from "@/lib/relevance";
import FeedList from "@/app/components/FeedList";
import MarketPanel from "@/app/components/MarketPanel";
import SiteFooter from "@/app/components/SiteFooter";
import AdUnit from "@/app/components/AdUnit";
import { ADSENSE_SLOTS, SNAPSHOT_URL } from "@/config/site";

interface Snapshot {
  articles?: Article[];
  market?: MarketSnapshot | null;
}

const MAX_RENDERED = 80;

/**
 * Stocks page. Reads the same static snapshot as the dashboard and shows the
 * PSX market panel plus a feed narrowed to stock/market stories — so the page
 * needs no server. Renders a loading shell until the snapshot arrives.
 */
export default function StocksView() {
  const [snap, setSnap] = useState<Snapshot | null>(null);

  useEffect(() => {
    fetch(SNAPSHOT_URL)
      .then((r) => r.json())
      .then((d: Snapshot) => setSnap(d))
      .catch(() => setSnap({ articles: [] }));
  }, []);

  const clusters = useMemo(() => {
    // Prefer pure stock stories, but fall back to broader market/economy
    // (business) news so the feed isn't empty when the PSX is quiet (weekends).
    const stories = (snap?.articles ?? [])
      .filter(
        (a) => (a.categories?.includes("stocks") || a.categories?.includes("business")) && isLocalArticle(a),
      )
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
      .slice(0, MAX_RENDERED);
    return clusterArticles(stories);
  }, [snap]);

  if (!snap) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
        <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
          ← Back to monitor
        </Link>
        <p className="py-16 text-center text-sm text-muted">Loading market data…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
        ← Back to monitor
      </Link>

      <header className="mb-6 border-b border-edge/70 pb-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Markets</p>
        <h1 className="font-mono text-2xl font-bold text-slate-100">📈 Pakistan Stocks</h1>
        <p className="mt-1 text-sm text-muted">
          Live KSE-100 benchmark, top movers and the latest market headlines from
          the Pakistan Stock Exchange.
        </p>
      </header>

      <section className="mb-8">
        <MarketPanel market={snap.market} />
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
          📰 Stock &amp; market news
        </h2>
        <FeedList
          clusters={clusters}
          isRead={() => false}
          watch={[]}
          onOpen={() => {}}
          emptyHint="No stock or market stories in the latest snapshot yet."
        />
      </section>

      <AdUnit slot={ADSENSE_SLOTS.article} className="my-6 block" />
      <div className="mt-8">
        <SiteFooter />
      </div>
    </div>
  );
}

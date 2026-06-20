"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { clusterArticles } from "@/lib/cluster";
import { isLocalArticle } from "@/lib/relevance";
import { TOPIC_BY_SLUG } from "@/config/topics";
import FeedList from "@/app/components/FeedList";
import TopicPanel from "@/app/components/topics/TopicPanel";
import SiteFooter from "@/app/components/SiteFooter";
import AdUnit from "@/app/components/AdUnit";
import { ADSENSE_SLOTS, SNAPSHOT_URL } from "@/config/site";

interface Snapshot {
  articles?: Article[];
  topics?: Record<string, unknown>;
}

const MAX_RENDERED = 80;

/**
 * Generic dedicated page for any topic. Reads the shared static snapshot, renders
 * the topic's live-data panel plus a news feed scoped by the topic's config
 * (category + alsoInclude, and the `global` scope flag for PK relevance). One
 * component serves every topic — see src/config/topics.ts.
 */
export default function TopicView({ slug }: { slug: string }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const topic = TOPIC_BY_SLUG[slug];

  useEffect(() => {
    fetch(SNAPSHOT_URL)
      .then((r) => r.json())
      .then((d: Snapshot) => setSnap(d))
      .catch(() => setSnap({ articles: [] }));
  }, []);

  const clusters = useMemo(() => {
    if (!topic) return [];
    const cats = new Set<string>([topic.slug, ...(topic.alsoInclude ?? [])]);
    const stories = (snap?.articles ?? [])
      .filter(
        (a) =>
          a.categories?.some((c) => cats.has(c)) &&
          (topic.scope?.global || isLocalArticle(a)),
      )
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
      .slice(0, MAX_RENDERED);
    return clusterArticles(stories);
  }, [snap, topic]);

  if (!topic) return null;

  if (!snap) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
        <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
          ← Back to monitor
        </Link>
        <p className="py-16 text-center text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
        ← Back to monitor
      </Link>

      <header className="mb-6 border-b border-edge/70 pb-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{topic.label}</p>
        <h1 className="font-mono text-2xl font-bold text-slate-100">{topic.page.heading}</h1>
        <p className="mt-1 text-sm text-muted">{topic.page.blurb}</p>
      </header>

      <section className="mb-8">
        <TopicPanel slug={topic.slug} data={snap.topics?.[topic.slug]} />
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
          {topic.page.newsHeading}
        </h2>
        <FeedList
          clusters={clusters}
          isRead={() => false}
          watch={[]}
          onOpen={() => {}}
          emptyHint={topic.page.newsEmpty}
        />
      </section>

      <AdUnit slot={ADSENSE_SLOTS.article} className="my-6 block" />
      <div className="mt-8">
        <SiteFooter />
      </div>
    </div>
  );
}

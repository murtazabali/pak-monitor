import { ENABLED_FEEDS } from "@/config/feeds";
import { fetchFeed } from "@/lib/rss";
import { normalize } from "@/lib/normalize";
import { insertMany } from "@/lib/db";
import { publishArticle } from "@/lib/bus";
import { recordHealth } from "@/lib/health";
import { dispatchAlerts } from "@/lib/webhook";
import type { Article } from "@/lib/types";

/**
 * One ingestion pass: fetch all feeds → normalize → tag → store → emit → alert.
 * Returns the count of newly-stored articles. Called by the in-process poller
 * (always-on hosts) and by the /api/ingest endpoint (serverless cron).
 */
export async function runIngestCycle(): Promise<number> {
  const results = await Promise.allSettled(ENABLED_FEEDS.map((f) => fetchFeed(f)));
  const now = new Date().toISOString();

  const articles: Article[] = [];
  results.forEach((res, i) => {
    const source = ENABLED_FEEDS[i];
    const result = res.status === "fulfilled" ? res.value : { items: [], ok: false, error: "rejected" };

    recordHealth({
      id: source.id,
      outlet: source.outlet,
      name: source.name,
      url: source.url,
      ok: result.ok,
      items: result.items.length,
      lastFetch: now,
      error: result.error,
    });

    for (const raw of result.items) {
      const article = normalize(raw, source);
      if (article) articles.push(article);
    }
  });

  const fresh = await insertMany(articles);
  for (const a of fresh) publishArticle(a); // drives SSE on always-on hosts; no-op on serverless
  if (fresh.length > 0) {
    void dispatchAlerts(fresh);
    console.log(`[ingest] +${fresh.length} new (scanned ${articles.length})`);
  }
  return fresh.length;
}

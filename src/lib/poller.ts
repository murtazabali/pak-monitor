import { ENABLED_FEEDS } from "@/config/feeds";
import { fetchFeed } from "@/lib/rss";
import { normalize } from "@/lib/normalize";
import { initDb, insertMany } from "@/lib/db";
import { publishArticle } from "@/lib/bus";
import { recordHealth } from "@/lib/health";
import { dispatchAlerts, webhookEnabled } from "@/lib/webhook";
import type { Article } from "@/lib/types";

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 90_000;

// Idempotency guard: dev HMR / multiple module evaluations must not start the
// interval more than once. Stashed on globalThis to survive re-evaluation.
const g = globalThis as unknown as { __pakMonitorPollerStarted?: boolean };

async function cycle(): Promise<void> {
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
  for (const a of fresh) publishArticle(a);
  if (fresh.length > 0) {
    void dispatchAlerts(fresh);
    console.log(`[poller] +${fresh.length} new (scanned ${articles.length})`);
  }
}

export function startPoller(): void {
  if (g.__pakMonitorPollerStarted) return;
  g.__pakMonitorPollerStarted = true;

  console.log(
    `[poller] starting — ${ENABLED_FEEDS.length} feeds, every ${POLL_INTERVAL_MS / 1000}s` +
      (webhookEnabled() ? " · webhook alerts ON" : ""),
  );

  void initDb()
    .then(cycle)
    .catch((err) => console.error("[poller] initial cycle failed:", err));

  const timer = setInterval(() => {
    cycle().catch((err) => console.error("[poller] cycle failed:", err));
  }, POLL_INTERVAL_MS);
  // Don't keep the process alive solely for the timer.
  if (typeof timer.unref === "function") timer.unref();
}

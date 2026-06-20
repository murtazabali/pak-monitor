import type { Article, Stats } from "@/lib/types";
import { computeStats } from "@/lib/stats";
import { getArticleStore } from "@/lib/stores";

/** Rolling-window cap so the stored payload stays small. */
const MAX_ARTICLES = 2000;

const store = getArticleStore();

function byNewest(a: Article, b: Article): number {
  return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
}

export async function initDb(): Promise<void> {
  await store.load();
}

/**
 * Insert articles, skipping ones already stored (dedup by id, computed from the
 * loaded set so it works on both stateful and stateless backends).
 * Returns only the newly-added articles, newest first.
 */
export async function insertMany(articles: Article[]): Promise<Article[]> {
  const existing = await store.load();
  const seen = new Set(existing.map((a) => a.id));

  const fresh: Article[] = [];
  for (const a of articles) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    fresh.push(a);
  }
  if (fresh.length === 0) return [];

  const merged = [...existing, ...fresh].sort(byNewest).slice(0, MAX_ARTICLES);
  await store.save(merged);

  fresh.sort(byNewest);
  return fresh;
}

export interface QueryOpts {
  cities?: string[];
  categories?: string[];
  q?: string;
  /** ISO lower bound (inclusive) on publishedAt. */
  from?: string;
  /** ISO upper bound (inclusive) on publishedAt. */
  to?: string;
  limit?: number;
}

/** Read recent articles, newest-first, optionally filtered by city/category/search/date. */
export async function getRecent(opts: QueryOpts = {}): Promise<Article[]> {
  const { cities, categories, q, from, to, limit = 200 } = opts;
  const citySet = cities && cities.length ? new Set(cities) : null;
  const catSet = categories && categories.length ? new Set(categories) : null;
  const needle = q?.trim().toLowerCase();
  const fromMs = from ? Date.parse(from) : NaN;
  const toMs = to ? Date.parse(to) : NaN;

  let items = await store.load();
  if (citySet) items = items.filter((a) => a.cities.some((c) => citySet.has(c)));
  if (catSet) items = items.filter((a) => a.categories.some((c) => catSet.has(c)));
  if (needle) {
    items = items.filter(
      (a) => a.title.toLowerCase().includes(needle) || a.summary.toLowerCase().includes(needle),
    );
  }
  if (!Number.isNaN(fromMs)) items = items.filter((a) => Date.parse(a.publishedAt) >= fromMs);
  if (!Number.isNaN(toMs)) items = items.filter((a) => Date.parse(a.publishedAt) <= toMs);

  return [...items].sort(byNewest).slice(0, limit);
}

/** Aggregate stats over the stored window, optionally scoped to cities + a date
 *  range (from/to ISO). The breakdowns reflect the period; the 24h sparkline is
 *  always the city's most recent activity. */
export async function getStats(cities?: string[], from?: string, to?: string): Promise<Stats> {
  const all = await store.load();
  return computeStats(all, cities, from, to);
}

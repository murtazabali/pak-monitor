import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
import type { Article, Stats } from "@/lib/types";
import { tokenize } from "@/lib/text";
import { extractEntities } from "@/lib/entities";

interface Data {
  articles: Article[];
}

const DATA_DIR = join(process.cwd(), "data");
const DB_FILE = join(DATA_DIR, "db.json");

/** Rolling-window cap so the JSON file stays small. */
const MAX_ARTICLES = 2000;

let dbPromise: Promise<Low<Data>> | null = null;
// In-memory id index for O(1) dedup without scanning the array.
const seen = new Set<string>();

function byNewest(a: Article, b: Article): number {
  return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
}

function getDb(): Promise<Low<Data>> {
  if (!dbPromise) {
    mkdirSync(DATA_DIR, { recursive: true });
    dbPromise = JSONFilePreset<Data>(DB_FILE, { articles: [] }).then((db) => {
      db.data.articles.sort(byNewest);
      for (const a of db.data.articles) seen.add(a.id);
      return db;
    });
  }
  return dbPromise;
}

export async function initDb(): Promise<void> {
  await getDb();
}

/**
 * Insert articles, skipping ones already stored (dedup by id).
 * Returns only the newly-added articles, newest first.
 */
export async function insertMany(articles: Article[]): Promise<Article[]> {
  const db = await getDb();

  const fresh: Article[] = [];
  for (const a of articles) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    fresh.push(a);
  }
  if (fresh.length === 0) return [];

  db.data.articles.push(...fresh);
  db.data.articles.sort(byNewest);
  if (db.data.articles.length > MAX_ARTICLES) {
    const removed = db.data.articles.splice(MAX_ARTICLES);
    for (const r of removed) seen.delete(r.id);
  }
  await db.write();

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

/** Read recent articles, optionally filtered by city / category / search / date. */
export async function getRecent(opts: QueryOpts = {}): Promise<Article[]> {
  const db = await getDb();
  const { cities, categories, q, from, to, limit = 200 } = opts;

  const citySet = cities && cities.length ? new Set(cities) : null;
  const catSet = categories && categories.length ? new Set(categories) : null;
  const needle = q?.trim().toLowerCase();
  const fromMs = from ? Date.parse(from) : NaN;
  const toMs = to ? Date.parse(to) : NaN;

  let items: Article[] = db.data.articles;
  if (citySet) items = items.filter((a) => a.cities.some((c) => citySet.has(c)));
  if (catSet) items = items.filter((a) => a.categories.some((c) => catSet.has(c)));
  if (needle) {
    items = items.filter(
      (a) =>
        a.title.toLowerCase().includes(needle) ||
        a.summary.toLowerCase().includes(needle),
    );
  }
  if (!Number.isNaN(fromMs)) items = items.filter((a) => Date.parse(a.publishedAt) >= fromMs);
  if (!Number.isNaN(toMs)) items = items.filter((a) => Date.parse(a.publishedAt) <= toMs);

  return items.slice(0, limit);
}

/** Per-city counts over the recent window — used to size the map nodes. */
export async function cityCounts(): Promise<Record<string, number>> {
  const db = await getDb();
  const counts: Record<string, number> = {};
  for (const a of db.data.articles) {
    for (const c of a.cities) counts[c] = (counts[c] ?? 0) + 1;
  }
  return counts;
}

/** Aggregate stats over the stored window, optionally scoped to cities. */
export async function getStats(cities?: string[]): Promise<Stats> {
  const db = await getDb();
  const citySet = cities && cities.length ? new Set(cities) : null;
  const items = citySet
    ? db.data.articles.filter((a) => a.cities.some((c) => citySet.has(c)))
    : db.data.articles;

  const byCity: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const perHour = new Array<number>(24).fill(0);
  const keywords: Record<string, number> = {};
  const now = Date.now();

  for (const a of items) {
    for (const c of a.cities) byCity[c] = (byCity[c] ?? 0) + 1;
    for (const c of a.categories) byCategory[c] = (byCategory[c] ?? 0) + 1;
    bySource[a.source] = (bySource[a.source] ?? 0) + 1;

    const ageHours = Math.floor((now - Date.parse(a.publishedAt)) / 3_600_000);
    if (ageHours >= 0 && ageHours < 24) perHour[23 - ageHours]++;

    for (const t of tokenize(a.title)) keywords[t] = (keywords[t] ?? 0) + 1;
  }

  const topKeywords = Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([word, count]) => ({ word, count }));

  const topEntities = extractEntities(items.map((a) => a.title));

  // Spikes: per-city last-hour volume vs the mean of the prior 5 hours.
  // Computed over ALL articles (global signal), regardless of the city scope.
  const cityHourly: Record<string, number[]> = {};
  for (const a of db.data.articles) {
    const ageH = Math.floor((now - Date.parse(a.publishedAt)) / 3_600_000);
    if (ageH < 0 || ageH >= 6) continue;
    for (const c of a.cities) (cityHourly[c] ??= new Array(6).fill(0))[ageH]++;
  }
  const spikes = Object.entries(cityHourly)
    .map(([city, hrs]) => {
      const recent = hrs[0];
      const baseline = (hrs[1] + hrs[2] + hrs[3] + hrs[4] + hrs[5]) / 5;
      return { city, recent, baseline: Math.round(baseline * 10) / 10, ratio: Math.round((recent / Math.max(baseline, 1)) * 10) / 10 };
    })
    .filter((s) => s.recent >= 4 && s.ratio >= 2.5)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 4);

  return { total: items.length, byCity, byCategory, bySource, perHour, topKeywords, topEntities, spikes };
}

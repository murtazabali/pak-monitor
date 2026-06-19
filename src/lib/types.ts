// Shared domain types for Pak Monitor.

/** Keyword-derived topic of an article. "general" is the fallback. */
export type Category =
  | "politics"
  | "crime"
  | "weather"
  | "accident"
  | "business"
  | "sports"
  | "health"
  | "general";

/** A single RSS source. Edit src/config/feeds.ts to add/remove these. */
export interface FeedSource {
  id: string;
  name: string;
  outlet: string;
  url: string;
  enabled: boolean;
}

/** Health of one feed, recorded each poll cycle. */
export interface FeedHealth {
  id: string;
  outlet: string;
  name: string;
  url: string;
  ok: boolean;
  items: number;
  lastFetch: string;
  error?: string;
}

/** Aggregate stats over the stored window. */
export interface Stats {
  total: number;
  byCity: Record<string, number>;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
  /** Article counts per hour for the last 24h, oldest → newest. */
  perHour: number[];
  topKeywords: Array<{ word: string; count: number }>;
  topEntities: Array<{ name: string; count: number }>;
  /** Cities whose last-hour volume spiked vs their recent baseline. */
  spikes: Array<{ city: string; recent: number; baseline: number; ratio: number }>;
}

/** A monitored city. Edit src/config/cities.ts to add/remove these. */
export interface City {
  slug: string;
  name: string;
  province: string;
  /** Approximate centroid, used to plot the city on the map. */
  lat: number;
  lng: number;
  /** Neighborhoods / landmarks that imply this city when found in text. */
  localities: string[];
}

/** A normalized news item, after parsing + tagging. */
export interface Article {
  id: string;
  title: string;
  link: string;
  /** Outlet display name, e.g. "Dawn". */
  source: string;
  /** Originating feed id, e.g. "dawn-latest". */
  sourceId: string;
  summary: string;
  imageUrl: string | null;
  /** ISO timestamp from the feed (falls back to fetch time). */
  publishedAt: string;
  /** ISO timestamp of when we ingested it. */
  fetchedAt: string;
  /** Matched city slugs. */
  cities: string[];
  /** Matched category tags. */
  categories: Category[];
}

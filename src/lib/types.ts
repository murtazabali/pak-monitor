// Shared domain types for Pak Monitor.

/** Keyword-derived topic of an article. "general" is the fallback. */
export type Category =
  | "politics"
  | "crime"
  | "weather"
  | "accident"
  | "business"
  | "stocks"
  | "fifa"
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

/** A market index quote (e.g. the KSE-100 benchmark). */
export interface IndexQuote {
  /** Index symbol, e.g. "KSE100". */
  symbol: string;
  /** Display label, e.g. "KSE-100". */
  label: string;
  /** Latest level (live during trading hours, otherwise last close). */
  value: number;
  /** Point change vs the previous session's close. */
  change: number;
  /** Percentage change vs the previous session's close. */
  changePct: number;
}

/** A single stock's session move, used for gainers/losers tables. */
export interface Mover {
  symbol: string;
  /** Company name, when available from the source. */
  name: string;
  /** Latest traded price. */
  price: number;
  /** Percentage change vs the previous close (signed). */
  changePct: number;
  /** Shares traded this session. */
  volume: number;
}

/**
 * PSX market snapshot. Produced off-browser by the cron
 * (src/lib/topics/stocks.ts) and embedded under `topics.stocks` in snapshot.json.
 * `null` when the upstream data portal is unreachable, so the UI degrades.
 */
export interface MarketSnapshot {
  /** ISO timestamp of the underlying data (last tick / close), not fetch time. */
  asOf: string;
  /** Whether the exchange appears to be in a live session. */
  status: "open" | "closed";
  /** Benchmark index (KSE-100). */
  index: IndexQuote;
  /** Top gainers by % change among KSE-100 constituents. */
  gainers: Mover[];
  /** Top losers by % change among KSE-100 constituents. */
  losers: Mover[];
}

/** A goal scored in a match. */
export interface FifaGoal {
  /** Scorer's short name, e.g. "B. Brobbey". */
  player: string;
  /** Match minute, e.g. "45'", "90'+2'". */
  minute: string;
  /** "OG" (own goal) or "P" (penalty), when applicable. */
  note?: string;
}

/** One side of a football fixture. */
export interface FifaTeam {
  name: string;
  abbr: string;
  logo: string | null;
  /** Goals; null before kickoff. */
  score: number | null;
  winner: boolean;
  /** Goalscorers for this side (chronological). */
  goals: FifaGoal[];
}

/** A single FIFA World Cup match (fixture or result). */
export interface FifaMatch {
  id: string;
  /** ISO kickoff time. */
  date: string;
  /** "pre" = upcoming, "in" = live, "post" = finished. */
  state: "pre" | "in" | "post";
  /** Short status, e.g. "FT", "55'", or a kickoff time. */
  status: string;
  /** Stage label, e.g. "Group Stage". */
  round: string;
  home: FifaTeam;
  away: FifaTeam;
}

/**
 * FIFA World Cup snapshot. Produced off-browser by the cron
 * (src/lib/topics/fifa.ts) and embedded under `topics.fifa` in snapshot.json.
 * `null` when the upstream feed is unreachable.
 */
export interface FifaSnapshot {
  league: string;
  season: number;
  asOf: string;
  live: FifaMatch[];
  /** Finished matches, newest first. */
  recent: FifaMatch[];
  /** Scheduled matches, soonest first. */
  upcoming: FifaMatch[];
}

import type { FeedSource } from "@/lib/types";
import { CITIES } from "@/config/cities";

/**
 * RSS sources the poller ingests.
 *
 * ── To ADD a feed: append one object below with a unique `id` and `enabled: true`.
 *    Nothing else needs to change — parsing, tagging and streaming are generic.
 *
 * The 12 enabled feeds were verified to return valid RSS with titles, dates,
 * descriptions and images. The disabled ones block some server fetchers at the
 * CDN; they usually work once a browser User-Agent is sent (the poller does that),
 * so feel free to flip `enabled: true` and restart to try them.
 */
export const FEEDS: FeedSource[] = [
  // ── Dawn ────────────────────────────────────────────────────────────────
  { id: "dawn-latest", name: "Latest News", outlet: "Dawn", url: "https://www.dawn.com/feeds/latest-news", enabled: true },
  { id: "dawn-pakistan", name: "Pakistan", outlet: "Dawn", url: "https://www.dawn.com/feeds/pakistan", enabled: true },
  { id: "dawn-home", name: "Home", outlet: "Dawn", url: "https://www.dawn.com/feeds/home", enabled: true },

  // ── The News International ───────────────────────────────────────────────
  { id: "thenews-national", name: "National", outlet: "The News", url: "https://www.thenews.com.pk/rss/1/1", enabled: true },
  { id: "thenews-world", name: "World", outlet: "The News", url: "https://www.thenews.com.pk/rss/1/2", enabled: true },

  // ── Express Tribune ──────────────────────────────────────────────────────
  { id: "tribune-home", name: "Home", outlet: "Express Tribune", url: "https://tribune.com.pk/feed/home", enabled: true },
  { id: "tribune-pakistan", name: "Pakistan", outlet: "Express Tribune", url: "https://tribune.com.pk/feed/pakistan", enabled: true },

  // ── Geo News ─────────────────────────────────────────────────────────────
  { id: "geo-pakistan", name: "Pakistan", outlet: "Geo News", url: "https://www.geo.tv/rss/1/1", enabled: true },

  // ── ARY News ─────────────────────────────────────────────────────────────
  { id: "ary", name: "Latest", outlet: "ARY News", url: "https://arynews.tv/feed/", enabled: true },

  // ── Business Recorder ────────────────────────────────────────────────────
  { id: "brecorder-latest", name: "Latest News", outlet: "Business Recorder", url: "https://www.brecorder.com/feeds/latest-news", enabled: true },
  { id: "brecorder-pakistan", name: "Pakistan", outlet: "Business Recorder", url: "https://www.brecorder.com/feeds/pakistan", enabled: true },

  // ── The Nation ───────────────────────────────────────────────────────────
  { id: "nation-national", name: "National", outlet: "The Nation", url: "https://www.nation.com.pk/rss/national", enabled: true },

  // ── ProPakistani (tech / business / telecom) ─────────────────────────────
  { id: "propakistani", name: "Latest", outlet: "ProPakistani", url: "https://propakistani.pk/feed/", enabled: true },

  // ── Urdu-language (RTL) ──────────────────────────────────────────────────
  { id: "bbc-urdu", name: "Urdu", outlet: "BBC Urdu", url: "https://feeds.bbci.co.uk/urdu/rss.xml", enabled: true },
  { id: "express-urdu", name: "Urdu", outlet: "Express Urdu", url: "https://www.express.pk/feed/", enabled: true },

  // ── Disabled by default (CDN bot-blocking — try enabling) ────────────────
  { id: "samaa", name: "Feed", outlet: "Samaa TV", url: "https://www.samaa.tv/feed", enabled: false },
  { id: "pakistantoday", name: "Feed", outlet: "Pakistan Today", url: "https://www.pakistantoday.com.pk/feed/", enabled: false },
  { id: "dailytimes", name: "Feed", outlet: "Daily Times", url: "https://dailytimes.com.pk/feed/", enabled: false },
];

/**
 * Google News exposes a keyword RSS feed with no API key. We query one per city
 * ("<City>" Pakistan) to widen local coverage well beyond outlets that publish
 * native feeds. The real outlet name comes back in each item's <source> element.
 */
export function googleNewsFeeds(): FeedSource[] {
  return CITIES.map((c) => ({
    id: `gnews-${c.slug}`,
    name: c.name,
    outlet: "Google News",
    url: `https://news.google.com/rss/search?q=${encodeURIComponent(`"${c.name}" Pakistan`)}&hl=en-PK&gl=PK&ceid=PK:en`,
    enabled: true,
  }));
}

/** Set GOOGLE_NEWS=off to disable the per-city Google News feeds. */
const GOOGLE_NEWS_ON = process.env.GOOGLE_NEWS !== "off";

/** Feeds the poller will actually fetch. */
export const ENABLED_FEEDS: FeedSource[] = [
  ...FEEDS.filter((f) => f.enabled),
  ...(GOOGLE_NEWS_ON ? googleNewsFeeds() : []),
];

import Parser from "rss-parser";
import type { FeedSource } from "@/lib/types";

// A descriptive, browser-like User-Agent. Several Pakistani outlets 403 the
// default fetcher UA at the CDN, so we always send this.
const USER_AGENT =
  "Mozilla/5.0 (compatible; pak-monitor/1.0; +https://github.com/pak-monitor)";

export type RawItem = Record<string, unknown>;

export interface FetchResult {
  items: RawItem[];
  ok: boolean;
  error?: string;
}

const parser: Parser = new Parser({
  timeout: 15_000,
  headers: {
    "User-Agent": USER_AGENT,
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:content", "media", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "content:encoded"],
      // Google News puts the real outlet name in <source>.
      ["source", "gsource"],
    ],
  },
});

/** Fetch + parse a single feed. Never throws — returns ok:false on failure so one
 *  dead/slow feed can't abort an ingestion cycle (and feed health is recorded). */
export async function fetchFeed(source: FeedSource): Promise<FetchResult> {
  try {
    const feed = await parser.parseURL(source.url);
    return { items: (feed.items ?? []) as RawItem[], ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[rss] ${source.outlet} (${source.id}) failed: ${msg}`);
    return { items: [], ok: false, error: msg };
  }
}

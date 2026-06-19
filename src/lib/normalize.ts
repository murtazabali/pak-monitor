import { createHash } from "node:crypto";
import type { Article, FeedSource } from "@/lib/types";
import { tagCities } from "@/lib/cityTagger";
import { classify } from "@/lib/classifier";
import { stripHtml, truncate } from "@/lib/text";

interface RawItem {
  title?: string;
  link?: string;
  guid?: string;
  isoDate?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  "content:encoded"?: string;
  summary?: string;
  enclosure?: { url?: string };
  media?: Array<{ $?: { url?: string; medium?: string; type?: string } }>;
  mediaThumbnail?: { $?: { url?: string } };
  gsource?: unknown;
}

/** Google News titles are "Headline - Outlet"; pull the real outlet out and
 *  clean the headline. Prefers the <source> element when present. */
function resolveGoogleNews(title: string, item: RawItem): { title: string; outlet: string | null } {
  const g = item.gsource;
  let outlet: string | null =
    typeof g === "string"
      ? g
      : g && typeof g === "object" && "_" in g
        ? String((g as { _: unknown })._)
        : null;

  const dash = title.lastIndexOf(" - ");
  if (dash > 0) {
    const tail = title.slice(dash + 3).trim();
    title = title.slice(0, dash).trim();
    if (!outlet && tail) outlet = tail;
  }
  return { title, outlet };
}

function hashId(input: string): string {
  return createHash("sha1").update(input).digest("hex").slice(0, 16);
}

function isHttpUrl(url: unknown): url is string {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

function extractImage(item: RawItem): string | null {
  if (Array.isArray(item.media)) {
    for (const m of item.media) {
      const medium = m?.$?.medium;
      const type = m?.$?.type;
      if (medium && medium !== "image") continue;
      if (type && !type.startsWith("image")) continue;
      if (isHttpUrl(m?.$?.url)) return m!.$!.url!;
    }
  }
  if (isHttpUrl(item.mediaThumbnail?.$?.url)) return item.mediaThumbnail!.$!.url!;
  if (isHttpUrl(item.enclosure?.url)) return item.enclosure!.url!;

  const html = String(item["content:encoded"] || item.content || item.summary || "");
  const match = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  if (match && isHttpUrl(match[1])) return match[1];

  return null;
}

function parseDate(item: RawItem, fallbackISO: string): string {
  const raw = item.isoDate || item.pubDate;
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return fallbackISO;
}

/** Convert a raw RSS item into a normalized, tagged Article. Returns null if the
 *  item lacks the essentials (title + link). */
export function normalize(raw: Record<string, unknown>, source: FeedSource): Article | null {
  const item = raw as RawItem;
  let title = stripHtml((item.title || "").toString());
  const link = (item.link || "").toString().trim();
  if (!title || !link) return null;

  let outlet = source.outlet;
  if (source.id.startsWith("gnews")) {
    const g = resolveGoogleNews(title, item);
    title = g.title;
    if (g.outlet) outlet = g.outlet;
  }

  const fetchedAt = new Date().toISOString();
  const rawSummary =
    item.contentSnippet || item.summary || item.content || item["content:encoded"] || "";
  const summary = truncate(stripHtml(String(rawSummary)));

  return {
    id: hashId(String(item.guid || link)),
    title,
    link,
    source: outlet,
    sourceId: source.id,
    summary,
    imageUrl: extractImage(item),
    publishedAt: parseDate(item, fetchedAt),
    fetchedAt,
    cities: tagCities(title, summary),
    categories: classify(`${title} ${summary}`),
  };
}

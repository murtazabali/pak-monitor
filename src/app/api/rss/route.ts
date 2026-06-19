import type { NextRequest } from "next/server";
import { getRecent } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseList(value: string | null): string[] {
  return value
    ? value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** A filtered RSS 2.0 feed of the current view — subscribe to it in any reader. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const cities = parseList(sp.get("cities"));
  const categories = parseList(sp.get("categories"));
  const q = sp.get("q") ?? undefined;
  const limit = Math.min(Number(sp.get("limit")) || 50, 200);

  const articles = await getRecent({ cities, categories, q, limit });
  const scope = cities.length ? cities.map((c) => c[0].toUpperCase() + c.slice(1)).join(", ") : "Pakistan";

  const items = articles
    .map(
      (a) => `    <item>
      <title>${esc(a.title)}</title>
      <link>${esc(a.link)}</link>
      <guid isPermaLink="false">${esc(a.id)}</guid>
      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
      <dc:creator>${esc(a.source)}</dc:creator>
      <category>${esc(a.categories.join(", "))}</category>
      <description>${esc(a.summary)}</description>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Pak Monitor — ${esc(scope)}</title>
    <link>${esc(req.nextUrl.origin)}</link>
    <description>Realtime Pakistan city news</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "no-store" },
  });
}

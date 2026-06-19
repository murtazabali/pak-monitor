import type { NextRequest } from "next/server";
import { getRecent, cityCounts } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseList(value: string | null): string[] {
  return value
    ? value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];
}

/** Backlog endpoint: recent articles for the initial render + per-city counts. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const cities = parseList(sp.get("cities"));
  const categories = parseList(sp.get("categories"));
  const q = sp.get("q") ?? undefined;
  const from = sp.get("from") ?? undefined;
  const to = sp.get("to") ?? undefined;
  const limit = Math.min(Number(sp.get("limit")) || 200, 500);

  const [articles, counts] = await Promise.all([
    getRecent({ cities, categories, q, from, to, limit }),
    cityCounts(),
  ]);

  return Response.json(
    { articles, counts, count: articles.length },
    { headers: { "Cache-Control": "no-store" } },
  );
}

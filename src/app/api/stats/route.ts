import type { NextRequest } from "next/server";
import { getStats } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseList(value: string | null): string[] {
  return value
    ? value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const cities = parseList(sp.get("cities"));
  const from = sp.get("from") ?? undefined;
  const to = sp.get("to") ?? undefined;
  const stats = await getStats(cities, from, to);
  return Response.json(stats, { headers: { "Cache-Control": "no-store" } });
}

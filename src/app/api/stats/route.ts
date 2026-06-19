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
  const cities = parseList(req.nextUrl.searchParams.get("cities"));
  const stats = await getStats(cities);
  return Response.json(stats, { headers: { "Cache-Control": "no-store" } });
}

import { getHealth } from "@/lib/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const feeds = getHealth();
  return Response.json(
    { feeds, ok: feeds.filter((f) => f.ok).length, total: feeds.length },
    { headers: { "Cache-Control": "no-store" } },
  );
}

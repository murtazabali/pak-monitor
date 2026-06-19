import type { NextRequest } from "next/server";
import { initDb } from "@/lib/db";
import { runIngestCycle } from "@/lib/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Universal ingestion trigger. Any scheduler (Netlify Scheduled Function, Vercel
 * Cron, Render/Railway cron, GitHub Actions, an external cron service) can call
 * this on a schedule. Protected by CRON_SECRET when that env var is set.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
    if (provided !== secret) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  await initDb();
  const added = await runIngestCycle();
  return Response.json({ ok: true, added }, { headers: { "Cache-Control": "no-store" } });
}

export const GET = handle;
export const POST = handle;

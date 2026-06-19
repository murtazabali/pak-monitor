import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runIngestCycle } from "@/lib/ingest";
import { getRecent, cityCounts, getStats } from "@/lib/db";

/**
 * Produce a self-contained data snapshot the static frontend can poll, so the
 * app needs no live read-API. Run by `npm run snapshot` (locally or in a cron /
 * GitHub Action). Honors the same env vars (GOOGLE_NEWS, RSS_TIMEOUT_MS, …).
 */
async function main() {
  const added = await runIngestCycle();
  const [articles, counts, stats] = await Promise.all([
    getRecent({ limit: 600 }),
    cityCounts(),
    getStats(),
  ]);

  const snapshot = { generatedAt: new Date().toISOString(), articles, counts, stats };
  const dir = join(process.cwd(), "public", "data");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "snapshot.json"), JSON.stringify(snapshot));

  console.log(`[snapshot] wrote ${articles.length} articles (added ${added}) → public/data/snapshot.json`);
}

main().catch((err) => {
  console.error("[snapshot] failed:", err);
  process.exit(1);
});

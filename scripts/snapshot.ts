import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runIngestCycle } from "@/lib/ingest";
import { getRecent, getStats } from "@/lib/db";

/**
 * Produce a self-contained data snapshot the static frontend can poll, so the
 * app needs no live read-API. Run by `npm run snapshot` (locally or in a cron /
 * GitHub Action). Honors the same env vars (GOOGLE_NEWS, RSS_TIMEOUT_MS, …).
 */
async function main() {
  const added = await runIngestCycle();
  const [articles, stats] = await Promise.all([
    getRecent({ limit: 600 }),
    getStats(),
  ]);

  // No `counts` field: the client derives per-city counts from `articles` so the
  // chips always match the shipped data (a full-store count would over-count).
  const snapshot = { generatedAt: new Date().toISOString(), articles, stats };
  const dir = join(process.cwd(), "public", "data");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "snapshot.json"), JSON.stringify(snapshot));

  console.log(`[snapshot] wrote ${articles.length} articles (added ${added}) → public/data/snapshot.json`);
}

// Force-exit on success: feed fetches leave keep-alive sockets open, which keep
// Node's event loop alive and would otherwise hang the process (and the CI step)
// long after the snapshot is written. The file is written synchronously above,
// so exiting here loses nothing.
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[snapshot] failed:", err);
    process.exit(1);
  });

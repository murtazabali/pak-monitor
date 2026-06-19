import { ENABLED_FEEDS } from "@/config/feeds";
import { initDb } from "@/lib/db";
import { runIngestCycle } from "@/lib/ingest";
import { webhookEnabled } from "@/lib/webhook";
import { isServerless } from "@/lib/env";

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 90_000;

// Idempotency guard: dev HMR / multiple module evaluations must not start the
// interval more than once. Stashed on globalThis to survive re-evaluation.
const g = globalThis as unknown as { __pakMonitorPollerStarted?: boolean };

export function startPoller(): void {
  if (g.__pakMonitorPollerStarted) return;

  // On serverless there's no always-on process, so the interval is pointless
  // (and the read-only filesystem breaks the file store) — ingestion runs via
  // the /api/ingest endpoint hit by a scheduled cron instead. Auto-detected so
  // it's safe even if DISABLE_POLLER isn't set.
  if (process.env.DISABLE_POLLER === "1" || isServerless()) return;

  g.__pakMonitorPollerStarted = true;

  console.log(
    `[poller] starting — ${ENABLED_FEEDS.length} feeds, every ${POLL_INTERVAL_MS / 1000}s` +
      (webhookEnabled() ? " · webhook alerts ON" : ""),
  );

  void initDb()
    .then(() => runIngestCycle())
    .catch((err) => console.error("[poller] initial cycle failed:", err));

  const timer = setInterval(() => {
    runIngestCycle().catch((err) => console.error("[poller] cycle failed:", err));
  }, POLL_INTERVAL_MS);
  if (typeof timer.unref === "function") timer.unref();
}

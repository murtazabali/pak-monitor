import { schedule } from "@netlify/functions";

// Netlify has no always-on process, so a scheduled function drives ingestion by
// pinging the app's universal /api/ingest endpoint. Runs every 2 minutes.
export const handler = schedule("*/2 * * * *", async () => {
  const base = process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? "http://localhost:8888";
  try {
    const res = await fetch(`${base}/api/ingest`, {
      method: "POST",
      headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
    });
    console.log(`[ingest-scheduled] ${res.status}`);
  } catch (err) {
    console.error("[ingest-scheduled] failed", err);
  }
  return { statusCode: 200 };
});

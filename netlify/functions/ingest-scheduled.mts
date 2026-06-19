import { schedule } from "@netlify/functions";

// Netlify has no always-on process, so a scheduled function drives ingestion by
// pinging the app's universal /api/ingest endpoint. Runs every 2 minutes.
// Override the target with INGEST_URL if auto-resolution is wrong.
export const handler = schedule("*/2 * * * *", async () => {
  const base = (process.env.INGEST_URL ?? process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? "http://localhost:8888").replace(/\/$/, "");
  const url = `${base}/api/ingest`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
    });
    console.log(`[ingest-scheduled] POST ${url} -> ${res.status}`);
  } catch (err) {
    console.error(`[ingest-scheduled] POST ${url} failed`, err);
  }
  return { statusCode: 200 };
});

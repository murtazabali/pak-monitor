import type { Article } from "@/lib/types";
import { CITY_BY_SLUG } from "@/config/cities";

// Configured entirely via env (a deployment-level integration, not per-user):
//   ALERT_WEBHOOK_URL     incoming webhook URL (Slack / Discord / anything)
//   ALERT_WEBHOOK_FORMAT  slack | discord | json   (default: auto-detect)
//   ALERT_CITIES          csv of city slugs to alert on (default: all)
//   ALERT_CATEGORIES      csv of categories          (default: crime,accident)
const WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;
const FORMAT = (process.env.ALERT_WEBHOOK_FORMAT ?? "").toLowerCase();
const ALERT_CITIES = (process.env.ALERT_CITIES ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const ALERT_CATEGORIES = (process.env.ALERT_CATEGORIES ?? "crime,accident")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function webhookEnabled(): boolean {
  return Boolean(WEBHOOK_URL);
}

function detectFormat(url: string): "slack" | "discord" | "json" {
  if (FORMAT === "slack" || FORMAT === "discord" || FORMAT === "json") return FORMAT;
  if (url.includes("hooks.slack.com")) return "slack";
  if (url.includes("discord.com") || url.includes("discordapp.com")) return "discord";
  return "json";
}

function matches(a: Article): boolean {
  if (ALERT_CITIES.length && !a.cities.some((c) => ALERT_CITIES.includes(c))) return false;
  if (ALERT_CATEGORIES.length && !a.categories.some((c) => ALERT_CATEGORIES.includes(c))) return false;
  return true;
}

/** POST matching breaking-news items to the configured webhook (batched, once per cycle). */
export async function dispatchAlerts(fresh: Article[]): Promise<void> {
  if (!WEBHOOK_URL) return;
  const hits = fresh.filter(matches).slice(0, 8);
  if (hits.length === 0) return;

  const lines = hits.map((a) => {
    const where = a.cities.map((c) => CITY_BY_SLUG[c]?.name ?? c).join(", ");
    return { a, where };
  });

  let body: unknown;
  const fmt = detectFormat(WEBHOOK_URL);
  if (fmt === "slack") {
    body = {
      text:
        `*🛰️ Pak Monitor — ${hits.length} alert${hits.length > 1 ? "s" : ""}*\n` +
        lines.map(({ a, where }) => `• <${a.link}|${a.title}> _(${a.source}${where ? ` · ${where}` : ""})_`).join("\n"),
    };
  } else if (fmt === "discord") {
    body = {
      content: (
        `**🛰️ Pak Monitor — ${hits.length} alert${hits.length > 1 ? "s" : ""}**\n` +
        lines.map(({ a, where }) => `• [${a.title}](${a.link}) (${a.source}${where ? ` · ${where}` : ""})`).join("\n")
      ).slice(0, 1900),
    };
  } else {
    body = { text: `Pak Monitor: ${hits.length} alert${hits.length > 1 ? "s" : ""}`, articles: hits };
  }

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn("[webhook] post failed:", err instanceof Error ? err.message : String(err));
  }
}

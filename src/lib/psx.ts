import type { IndexQuote, MarketSnapshot, Mover } from "@/lib/types";

/**
 * Pakistan Stock Exchange market data, scraped from the public PSX data portal
 * (https://dps.psx.com.pk) — no API key. Run off-browser by the snapshot cron
 * (scripts/snapshot.ts), so there is no CORS concern and the result is embedded
 * in snapshot.json for the static frontend.
 *
 * Nothing here throws: a flaky/blocked upstream yields `null` (or empty mover
 * lists) so the rest of the snapshot still publishes and the UI degrades.
 */

const BASE = "https://dps.psx.com.pk";
const SYMBOL = "KSE100";
const TIMEOUT_MS = Number(process.env.PSX_TIMEOUT_MS) || 15_000;
const TOP_N = 5;
// Several PSX endpoints 403 a default fetcher UA at the CDN.
const USER_AGENT =
  "Mozilla/5.0 (compatible; pak-monitor/1.0; +https://github.com/pak-monitor)";

const DAY_SECONDS = 86_400;

interface Series {
  status?: number;
  message?: string;
  /** Rows are [unixSeconds, value, volume, ...], newest-first. */
  data?: number[][];
}

async function fetchText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "*/*" },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url: string): Promise<Series> {
  return JSON.parse(await fetchText(url)) as Series;
}

/**
 * Build the KSE-100 quote from the intraday + end-of-day series. The intraday
 * series gives the live (or last) level; the daily change is measured against
 * the most recent EOD close that precedes the current trading day. Pure +
 * synchronous so it can be unit-tested against captured fixtures.
 */
export function parseIndex(int: Series, eod: Series): IndexQuote | null {
  const intData = int?.data ?? [];
  const eodData = eod?.data ?? [];
  const latest = intData[0] ?? eodData[0];
  if (!latest || typeof latest[1] !== "number") return null;

  const value = latest[1];
  const curDay = Math.floor(latest[0] / DAY_SECONDS);
  // Previous session's close: newest EOD point strictly before today, else the
  // second EOD point (today already closed), else fall back to the value itself.
  const prevPoint =
    eodData.find((d) => Math.floor(d[0] / DAY_SECONDS) < curDay) ?? eodData[1] ?? eodData[0];
  const prevClose = prevPoint && typeof prevPoint[1] === "number" ? prevPoint[1] : value;
  const change = value - prevClose;
  const changePct = prevClose ? (change / prevClose) * 100 : 0;

  return { symbol: SYMBOL, label: "KSE-100", value, change, changePct };
}

/**
 * Extract the top gainers/losers among KSE-100 constituents from the
 * `/market-watch` HTML table. Each row carries the numeric fields as
 * `data-order` attributes (LDCP, OPEN, HIGH, LOW, CURRENT, CHANGE, CHANGE%,
 * VOLUME, in that order) and the sign is encoded via a `change__text--neg`
 * class. Pure so it can be tested against a captured HTML fixture.
 */
export function parseMovers(html: string, limit = TOP_N): { gainers: Mover[]; losers: Mover[] } {
  const movers: Mover[] = [];

  for (const row of html.split("<tr").slice(1)) {
    // Only index constituents — `\bKSE100\b` matches the membership token but
    // not "KSE100PR"/"KSE100" prefixes of other index codes.
    if (!/\bKSE100\b/.test(row)) continue;

    const symbol = row.match(/data-search="([^"]+)"/)?.[1];
    if (!symbol) continue;
    const name = row.match(/data-title="([^"]+)"/)?.[1] ?? symbol;

    const nums = [...row.matchAll(/data-order="(-?\d+(?:\.\d+)?)"/g)].map((m) => Number(m[1]));
    if (nums.length < 8) continue; // suspended / malformed row

    const price = nums[4];
    const volume = nums[7];
    const magnitude = nums[6];
    const changePct = /change__text--neg/.test(row) ? -Math.abs(magnitude) : Math.abs(magnitude);

    if (!Number.isFinite(price) || !Number.isFinite(changePct) || volume <= 0) continue;
    movers.push({ symbol, name, price, changePct, volume });
  }

  const gainers = movers
    .filter((m) => m.changePct > 0)
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, limit);
  const losers = movers
    .filter((m) => m.changePct < 0)
    .sort((a, b) => a.changePct - b.changePct)
    .slice(0, limit);

  return { gainers, losers };
}

/**
 * Fetch the full PSX market snapshot (index + movers). Returns `null` if the
 * index can't be read at all; mover lists may be empty if the table is blocked.
 */
export async function getMarket(): Promise<MarketSnapshot | null> {
  try {
    const [int, eod, marketWatch] = await Promise.all([
      fetchJson(`${BASE}/timeseries/int/${SYMBOL}`).catch(() => ({}) as Series),
      fetchJson(`${BASE}/timeseries/eod/${SYMBOL}`).catch(() => ({}) as Series),
      fetchText(`${BASE}/market-watch`).catch(() => ""),
    ]);

    const index = parseIndex(int, eod);
    if (!index) {
      console.warn("[psx] index unavailable — skipping market snapshot");
      return null;
    }

    const latest = int.data?.[0] ?? eod.data?.[0];
    const asOfMs = latest ? latest[0] * 1000 : Date.now();
    const status: MarketSnapshot["status"] =
      Date.now() - asOfMs < 20 * 60_000 ? "open" : "closed";

    const { gainers, losers } = parseMovers(marketWatch);
    return { asOf: new Date(asOfMs).toISOString(), status, index, gainers, losers };
  } catch (err) {
    console.warn("[psx] market fetch failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

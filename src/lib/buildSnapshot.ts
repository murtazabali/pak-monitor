// Build-time snapshot reader.
//
// The site is a fully static export whose live data is fetched client-side from
// a cron-refreshed snapshot. That means the *shipped HTML* used to contain no
// article content at all — just an app shell and "Connecting to the live feed…"
// — so crawlers, AdSense's reviewer and no-JS visitors saw an empty page.
//
// This module reads the latest snapshot at BUILD time so the server-rendered
// pages bake real headlines into their HTML. The client still hydrates and
// switches to the live feed, so realtime is preserved; the baked content is just
// the at-build baseline (kept fresh by rebuilding the site — see snapshot.yml).
//
// Server-only: imported solely by server components (page.tsx / city/page.tsx),
// so the `node:fs` + `fetch` here never reach the client bundle.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { Article, Stats } from "./types";

export interface BuildSnapshot {
  articles: Article[];
  stats: Stats | null;
  /**
   * Epoch ms of the snapshot (falls back to build time). Used as a deterministic
   * "now" so the server render and the first client render agree on the relative
   * "x min ago" timestamps — otherwise build-time vs load-time would mismatch.
   */
  now: number;
}

// Where to read fresh data at build. The raw `data`-branch CDN is the same
// source the browser polls; NEXT_PUBLIC_SNAPSHOT_URL overrides it (forks / CI).
const CDN_URL =
  process.env.NEXT_PUBLIC_SNAPSHOT_URL ||
  "https://raw.githubusercontent.com/murtazabali/pak-monitor/data/snapshot.json";

// Committed seed, always present in the repo — the offline/network-failure
// fallback so a build never ships an empty page.
const LOCAL_PATH = path.join(process.cwd(), "public", "data", "snapshot.json");

const EMPTY: BuildSnapshot = { articles: [], stats: null, now: Date.now() };

interface RawSnapshot {
  generatedAt?: string;
  articles?: Article[];
  stats?: Stats;
}

function shape(raw: RawSnapshot): BuildSnapshot {
  const generated = raw.generatedAt ? Date.parse(raw.generatedAt) : NaN;
  return {
    articles: Array.isArray(raw.articles) ? raw.articles : [],
    stats: raw.stats ?? null,
    now: Number.isFinite(generated) ? generated : Date.now(),
  };
}

async function fromCdn(): Promise<BuildSnapshot | null> {
  // Bounded so a hung CDN can't stall the build; on any failure we fall back.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    // Default (force-cache) fetch: pulls fresh data at build time and freezes it
    // into the static HTML — compatible with `output: export` (no `no-store`).
    const res = await fetch(CDN_URL, { signal: ctrl.signal });
    if (!res.ok) return null;
    return shape((await res.json()) as RawSnapshot);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fromFile(): Promise<BuildSnapshot | null> {
  try {
    return shape(JSON.parse(await fs.readFile(LOCAL_PATH, "utf8")) as RawSnapshot);
  } catch {
    return null;
  }
}

let cached: Promise<BuildSnapshot> | null = null;

/**
 * The latest snapshot for build-time rendering. Memoised so a single build
 * fetches once and serves every page (home + all city pages). Prefers the live
 * CDN in production for freshness, falling back to the committed seed.
 */
export function loadBuildSnapshot(): Promise<BuildSnapshot> {
  if (!cached) {
    cached = (async () => {
      const live = process.env.NODE_ENV === "production" ? await fromCdn() : null;
      return live ?? (await fromFile()) ?? EMPTY;
    })();
  }
  return cached;
}

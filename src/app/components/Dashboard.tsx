"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CITIES, CITY_BY_SLUG } from "@/config/cities";
import type { Article, MarketSnapshot, Stats } from "@/lib/types";
import { clusterArticles, type Cluster } from "@/lib/cluster";
import { articlesToCsv, download } from "@/lib/csv";
import { isLocalArticle } from "@/lib/relevance";
import { computeStats } from "@/lib/stats";
import PakistanMap from "./PakistanMap";
import CityChips from "./CityChips";
import CategoryFilter from "./CategoryFilter";
import FeedList from "./FeedList";
import LiveToggle, { type ConnStatus } from "./LiveToggle";
import DateRangeFilter, { DEFAULT_RANGE, type DateRange } from "./DateRangeFilter";
import SourceFilter from "./SourceFilter";
import Watchlist from "./Watchlist";
import ProvinceFilter from "./ProvinceFilter";
import TrendingStrip from "./TrendingStrip";
import MarketPanel from "./MarketPanel";
import StatsPanel from "./StatsPanel";
import NotificationToggle from "./NotificationToggle";
import SpikeBanner from "./SpikeBanner";
import SavedViews, { type SavedView } from "./SavedViews";
import SiteFooter from "./SiteFooter";
import AdUnit from "./AdUnit";
import { ADSENSE_SLOTS, SNAPSHOT_URL } from "@/config/site";
import { useLocalStorage } from "./hooks";
import { notify, playPing } from "./alerts";

const MAX_RENDERED = 300;
const CITIES_KEY = "pak-monitor:cities";
const SOURCES_KEY = "pak-monitor:sources";
const DAY = 86_400_000;
const POLL_REFRESH_MS = 30_000;
// SSE on always-on hosts; "poll" (set via NEXT_PUBLIC_REALTIME) for serverless.
const REALTIME: "sse" | "poll" = process.env.NEXT_PUBLIC_REALTIME === "poll" ? "poll" : "sse";
// Static-export build sources all data from a cron-generated snapshot (no
// read-API). Default is "static"; set NEXT_PUBLIC_DATA_SOURCE=api only when
// running against a live backend (serverless/always-on modes).
const DATA_SOURCE: "api" | "static" = process.env.NEXT_PUBLIC_DATA_SOURCE === "api" ? "api" : "static";
const EFFECTIVE_REALTIME: "sse" | "poll" = DATA_SOURCE === "static" ? "poll" : REALTIME;

function msToIso(ms: number | null): string {
  return ms == null ? "" : new Date(ms).toISOString();
}

function windowFor(dr: DateRange, now: number): { fromMs: number | null; toMs: number | null } {
  if (dr.preset === "custom" || dr.preset === "all") return { fromMs: dr.fromMs, toMs: dr.toMs };
  return { fromMs: now - (dr.durationMs ?? 0), toMs: null };
}

function presetToRange(preset: string): DateRange {
  switch (preset) {
    case "6h":
      return { preset: "6h", durationMs: DAY / 4, fromMs: null, toMs: null };
    case "24h":
      return { preset: "24h", durationMs: DAY, fromMs: null, toMs: null };
    case "3d":
      return { preset: "3d", durationMs: 3 * DAY, fromMs: null, toMs: null };
    default:
      return DEFAULT_RANGE;
  }
}

function singleton(a: Article): Cluster {
  return { id: a.id, lead: a, articles: [a], sources: [a.source] };
}

export default function Dashboard() {
  // URL-synced filters
  // Default to All Pakistan (empty = no city filter); users can narrow to cities.
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_RANGE);
  const [hydrated, setHydrated] = useState(false);

  // Persisted preferences
  const [watchlist, setWatchlist] = useLocalStorage<string[]>("pak-monitor:watch", []);
  const [readIds, setReadIds] = useLocalStorage<string[]>("pak-monitor:read", []);
  const [hideRead, setHideRead] = useLocalStorage<boolean>("pak-monitor:hideRead", false);
  const [clusterOn, setClusterOn] = useLocalStorage<boolean>("pak-monitor:cluster", true);
  const [notifyOn, setNotifyOn] = useLocalStorage<boolean>("pak-monitor:notify", false);
  const [localOnly, setLocalOnly] = useLocalStorage<boolean>("pak-monitor:localOnly", true);
  const [savedViews, setSavedViews] = useLocalStorage<SavedView[]>("pak-monitor:views", []);

  // Live data
  const [articles, setArticles] = useState<Article[]>([]);
  const [buffer, setBuffer] = useState<Article[]>([]);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<ConnStatus>("connecting");
  const [pulsing, setPulsing] = useState<Set<string>>(() => new Set());
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [statsOpen, setStatsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mapOpen, setMapOpen] = useLocalStorage<boolean>("pak-monitor:map", true);
  const [spikes, setSpikes] = useState<Stats["spikes"]>([]);
  const [snapshotStats, setSnapshotStats] = useState<Stats | null>(null);
  const [snapshotMarket, setSnapshotMarket] = useState<MarketSnapshot | null>(null);
  const [cursor, setCursor] = useState(0);

  const cursorRef = useRef(0);
  cursorRef.current = cursor;
  const clustersRef = useRef<Cluster[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const seenRef = useRef<Set<string>>(new Set());
  const notifyRef = useRef(notifyOn);
  notifyRef.current = notifyOn;
  const watchRef = useRef(watchlist);
  watchRef.current = watchlist;

  const readSet = useMemo(() => new Set(readIds), [readIds]);

  // Hydrate from URL (shareable) → localStorage → defaults.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const ls = (k: string): unknown => {
      try {
        return JSON.parse(localStorage.getItem(k) ?? "null");
      } catch {
        return null;
      }
    };
    const list = (k: string): string[] | null => {
      const v = sp.get(k);
      return v ? v.split(",").filter(Boolean) : null;
    };
    setSelectedCities(list("c") ?? (ls(CITIES_KEY) as string[] | null) ?? []);
    setSelectedSources(list("src") ?? (ls(SOURCES_KEY) as string[] | null) ?? []);
    setSelectedCategories(list("cat") ?? []);
    setQuery(sp.get("q") ?? "");
    if (sp.get("d")) setDateRange(presetToRange(sp.get("d")!));
    setHydrated(true);
  }, []);

  // The current filters encoded as a query string (shared by URL sync + saved views).
  const currentQuery = useMemo(() => {
    const sp = new URLSearchParams();
    if (selectedCities.length) sp.set("c", selectedCities.join(","));
    if (selectedCategories.length) sp.set("cat", selectedCategories.join(","));
    if (selectedSources.length) sp.set("src", selectedSources.join(","));
    if (query.trim()) sp.set("q", query.trim());
    if (["6h", "24h", "3d"].includes(dateRange.preset)) sp.set("d", dateRange.preset);
    return sp.toString();
  }, [selectedCities, selectedCategories, selectedSources, query, dateRange]);

  const rssHref = useMemo(() => {
    const sp = new URLSearchParams();
    if (selectedCities.length) sp.set("cities", selectedCities.join(","));
    if (selectedCategories.length) sp.set("categories", selectedCategories.join(","));
    if (query.trim()) sp.set("q", query.trim());
    const qs = sp.toString();
    return `/api/rss${qs ? `?${qs}` : ""}`;
  }, [selectedCities, selectedCategories, query]);

  const applyQuery = useCallback((qs: string) => {
    const sp = new URLSearchParams(qs);
    const list = (k: string): string[] => (sp.get(k) ? sp.get(k)!.split(",").filter(Boolean) : []);
    setSelectedCities(list("c"));
    setSelectedCategories(list("cat"));
    setSelectedSources(list("src"));
    setQuery(sp.get("q") ?? "");
    setDateRange(sp.get("d") ? presetToRange(sp.get("d")!) : DEFAULT_RANGE);
  }, []);

  // Reflect filters into localStorage + the URL (for sharing).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CITIES_KEY, JSON.stringify(selectedCities));
      localStorage.setItem(SOURCES_KEY, JSON.stringify(selectedSources));
    } catch {
      /* ignore */
    }
    window.history.replaceState(null, "", currentQuery ? `?${currentQuery}` : window.location.pathname);
  }, [hydrated, selectedCities, selectedSources, currentQuery]);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Activity spikes: poll /api/stats in API mode; read them from the snapshot
  // stats in static mode.
  useEffect(() => {
    if (DATA_SOURCE !== "api") return;
    let cancel = false;
    const load = () =>
      fetch("/api/stats")
        .then((r) => r.json())
        .then((d: Stats) => !cancel && setSpikes(d.spikes ?? []))
        .catch(() => {});
    load();
    const t = setInterval(load, 120_000);
    return () => {
      cancel = true;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (DATA_SOURCE === "static") setSpikes(snapshotStats?.spikes ?? []);
  }, [snapshotStats]);

  const triggerPulse = useCallback((slugs: string[]) => {
    if (slugs.length === 0) return;
    setPulsing((prev) => {
      const next = new Set(prev);
      slugs.forEach((s) => next.add(s));
      return next;
    });
    slugs.forEach((s) =>
      setTimeout(() => {
        setPulsing((prev) => {
          if (!prev.has(s)) return prev;
          const next = new Set(prev);
          next.delete(s);
          return next;
        });
      }, 2400),
    );
  }, []);

  // Backlog + live updates, keyed on city scope + date window. Realtime delivery
  // is SSE on always-on hosts; on serverless (NEXT_PUBLIC_REALTIME=poll) it falls
  // back to periodic re-fetching.
  useEffect(() => {
    if (!hydrated) return;
    const win = windowFor(dateRange, Date.now());
    const fromISO = msToIso(win.fromMs);
    const toISO = msToIso(win.toMs);

    const qs = new URLSearchParams();
    if (selectedCities.length) qs.set("cities", selectedCities.join(","));
    if (fromISO) qs.set("from", fromISO);
    if (toISO) qs.set("to", toISO);

    let cancelled = false;
    setStatus("connecting");
    setLoading(true); // network re-fetch (city / date change) — cleared when the backlog loads
    seenRef.current = new Set();
    setBuffer([]);
    setPaused(false);
    setCursor(0);

    const handleIncoming = (a: Article) => {
      if (seenRef.current.has(a.id)) return;
      seenRef.current.add(a.id);

      triggerPulse(a.cities.filter((c) => selectedCities.length === 0 || selectedCities.includes(c)));

      if (notifyRef.current) {
        const text = `${a.title} ${a.summary}`.toLowerCase();
        const watched = watchRef.current.some((w) => w.length >= 2 && text.includes(w.toLowerCase()));
        const priority = a.categories.includes("crime") || a.categories.includes("accident");
        if (watched || priority) {
          const where = a.cities.map((c) => CITY_BY_SLUG[c]?.name ?? c).join(", ");
          notify(`${a.source}${where ? ` · ${where}` : ""}`, a.title, a.id);
          playPing();
        }
      }

      if (pausedRef.current) setBuffer((prev) => [a, ...prev].slice(0, MAX_RENDERED));
      else setArticles((prev) => [a, ...prev].slice(0, MAX_RENDERED));
    };

    const backlogParams = new URLSearchParams(qs);
    backlogParams.set("limit", fromISO || toISO ? "500" : "200");
    // In static mode read the full snapshot (filtering happens client-side).
    const backlogUrl = DATA_SOURCE === "static" ? SNAPSHOT_URL : `/api/articles?${backlogParams.toString()}`;

    const loadBacklog = (initial: boolean) =>
      fetch(backlogUrl)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          const list: Article[] = data.articles ?? [];
          if (DATA_SOURCE === "static" && data.stats) setSnapshotStats(data.stats as Stats);
          if (DATA_SOURCE === "static") setSnapshotMarket((data.market ?? null) as MarketSnapshot | null);
          if (initial) {
            seenRef.current = new Set(list.map((a) => a.id));
            setArticles(list);
            setLoading(false);
            if (EFFECTIVE_REALTIME === "poll") setStatus("live");
          } else {
            // newest-first list; replay only the unseen ones oldest→newest
            const fresh = list.filter((a) => !seenRef.current.has(a.id)).reverse();
            for (const a of fresh) handleIncoming(a);
          }
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });

    loadBacklog(true);

    if (EFFECTIVE_REALTIME === "sse") {
      let lastReady = 0;
      let unstableDrops = 0;
      let pollTimer: ReturnType<typeof setInterval> | null = null;
      const startPolling = () => {
        if (!pollTimer) pollTimer = setInterval(() => loadBacklog(false), POLL_REFRESH_MS);
      };

      const es = new EventSource(`/api/stream?${qs.toString()}`);
      es.addEventListener("ready", () => {
        if (cancelled) return;
        lastReady = Date.now();
        setStatus("live");
      });
      es.addEventListener("article", (ev) => {
        if (cancelled) return;
        try {
          handleIncoming(JSON.parse((ev as MessageEvent).data) as Article);
        } catch {
          /* ignore malformed event */
        }
      });
      es.onerror = () => {
        if (cancelled) return;
        // If the connection keeps dropping shortly after connecting (e.g. on
        // serverless, where a function can't hold a stream), give up on SSE and
        // fall back to polling instead of flickering Live/Offline.
        if (lastReady && Date.now() - lastReady < 25_000) unstableDrops++;
        if (unstableDrops >= 2) {
          es.close();
          setStatus("live");
          startPolling();
          return;
        }
        setStatus(es.readyState === EventSource.CLOSED ? "closed" : "connecting");
      };
      return () => {
        cancelled = true;
        es.close();
        if (pollTimer) clearInterval(pollTimer);
      };
    }

    const timer = setInterval(() => loadBacklog(false), POLL_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selectedCities, dateRange, hydrated, triggerPulse]);

  // Instant client-side filters (category / source / search / toggles) don't
  // re-fetch, so flash a brief loader to acknowledge the action.
  const filtersHydrated = useRef(false);
  useEffect(() => {
    if (!filtersHydrated.current) {
      filtersHydrated.current = true;
      return;
    }
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, [selectedCategories, selectedSources, query, clusterOn, hideRead, localOnly]);

  const flush = useCallback(() => {
    setArticles((prev) => [...buffer, ...prev].slice(0, MAX_RENDERED));
    setBuffer([]);
    setPaused(false);
  }, [buffer]);

  const togglePause = useCallback(() => {
    if (pausedRef.current) flush();
    else setPaused(true);
  }, [flush]);

  const toggleCity = useCallback((slug: string) => {
    setSelectedCities((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }, []);
  const toggleCategory = useCallback((slug: string) => {
    setSelectedCategories((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }, []);
  const toggleSource = useCallback((s: string) => {
    setSelectedSources((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }, []);
  const markRead = useCallback(
    (id: string) => setReadIds((prev) => (prev.includes(id) ? prev : [id, ...prev].slice(0, 3000))),
    [setReadIds],
  );
  const isRead = useCallback((id: string) => readSet.has(id), [readSet]);

  const availableSources = useMemo(() => {
    return Array.from(new Set(articles.map((a) => a.source))).sort((a, b) => a.localeCompare(b));
  }, [articles]);

  // The Stocks chip is a "markets" view: include broader market/economy
  // (business) stories so the feed isn't empty during a stock-news lull (e.g.
  // weekends, when the PSX is closed).
  const stocksView = selectedCategories.includes("stocks");

  const displayed = useMemo(() => {
    const cats = new Set(selectedCategories);
    if (cats.has("stocks")) cats.add("business");
    const srcs = new Set(selectedSources);
    // Stocks/markets is a national (PSX) view — ignore the city scope so
    // nationwide market news (which often carries no city tag) isn't dropped.
    const citySet = selectedCities.length && !stocksView ? new Set(selectedCities) : null;
    const needle = query.trim().toLowerCase();
    const { fromMs, toMs } = windowFor(dateRange, nowTick);
    const filtered = articles.filter((a) => {
      // City filtering is server-side in API mode (no-op here) but needed for
      // the full-dataset snapshot in static mode.
      if (citySet && !a.cities.some((c) => citySet.has(c))) return false;
      if (localOnly && !isLocalArticle(a)) return false;
      if (cats.size && !a.categories.some((c) => cats.has(c))) return false;
      if (srcs.size && !srcs.has(a.source)) return false;
      if (hideRead && readSet.has(a.id)) return false;
      if (needle && !`${a.title} ${a.summary}`.toLowerCase().includes(needle)) return false;
      if (fromMs !== null || toMs !== null) {
        const t = Date.parse(a.publishedAt);
        if (fromMs !== null && t < fromMs) return false;
        if (toMs !== null && t > toMs) return false;
      }
      return true;
    });
    // Always render newest-first — live prepends, the pause buffer flush, and
    // poll merges can otherwise disturb the order.
    filtered.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
    return filtered;
  }, [articles, selectedCities, selectedCategories, selectedSources, query, dateRange, nowTick, hideRead, readSet, localOnly]);

  const clusters = useMemo(
    () => (clusterOn ? clusterArticles(displayed) : displayed.map(singleton)),
    [displayed, clusterOn],
  );
  clustersRef.current = clusters;
  const focusedId = clusters[cursor]?.id;

  // Keyboard navigation: j/k move, o/Enter open, "/" focuses search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (typing) return;
      const list = clustersRef.current;
      if (e.key === "j") {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, Math.max(0, list.length - 1)));
      } else if (e.key === "k") {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      } else if (e.key === "o" || e.key === "Enter") {
        const c = list[cursorRef.current];
        if (c) {
          window.open(c.lead.link, "_blank", "noopener,noreferrer");
          markRead(c.lead.id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [markRead]);

  const unread = useMemo(() => displayed.filter((a) => !readSet.has(a.id)).length, [displayed, readSet]);

  const scopeLabel =
    selectedCities.length === 0
      ? "All Pakistan"
      : selectedCities.map((s) => CITY_BY_SLUG[s]?.name ?? s).join(", ");

  const periodLabel =
    dateRange.preset === "6h"
      ? "Last 6h"
      : dateRange.preset === "24h"
        ? "Last 24h"
        : dateRange.preset === "3d"
          ? "Last 3 days"
          : dateRange.preset === "custom"
            ? "Custom range"
            : "All time";
  const statsWindow = windowFor(dateRange, nowTick);

  // City chip / map counts, derived from the loaded articles under the same
  // ambient filters as the feed (PK-only + date) so a chip's number matches the
  // feed when that city is selected. The snapshot's own `counts` covered the full
  // server-side store — including older articles not shipped in the 600-item
  // snapshot — which made the chips over-count.
  const cityChipCounts = useMemo(() => {
    const { fromMs, toMs } = windowFor(dateRange, nowTick);
    const out: Record<string, number> = {};
    for (const a of articles) {
      if (localOnly && !isLocalArticle(a)) continue;
      const t = Date.parse(a.publishedAt);
      if (fromMs !== null && t < fromMs) continue;
      if (toMs !== null && t > toMs) continue;
      for (const c of a.cities) out[c] = (out[c] ?? 0) + 1;
    }
    return out;
  }, [articles, localOnly, dateRange, nowTick]);

  // Static mode has no /api/stats: compute the drawer's stats client-side from
  // the in-memory snapshot, scoped to the selected cities + period, so the
  // numbers match the visible feed instead of the global snapshot totals. Only
  // computed while the drawer is open.
  const scopedStats = useMemo<Stats | null>(() => {
    if (DATA_SOURCE !== "static" || !statsOpen) return null;
    return computeStats(
      articles,
      selectedCities,
      msToIso(statsWindow.fromMs),
      msToIso(statsWindow.toMs),
    );
  }, [statsOpen, articles, selectedCities, statsWindow.fromMs, statsWindow.toMs]);

  const activeFilterCount =
    selectedCategories.length +
    selectedSources.length +
    watchlist.length +
    (dateRange.preset !== "all" ? 1 : 0) +
    (query.trim() ? 1 : 0);

  // Province / Saved views / Digest / RSS — rendered in the city row on desktop
  // and inside the collapsible filters on mobile.
  const renderViewTools = () => (
    <>
      <ProvinceFilter onSelect={(slugs) => setSelectedCities(slugs)} />
      <SavedViews
        views={savedViews}
        currentQuery={currentQuery}
        onSave={(name, q) => setSavedViews((prev) => [...prev.filter((v) => v.name !== name), { name, query: q }])}
        onApply={applyQuery}
        onDelete={(name) => setSavedViews((prev) => prev.filter((v) => v.name !== name))}
      />
      <a
        href={`/digest?cities=${selectedCities.join(",")}`}
        title="Daily digest"
        className="rounded-md border border-base-600 bg-base-800/50 px-2 py-1 text-xs text-slate-300 hover:bg-base-700/70"
      >
        Digest
      </a>
      <a
        href="/stocks"
        title="KSE-100 & stock market"
        className="rounded-md border border-base-600 bg-base-800/50 px-2 py-1 text-xs text-slate-300 hover:bg-base-700/70"
      >
        📈 Stocks
      </a>
      {DATA_SOURCE === "api" && (
        <a
          href={rssHref}
          target="_blank"
          rel="noopener noreferrer"
          title="Subscribe to this view as RSS"
          className="rounded-md border border-base-600 bg-base-800/50 px-2 py-1 text-xs text-signal-warn hover:bg-base-700/70"
        >
          ⤵ RSS
        </a>
      )}
    </>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-edge/70 bg-base-900/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/70" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
          </span>
          <div className="leading-none">
            <h1 className="font-mono text-base font-bold tracking-tight text-slate-100">
              PAK<span className="text-accent">·</span>MONITOR
            </h1>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">Realtime city news</p>
          </div>
        </div>

        <div className="ml-2 hidden flex-1 sm:block">
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search headlines…  ( / )"
            className="w-full max-w-md rounded-md border border-base-600 bg-base-850/80 px-3 py-1.5 text-sm text-slate-200 placeholder:text-muted focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden font-mono text-xs text-muted md:inline">
            {unread} new / {displayed.length}
          </span>
          <button
            onClick={() => download(`pak-monitor-${new Date().toISOString().slice(0, 10)}.csv`, articlesToCsv(displayed), "text/csv")}
            title="Export the current view to CSV"
            className="hidden rounded-md border border-base-600 bg-base-800/70 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-base-700/70 sm:inline-flex"
          >
            ⤓ CSV
          </button>
          <button
            onClick={() => setStatsOpen(true)}
            title="Statistics & feed health"
            className="rounded-md border border-base-600 bg-base-800/70 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-base-700/70"
          >
            📊 Stats
          </button>
          <NotificationToggle enabled={notifyOn} onChange={setNotifyOn} />
          <LiveToggle status={status} paused={paused} onToggle={togglePause} />
        </div>
      </header>

      {/* City filter strip */}
      <div className="flex items-stretch border-b border-edge/70 bg-base-900/70">
        <div className="min-w-0 flex-1">
          <CityChips
            cities={CITIES}
            selected={selectedCities}
            counts={cityChipCounts}
            onToggle={toggleCity}
            onSelectAll={() => setSelectedCities([])}
          />
        </div>
        <div className="hidden shrink-0 items-center gap-2 border-l border-edge/70 px-3 sm:flex">
          {renderViewTools()}
        </div>
      </div>

      <SpikeBanner spikes={spikes} onCity={(slug) => setSelectedCities([slug])} />
      <TrendingStrip clusters={clusters} onOpen={markRead} />

      {/* Main */}
      <main
        className={[
          "grid min-h-0 flex-1",
          mapOpen
            ? "grid-rows-[minmax(180px,36%)_1fr] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-1"
            : "grid-rows-1 lg:grid-cols-1",
        ].join(" ")}
      >
        {/* Map panel */}
        <section className={`grid-bg relative min-h-0 border-b border-edge/70 lg:border-b-0 lg:border-r ${mapOpen ? "" : "hidden"}`}>
          <div className="absolute left-4 top-3 z-10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Live map</p>
            <p className="max-w-[16rem] truncate text-sm font-medium text-slate-200">{scopeLabel}</p>
          </div>
          <button
            onClick={() => setMapOpen(false)}
            title="Hide map"
            className="absolute right-3 top-3 z-10 rounded-md border border-base-600 bg-base-900/70 px-2 py-1 text-xs text-muted hover:text-accent"
          >
            ⊟ Hide
          </button>
          <div className="h-full w-full p-2">
            <PakistanMap
              cities={CITIES}
              selected={selectedCities}
              counts={cityChipCounts}
              pulsing={pulsing}
              onToggle={toggleCity}
            />
          </div>
          <p className="absolute bottom-2 left-4 font-mono text-[10px] text-muted/70">
            Click a city node to filter · <span className="text-accent/80">◉</span> selected
          </p>
        </section>

        {/* Feed panel */}
        <section className="flex min-h-0 flex-col bg-base-900/40">
          {!mapOpen && (
            <button
              onClick={() => setMapOpen(true)}
              className="flex w-full items-center gap-1.5 border-b border-edge/60 px-4 py-1.5 text-xs text-muted hover:text-accent"
            >
              🗺 Show map
            </button>
          )}
          <div className="border-b border-edge/60">
            {/* Mobile-only toggle to reclaim feed space */}
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex w-full items-center justify-between px-4 py-2 sm:hidden"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
              </span>
              <span className="text-xs text-accent">{filtersOpen ? "▴ Hide" : "▾ Show"}</span>
            </button>

            <div className={`${filtersOpen ? "flex" : "hidden"} flex-col gap-2 px-4 pb-2.5 sm:flex sm:pt-2.5`}>
              {/* Search is in the header on desktop; surface it here on mobile. */}
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                aria-label="Search headlines"
                className="rounded-md border border-base-600 bg-base-850/80 px-3 py-1.5 text-sm text-slate-200 placeholder:text-muted focus:border-accent/60 focus:outline-none sm:hidden"
              />
              <DateRangeFilter value={dateRange} onChange={setDateRange} />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <CategoryFilter selected={selectedCategories} onToggle={toggleCategory} />
                <SourceFilter
                  available={availableSources}
                  selected={selectedSources}
                  onToggle={toggleSource}
                  onClear={() => setSelectedSources([])}
                />
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-slate-400">
                  <input type="checkbox" checked={clusterOn} onChange={(e) => setClusterOn(e.target.checked)} className="accent-accent" />
                  Group similar
                </label>
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-slate-400">
                  <input type="checkbox" checked={hideRead} onChange={(e) => setHideRead(e.target.checked)} className="accent-accent" />
                  Hide read
                </label>
                <label
                  className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-slate-400"
                  title="Only Pakistani outlets or articles that mention Pakistan"
                >
                  <input type="checkbox" checked={localOnly} onChange={(e) => setLocalOnly(e.target.checked)} className="accent-accent" />
                  PK only
                </label>
              </div>
              <Watchlist
                terms={watchlist}
                onAdd={(t) => setWatchlist((prev) => (prev.includes(t) ? prev : [...prev, t]))}
                onRemove={(t) => setWatchlist((prev) => prev.filter((x) => x !== t))}
              />
              <div className="flex flex-wrap items-center gap-2 sm:hidden">{renderViewTools()}</div>
            </div>
          </div>

          {paused && buffer.length > 0 && (
            <button
              onClick={flush}
              className="mx-4 mt-2 animate-fade-in rounded-md border border-accent/40 bg-accent/15 px-3 py-1.5 text-center text-xs font-medium text-accent transition-colors hover:bg-accent/25"
            >
              ↑ {buffer.length} new article{buffer.length > 1 ? "s" : ""} — click to show
            </button>
          )}

          <div className="scroll-thin relative min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {loading && (
              <div className="pointer-events-none sticky top-0 z-10 -mt-1 mb-1 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-edge bg-base-850/95 px-3 py-1 text-xs text-accent shadow-lg backdrop-blur">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                  Updating feed…
                </span>
              </div>
            )}
            {stocksView && (
              <div className="mb-4 animate-fade-in">
                <MarketPanel market={snapshotMarket} />
                <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                  📰 Stocks &amp; market news
                </p>
              </div>
            )}
            <FeedList
              clusters={clusters}
              isRead={isRead}
              watch={watchlist}
              onOpen={markRead}
              focusedId={focusedId}
              emptyHint={
                status === "connecting"
                  ? "Connecting to the live feed…"
                  : query || selectedCategories.length || selectedSources.length || dateRange.preset !== "all"
                    ? "No articles match your filters yet."
                    : `Watching ${scopeLabel} — new stories will appear here.`
              }
            />
          </div>
        </section>
      </main>

      <AdUnit slot={ADSENSE_SLOTS.feed} className="mx-auto w-full max-w-3xl px-2" />
      <SiteFooter />

      <StatsPanel
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        citiesParam={selectedCities.join(",")}
        from={msToIso(statsWindow.fromMs)}
        to={msToIso(statsWindow.toMs)}
        scope={`${scopeLabel} · ${periodLabel}`}
        stats={DATA_SOURCE === "static" ? scopedStats : undefined}
        onEntityClick={(name) => setQuery(name)}
      />
    </div>
  );
}

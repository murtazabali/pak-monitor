"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CITIES, DEFAULT_CITY, CITY_BY_SLUG } from "@/config/cities";
import type { Article, Stats } from "@/lib/types";
import { clusterArticles, type Cluster } from "@/lib/cluster";
import { articlesToCsv, download } from "@/lib/csv";
import { isLocalArticle } from "@/lib/relevance";
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
import StatsPanel from "./StatsPanel";
import NotificationToggle from "./NotificationToggle";
import SpikeBanner from "./SpikeBanner";
import SavedViews, { type SavedView } from "./SavedViews";
import { useLocalStorage } from "./hooks";
import { notify, playPing } from "./alerts";

const MAX_RENDERED = 300;
const CITIES_KEY = "pak-monitor:cities";
const SOURCES_KEY = "pak-monitor:sources";
const DAY = 86_400_000;

function msToIso(ms: number | null): string {
  return ms == null ? "" : new Date(ms).toISOString();
}

function windowFor(dr: DateRange, now: number): { fromMs: number | null; toMs: number | null } {
  if (dr.preset === "custom" || dr.preset === "all") return { fromMs: dr.fromMs, toMs: dr.toMs };
  return { fromMs: now - (dr.durationMs ?? 0), toMs: null };
}

function presetToRange(preset: string): DateRange {
  switch (preset) {
    case "24h":
      return { preset: "24h", durationMs: DAY, fromMs: null, toMs: null };
    case "7d":
      return { preset: "7d", durationMs: 7 * DAY, fromMs: null, toMs: null };
    case "30d":
      return { preset: "30d", durationMs: 30 * DAY, fromMs: null, toMs: null };
    default:
      return DEFAULT_RANGE;
  }
}

function singleton(a: Article): Cluster {
  return { id: a.id, lead: a, articles: [a], sources: [a.source] };
}

export default function Dashboard() {
  // URL-synced filters
  const [selectedCities, setSelectedCities] = useState<string[]>([DEFAULT_CITY]);
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
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pulsing, setPulsing] = useState<Set<string>>(() => new Set());
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [statsOpen, setStatsOpen] = useState(false);
  const [spikes, setSpikes] = useState<Stats["spikes"]>([]);
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
    setSelectedCities(list("c") ?? (ls(CITIES_KEY) as string[] | null) ?? [DEFAULT_CITY]);
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
    if (["24h", "7d", "30d"].includes(dateRange.preset)) sp.set("d", dateRange.preset);
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

  // Poll global activity spikes (independent of the current city scope).
  useEffect(() => {
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

  // Backlog + live stream, keyed on city scope + date window.
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
    seenRef.current = new Set();
    setBuffer([]);
    setPaused(false);
    setCursor(0);

    const backlogParams = new URLSearchParams(qs);
    backlogParams.set("limit", fromISO || toISO ? "500" : "200");

    fetch(`/api/articles?${backlogParams.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list: Article[] = data.articles ?? [];
        seenRef.current = new Set(list.map((a) => a.id));
        setArticles(list);
        setCounts(data.counts ?? {});
      })
      .catch(() => {});

    const es = new EventSource(`/api/stream?${qs.toString()}`);
    es.addEventListener("ready", () => {
      if (!cancelled) setStatus("live");
    });
    es.addEventListener("article", (ev) => {
      if (cancelled) return;
      let a: Article;
      try {
        a = JSON.parse((ev as MessageEvent).data) as Article;
      } catch {
        return;
      }
      if (seenRef.current.has(a.id)) return;
      seenRef.current.add(a.id);

      setCounts((prev) => {
        const next = { ...prev };
        for (const c of a.cities) next[c] = (next[c] ?? 0) + 1;
        return next;
      });
      triggerPulse(a.cities.filter((c) => selectedCities.length === 0 || selectedCities.includes(c)));

      // Breaking-news alerts: watchlist hit OR a priority category.
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
    });
    es.onerror = () => {
      if (!cancelled) setStatus("closed");
    };

    return () => {
      cancelled = true;
      es.close();
    };
  }, [selectedCities, dateRange, hydrated, triggerPulse]);

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

  const displayed = useMemo(() => {
    const cats = new Set(selectedCategories);
    const srcs = new Set(selectedSources);
    const needle = query.trim().toLowerCase();
    const { fromMs, toMs } = windowFor(dateRange, nowTick);
    return articles.filter((a) => {
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
  }, [articles, selectedCategories, selectedSources, query, dateRange, nowTick, hideRead, readSet, localOnly]);

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
            counts={counts}
            onToggle={toggleCity}
            onSelectAll={() => setSelectedCities([])}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 border-l border-edge/70 px-3">
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
            className="hidden rounded-md border border-base-600 bg-base-800/50 px-2 py-1 text-xs text-slate-300 hover:bg-base-700/70 md:inline-flex"
          >
            Digest
          </a>
          <a
            href={rssHref}
            target="_blank"
            rel="noopener noreferrer"
            title="Subscribe to this view as RSS"
            className="rounded-md border border-base-600 bg-base-800/50 px-2 py-1 text-xs text-signal-warn hover:bg-base-700/70"
          >
            ⤵ RSS
          </a>
        </div>
      </div>

      <SpikeBanner spikes={spikes} onCity={(slug) => setSelectedCities([slug])} />
      <TrendingStrip clusters={clusters} onOpen={markRead} />

      {/* Main */}
      <main className="grid min-h-0 flex-1 grid-rows-[minmax(200px,36%)_1fr] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-1">
        {/* Map panel */}
        <section className="grid-bg relative min-h-0 border-b border-edge/70 lg:border-b-0 lg:border-r">
          <div className="absolute left-4 top-3 z-10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Live map</p>
            <p className="max-w-[16rem] truncate text-sm font-medium text-slate-200">{scopeLabel}</p>
          </div>
          <div className="h-full w-full p-2">
            <PakistanMap
              cities={CITIES}
              selected={selectedCities}
              counts={counts}
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
          <div className="flex flex-col gap-2 border-b border-edge/60 px-4 py-2.5">
            <DateRangeFilter value={dateRange} now={nowTick} onChange={setDateRange} />
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
          </div>

          {paused && buffer.length > 0 && (
            <button
              onClick={flush}
              className="mx-4 mt-2 animate-fade-in rounded-md border border-accent/40 bg-accent/15 px-3 py-1.5 text-center text-xs font-medium text-accent transition-colors hover:bg-accent/25"
            >
              ↑ {buffer.length} new article{buffer.length > 1 ? "s" : ""} — click to show
            </button>
          )}

          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-3">
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

      <StatsPanel
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        citiesParam={selectedCities.join(",")}
        onEntityClick={(name) => setQuery(name)}
      />
    </div>
  );
}

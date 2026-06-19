import type { Article, Stats } from "@/lib/types";
import { tokenize } from "@/lib/text";
import { extractEntities } from "@/lib/entities";

/**
 * Pure stats computation over an article array. Shared by the server-side
 * getStats (which loads the articles from the store) and the static client (the
 * dashboard already holds the full snapshot in memory), so both produce the same
 * numbers and the Stats drawer always matches the visible feed scope.
 *
 * `total` and the breakdowns are scoped to `cities` + the [from, to] period;
 * `perHour` is the selected cities' last-24h activity (period-independent);
 * `spikes` are a global cross-city signal regardless of scope.
 */
export function computeStats(all: Article[], cities?: string[], from?: string, to?: string): Stats {
  const citySet = cities && cities.length ? new Set(cities) : null;
  const cityItems = citySet ? all.filter((a) => a.cities.some((c) => citySet.has(c))) : all;

  const fromMs = from ? Date.parse(from) : NaN;
  const toMs = to ? Date.parse(to) : NaN;
  let items = cityItems;
  if (!Number.isNaN(fromMs)) items = items.filter((a) => Date.parse(a.publishedAt) >= fromMs);
  if (!Number.isNaN(toMs)) items = items.filter((a) => Date.parse(a.publishedAt) <= toMs);

  const byCity: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const keywords: Record<string, number> = {};
  const now = Date.now();

  for (const a of items) {
    for (const c of a.cities) byCity[c] = (byCity[c] ?? 0) + 1;
    for (const c of a.categories) byCategory[c] = (byCategory[c] ?? 0) + 1;
    bySource[a.source] = (bySource[a.source] ?? 0) + 1;
    for (const t of tokenize(a.title)) keywords[t] = (keywords[t] ?? 0) + 1;
  }

  // The sparkline shows the city's last-24h hourly activity (period-independent).
  const perHour = new Array<number>(24).fill(0);
  for (const a of cityItems) {
    const ageHours = Math.floor((now - Date.parse(a.publishedAt)) / 3_600_000);
    if (ageHours >= 0 && ageHours < 24) perHour[23 - ageHours]++;
  }

  const topKeywords = Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([word, count]) => ({ word, count }));

  const topEntities = extractEntities(items.map((a) => a.title));

  // Spikes: per-city last-hour volume vs the mean of the prior 5 hours.
  // Computed over ALL articles (global signal), regardless of the city scope.
  const cityHourly: Record<string, number[]> = {};
  for (const a of all) {
    const ageH = Math.floor((now - Date.parse(a.publishedAt)) / 3_600_000);
    if (ageH < 0 || ageH >= 6) continue;
    for (const c of a.cities) (cityHourly[c] ??= new Array(6).fill(0))[ageH]++;
  }
  const spikes = Object.entries(cityHourly)
    .map(([city, hrs]) => {
      const recent = hrs[0];
      const baseline = (hrs[1] + hrs[2] + hrs[3] + hrs[4] + hrs[5]) / 5;
      return { city, recent, baseline: Math.round(baseline * 10) / 10, ratio: Math.round((recent / Math.max(baseline, 1)) * 10) / 10 };
    })
    .filter((s) => s.recent >= 4 && s.ratio >= 2.5)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 4);

  return { total: items.length, byCity, byCategory, bySource, perHour, topKeywords, topEntities, spikes };
}

import { SOURCE_BY_OUTLET } from "@/config/sources";

/**
 * Strong Pakistan-relevance signals that don't require the literal word
 * "Pakistan" — parties, institutions, leaders, provinces/regions and the big
 * sports/finance bodies. City names are deliberately excluded: those are matched
 * precisely via the article's `cities` tag (the city tagger already avoids Indian
 * false positives like "Hyderabad, India"), so listing them here would let
 * foreign coverage of same-named cities slip through.
 */
const PK_SIGNAL =
  /\b(pti|ppp|pml-?n|pmln|mqm|jui-?f|ecp|fbr|nab|nepra|ogra|sbp|state bank|pcb|psl|psx|kse|sindh|balochistan|baluchistan|khyber\s*pakhtunkhwa|kpk|gilgit|baltistan|azad\s*(kashmir|jammu)|ajk|fourth\s*schedule|imran\s*khan|shehbaz|nawaz\s*sharif|bilawal|zardari|asim\s*munir|maryam\s*nawaz|islamabad\s*high\s*court|national\s*assembly|pia|wapda|k-?electric|nadra|fia)\b/i;

// Fluff-prone topics: Pakistani outlets run a lot of foreign sport and showbiz
// under these tags, so they need a Pakistan signal to count as local. Hard-news
// topics (politics/crime/accident/weather/business/stocks/health) from a
// Pakistani outlet are virtually always local and stay trusted.
const SOFT_CATEGORIES = new Set(["sports", "general"]);

/**
 * Whether an article is Pakistan-relevant (the "PK only" filter).
 *
 * An article is local if it is tagged with a Pakistani city, or its text
 * mentions Pakistan / a strong PK signal — regardless of outlet. Otherwise only
 * Pakistani outlets count, and even then their fluff-prone topics (sports + the
 * "general" catch-all) must carry one of those signals; without a topic context
 * (legacy callers) a Pakistani outlet is trusted.
 */
export function isLocalArticle(a: {
  source: string;
  title: string;
  summary: string;
  cities?: string[];
  categories?: string[];
}): boolean {
  if (a.cities && a.cities.length > 0) return true;

  const text = `${a.title} ${a.summary}`;
  if (/\bpakistan/i.test(text) || PK_SIGNAL.test(text)) return true;

  if (!SOURCE_BY_OUTLET[a.source]?.pk) return false;

  const cats = a.categories;
  if (!cats) return true; // no topic context — trust the Pakistani outlet
  const fluffOnly = cats.length > 0 && cats.every((c) => SOFT_CATEGORIES.has(c));
  return !fluffOnly;
}

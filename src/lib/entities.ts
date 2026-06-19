import { CITIES } from "@/config/cities";

// Words that shouldn't count as entities even when capitalised.
const STOP = new Set([
  "the", "this", "that", "these", "those", "after", "before", "amid", "over", "under",
  "new", "pakistan", "pakistani", "pak", "govt", "government", "national", "breaking",
  "live", "watch", "video", "photos", "report", "update", "more", "top", "day", "week",
  "year", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "january", "february", "march", "april", "may", "june", "july", "august", "september",
  "october", "november", "december", "how", "why", "what", "who", "when", "where",
]);

const CITY_WORDS = new Set(CITIES.flatMap((c) => c.name.toLowerCase().split(/\s+/)));

// 1–4 consecutive Capitalised words (each ≥ 3 letters) — a rough proper-noun grab.
const ENTITY_RE = /([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,3})/g;

/** Frequent proper nouns across a set of headlines (entities appearing ≥ 2×). */
export function extractEntities(titles: string[]): Array<{ name: string; count: number }> {
  const counts = new Map<string, { name: string; count: number }>();

  for (const title of titles) {
    const seenInTitle = new Set<string>();
    ENTITY_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = ENTITY_RE.exec(title))) {
      const phrase = m[1].trim();
      const key = phrase.toLowerCase();
      const words = phrase.split(/\s+/);

      if (words.length === 1) {
        if (phrase.length < 4 || STOP.has(key) || CITY_WORDS.has(key)) continue;
      } else if (words.every((w) => STOP.has(w.toLowerCase()) || CITY_WORDS.has(w.toLowerCase()))) {
        continue;
      }
      if (seenInTitle.has(key)) continue;
      seenInTitle.add(key);

      const existing = counts.get(key);
      if (existing) existing.count++;
      else counts.set(key, { name: phrase, count: 1 });
    }
  }

  return [...counts.values()]
    .filter((e) => e.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

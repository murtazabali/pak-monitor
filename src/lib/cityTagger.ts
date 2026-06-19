import { CITIES, URDU_NAMES } from "@/config/cities";
import { wholeWordRegex } from "@/lib/text";

interface CityMatcher {
  slug: string;
  regexes: RegExp[];
}

// Compile every city's name (English + Urdu) + localities into whole-word
// regexes once, at module load, so tagging each article is just a series of
// cheap `.test()` calls.
const MATCHERS: CityMatcher[] = CITIES.map((c) => ({
  slug: c.slug,
  regexes: [c.name, URDU_NAMES[c.slug], ...c.localities]
    .filter((t): t is string => Boolean(t))
    .map(wholeWordRegex),
}));

/**
 * Return the slugs of every city whose name OR one of its localities appears
 * in the given text fragments (title + summary). Whole-word, case-insensitive.
 */
export function tagCities(...parts: Array<string | null | undefined>): string[] {
  const text = parts.filter(Boolean).join(" ");
  if (!text) return [];
  const hits: string[] = [];
  for (const m of MATCHERS) {
    if (m.regexes.some((re) => re.test(text))) hits.push(m.slug);
  }
  return hits;
}

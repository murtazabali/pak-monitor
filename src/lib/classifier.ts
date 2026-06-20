import type { Category } from "@/lib/types";
import { wholeWordRegex } from "@/lib/text";
import { TOPICS } from "@/config/topics";

// Lightweight keyword classifier. Pure heuristic — no API. An article can match
// several categories; if none match it falls back to "general".
const BASE_RULES: Array<{ category: Category; terms: string[] }> = [
  {
    category: "crime",
    terms: [
      "murder", "murdered", "killed", "killing", "robbery", "robbed", "theft",
      "kidnapping", "kidnapped", "arrest", "arrested", "police", "gang",
      "mugging", "dacoit", "extortion", "encounter", "smuggling", "smuggled",
      "narcotics", "rape", "assault", "shooting", "shot dead", "firing",
    ],
  },
  {
    category: "accident",
    terms: [
      "accident", "crash", "collision", "fire", "blaze", "explosion", "blast",
      "injured", "derailment", "drowned", "drowning", "collapse", "overturned",
      "mishap", "electrocuted",
    ],
  },
  {
    category: "weather",
    terms: [
      "rain", "rains", "monsoon", "heatwave", "flood", "floods", "flooding",
      "storm", "cyclone", "weather", "forecast", "smog", "fog", "drought",
      "humidity", "downpour", "cloudburst", "thunderstorm",
    ],
  },
  {
    category: "politics",
    terms: [
      "government", "minister", "assembly", "senate", "parliament", "election",
      "elections", "protest", "governor", "cabinet", "opposition", "court",
      "bill", "ordinance", "pti", "ppp", "pmln", "ecp", "supreme court",
      "prime minister", "president", "national assembly", "by-election",
    ],
  },
  {
    category: "business",
    terms: [
      "rupee", "dollar", "stocks", "psx", "inflation", "economy", "trade",
      "exports", "imports", "investment", "imf", "budget", "tax", "taxes",
      "fbr", "market", "gdp", "petrol", "gold price", "business", "revenue",
      "interest rate", "remittances",
    ],
  },
  {
    category: "sports",
    terms: [
      "cricket", "psl", "football", "hockey", "match", "tournament", "olympics",
      "wicket", "goal", "champions trophy", "squad", "series", "captain",
      "babar", "shaheen", "test match", "t20",
    ],
  },
  {
    category: "health",
    terms: [
      "hospital", "dengue", "polio", "covid", "virus", "vaccine", "health",
      "disease", "patients", "outbreak", "medical", "doctors", "epidemic",
      "measles", "malaria",
    ],
  },
];

// Topic categories (Stocks, FIFA, …) contribute their keywords as rules, so a
// topic's chip filter is driven by the same config that defines the topic.
const TOPIC_RULES: Array<{ category: Category; terms: string[] }> = TOPICS.map((t) => ({
  category: t.slug,
  terms: t.keywords,
}));

const RULES = [...BASE_RULES, ...TOPIC_RULES];

const COMPILED = RULES.map((r) => ({
  category: r.category,
  regexes: r.terms.map(wholeWordRegex),
}));

/** Classify an article's text into zero-or-more categories (default "general"). */
export function classify(text: string): Category[] {
  if (!text) return ["general"];
  const cats: Category[] = [];
  for (const r of COMPILED) {
    if (r.regexes.some((re) => re.test(text))) cats.push(r.category);
  }
  return cats.length ? cats : ["general"];
}

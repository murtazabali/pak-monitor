import type { Category } from "@/lib/types";
import { wholeWordRegex } from "@/lib/text";

// Lightweight keyword classifier. Pure heuristic — no API. An article can match
// several categories; if none match it falls back to "general".
const RULES: Array<{ category: Category; terms: string[] }> = [
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
    // Equities / PSX-specific subset of business. High-precision terms only —
    // broad words ("market", "index", "shares") are deliberately excluded so the
    // Stocks filter stays tight. An article can be both "business" and "stocks".
    category: "stocks",
    terms: [
      "psx", "kse-100", "kse100", "kse 100", "100-index", "100 index",
      "kmi-30", "all-share index", "benchmark index", "pakistan stock exchange",
      "stock exchange", "stock market", "stocks", "equities", "bourse",
      "bullish", "bearish", "ipo", "listed company", "shareholders",
      "market capitalisation", "market capitalization", "brokerage",
      "trading session", "psx 100",
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

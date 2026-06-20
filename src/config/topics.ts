import type { Metadata } from "next";
import type { Category } from "@/lib/types";

/**
 * ── TOPICS: the single source of truth for "trending topic" sections ──────────
 *
 * A topic (Stocks, FIFA, …) is a feed category PLUS, optionally, a live-data
 * panel and a dedicated page. Declaring one here wires up, automatically:
 *   • the classifier rule + filter chip   (src/config/categories.ts, classifier.ts)
 *   • the dashboard chip behaviour          (feed scoping + panel — Dashboard.tsx)
 *   • the dedicated /<slug> page            (src/app/<slug>/page.tsx → TopicView)
 *   • nav links, sitemap entry, SEO         (SiteFooter, sitemap.ts, layout.tsx)
 *   • snapshot embedding under topics.<slug> (scripts/snapshot.ts via lib/topics)
 *
 * The only hand-written, per-topic parts are the data PROVIDER (server fetch +
 * parse) and the PANEL (its UI). See docs/TOPICS.md for the full how-to.
 */

export interface TopicScope {
  /** Ignore the selected-city filter — the topic is national/global (PSX, FIFA). */
  nationwide?: boolean;
  /** Bypass the "PK only" relevance filter — the topic is global (e.g. FIFA). */
  global?: boolean;
}

export interface TopicPageCopy {
  /** SEO <title> (without the site-name suffix). */
  title: string;
  description: string;
  /** Page H1, may include an emoji. */
  heading: string;
  /** Page subtitle. */
  blurb: string;
  /** Heading above the news feed, e.g. "📰 Stocks & market news". */
  newsHeading: string;
  /** Empty-feed hint. */
  newsEmpty: string;
  /** Extra SEO keywords for the page. */
  keywords: string[];
}

export interface TopicConfig {
  /** Category slug, route path and snapshot key — must be a `Category`. */
  slug: Category;
  /** Chip + nav label (keep short). */
  label: string;
  /** Emoji shown on the chip and nav link. */
  icon: string;
  /** Chip accent colour. */
  color: string;
  /** High-precision classifier keywords that tag an article into this topic. */
  keywords: string[];
  /** Extra categories whose articles also belong in this topic's feed (e.g. Stocks ⊇ Business). */
  alsoInclude?: Category[];
  /** Feed-scoping behaviour when this topic is active. */
  scope?: TopicScope;
  /** Copy for the dedicated page. */
  page: TopicPageCopy;
}

export const TOPICS: TopicConfig[] = [
  {
    slug: "fifa",
    label: "FIFA",
    icon: "⚽",
    color: "#38bdf8",
    keywords: [
      "fifa", "world cup", "fifa world cup", "world cup 2026", "uefa",
      "champions league", "premier league", "la liga", "serie a", "bundesliga",
      "ballon d'or", "messi", "ronaldo", "mbappe", "neymar", "haaland",
      "group stage",
    ],
    // FIFA is global football: ignore city scope and the PK-only relevance
    // filter, so foreign World Cup coverage (otherwise filtered out) shows here.
    scope: { nationwide: true, global: true },
    page: {
      title: "FIFA World Cup 2026 — Fixtures, Results & News",
      description:
        "Live FIFA World Cup 2026 scores, upcoming fixtures, recent results and the latest football headlines — updated automatically.",
      heading: "⚽ FIFA World Cup 2026",
      blurb:
        "Live scores, upcoming fixtures, recent results and the latest football headlines from the FIFA World Cup.",
      newsHeading: "📰 Football & World Cup news",
      newsEmpty: "No football stories in the latest snapshot yet.",
      keywords: [
        "FIFA World Cup", "World Cup 2026", "World Cup fixtures",
        "World Cup results", "World Cup scores", "football news",
      ],
    },
  },
  {
    slug: "stocks",
    label: "Stocks",
    icon: "📈",
    color: "#facc15",
    // Equities/PSX-specific terms only — broad words ("market", "index",
    // "shares") are excluded so the chip stays tight. An article can be both
    // "business" and "stocks".
    keywords: [
      "psx", "kse-100", "kse100", "kse 100", "100-index", "100 index",
      "kmi-30", "all-share index", "benchmark index", "pakistan stock exchange",
      "stock exchange", "stock market", "stocks", "equities", "bourse",
      "bullish", "bearish", "ipo", "listed company", "shareholders",
      "market capitalisation", "market capitalization", "brokerage",
      "trading session", "psx 100",
    ],
    alsoInclude: ["business"],
    scope: { nationwide: true },
    page: {
      title: "Pakistan Stocks — KSE-100 & Market News",
      description:
        "Live KSE-100 index, top gainers and losers on the Pakistan Stock Exchange (PSX), and the latest Pakistani stock-market and business headlines — aggregated in real time.",
      heading: "📈 Pakistan Stocks",
      blurb:
        "Live KSE-100 benchmark, top movers and the latest market headlines from the Pakistan Stock Exchange.",
      newsHeading: "📰 Stocks & market news",
      newsEmpty: "No stock or market stories in the latest snapshot yet.",
      keywords: [
        "KSE-100", "KSE 100 index", "PSX", "Pakistan Stock Exchange",
        "Pakistan stocks", "PSX market watch", "KSE-100 today",
        "Pakistan stock market news",
      ],
    },
  },
];

export const TOPIC_BY_SLUG: Record<string, TopicConfig> = Object.fromEntries(
  TOPICS.map((t) => [t.slug, t]),
);

export const TOPIC_SLUGS: string[] = TOPICS.map((t) => t.slug);

/** Build a Next.js Metadata object for a topic's dedicated page. */
export function topicMetadata(slug: string): Metadata {
  const t = TOPIC_BY_SLUG[slug];
  if (!t) return {};
  return {
    title: t.page.title,
    description: t.page.description,
    keywords: t.page.keywords,
    alternates: { canonical: `/${t.slug}` },
  };
}

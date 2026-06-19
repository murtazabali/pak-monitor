import type { Article } from "@/lib/types";
import { tokenize } from "@/lib/text";

/** A group of articles that appear to cover the same story. */
export interface Cluster {
  id: string;
  /** Representative article (the newest in the group, since input is newest-first). */
  lead: Article;
  /** All articles in the group, including the lead. */
  articles: Article[];
  /** Distinct outlet names reporting this story. */
  sources: string[];
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * Group near-duplicate headlines (same event across outlets) using Jaccard
 * similarity over title tokens. Input should be newest-first so each cluster's
 * lead is its most recent article. O(n · clusters) — fine for a few hundred.
 */
export function clusterArticles(articles: Article[], threshold = 0.5): Cluster[] {
  const clusters: Array<Cluster & { tokens: Set<string> }> = [];

  for (const a of articles) {
    const tokens = new Set(tokenize(a.title));
    let best: (Cluster & { tokens: Set<string> }) | null = null;
    let bestScore = threshold;

    for (const c of clusters) {
      const score = jaccard(tokens, c.tokens);
      if (score >= bestScore) {
        best = c;
        bestScore = score;
      }
    }

    if (best) {
      best.articles.push(a);
      if (!best.sources.includes(a.source)) best.sources.push(a.source);
    } else {
      clusters.push({ id: a.id, lead: a, articles: [a], sources: [a.source], tokens });
    }
  }

  return clusters.map(({ tokens: _tokens, ...c }) => c);
}

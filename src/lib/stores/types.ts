import type { Article } from "@/lib/types";

/**
 * Persistence adapter for the rolling article window, backed by lowdb (a JSON
 * file). It exists only so the snapshot script can ingest + query during the CI
 * run; the deployed site is static and reads the resulting snapshot directly.
 */
export interface ArticleStore {
  load(): Promise<Article[]>;
  save(articles: Article[]): Promise<void>;
}

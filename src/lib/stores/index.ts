import type { ArticleStore } from "./types";
import { createLowdbStore } from "./lowdb";

export type { ArticleStore } from "./types";

let instance: ArticleStore | null = null;

/**
 * The article store, backed by lowdb (a JSON file). Only the snapshot script
 * (run in CI) touches it; the deployed site is a static export with no store.
 */
export function getArticleStore(): ArticleStore {
  if (!instance) instance = createLowdbStore();
  return instance;
}

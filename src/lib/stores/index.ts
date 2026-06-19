import type { ArticleStore } from "./types";
import { createLowdbStore } from "./lowdb";
import { createBlobsStore } from "./blobs";

export type { ArticleStore } from "./types";

let instance: ArticleStore | null = null;

/**
 * The active storage adapter, chosen by env:
 *   STORAGE=lowdb | blobs   (defaults to blobs on Netlify, else lowdb)
 */
export function getArticleStore(): ArticleStore {
  if (!instance) {
    const kind = process.env.STORAGE ?? (process.env.NETLIFY ? "blobs" : "lowdb");
    instance = kind === "blobs" ? createBlobsStore() : createLowdbStore();
  }
  return instance;
}

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
    // Explicit STORAGE wins; otherwise auto-pick Blobs when a Netlify runtime is
    // detected (NETLIFY_BLOBS_CONTEXT is injected into Netlify functions).
    const onNetlify = !!(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);
    const kind = process.env.STORAGE ?? (onNetlify ? "blobs" : "lowdb");
    instance = kind === "blobs" ? createBlobsStore() : createLowdbStore();
  }
  return instance;
}

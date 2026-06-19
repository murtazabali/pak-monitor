import type { Article } from "@/lib/types";
import type { ArticleStore } from "./types";

// Netlify Blobs store. @netlify/blobs is imported lazily so it's only loaded when
// this adapter is actually selected (STORAGE=blobs / running on Netlify).
export function createBlobsStore(): ArticleStore {
  type BlobStore = {
    get(key: string, opts: { type: "json" }): Promise<unknown>;
    setJSON(key: string, value: unknown): Promise<void>;
  };
  let storePromise: Promise<BlobStore> | null = null;

  const getBlob = (): Promise<BlobStore> => {
    if (!storePromise) {
      storePromise = import("@netlify/blobs").then(({ getStore }) =>
        getStore("pak-monitor") as unknown as BlobStore,
      );
    }
    return storePromise;
  };

  return {
    async load() {
      const blob = await getBlob();
      const data = (await blob.get("articles", { type: "json" })) as { articles?: Article[] } | null;
      return data?.articles ?? [];
    },
    async save(articles) {
      const blob = await getBlob();
      await blob.setJSON("articles", { articles });
    },
  };
}

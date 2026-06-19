import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
import type { Article } from "@/lib/types";
import type { ArticleStore } from "./types";

interface Data {
  articles: Article[];
}

// On Lambda the working dir is read-only; only /tmp is writable. (lowdb is still
// ephemeral/per-container there — use STORAGE=blobs for real serverless storage.)
const DATA_DIR =
  process.env.DATA_DIR ?? (process.env.LAMBDA_TASK_ROOT ? "/tmp/pak-monitor-data" : join(process.cwd(), "data"));
const DB_FILE = join(DATA_DIR, "db.json");

/** File-backed store (lowdb). The single process caches the data in memory. */
export function createLowdbStore(): ArticleStore {
  let dbPromise: Promise<Low<Data>> | null = null;

  const getDb = (): Promise<Low<Data>> => {
    if (!dbPromise) {
      mkdirSync(DATA_DIR, { recursive: true });
      dbPromise = JSONFilePreset<Data>(DB_FILE, { articles: [] });
    }
    return dbPromise;
  };

  return {
    async load() {
      const db = await getDb();
      return db.data.articles;
    },
    async save(articles) {
      const db = await getDb();
      db.data.articles = articles;
      await db.write();
    },
  };
}

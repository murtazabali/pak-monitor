import type { Article } from "@/lib/types";

/**
 * Persistence adapter for the rolling article window. The query/stats logic in
 * db.ts is shared across platforms; only load/save differ:
 *   - lowdb  → a JSON file (always-on hosts: Render/Railway/Fly/VPS/Docker)
 *   - blobs  → Netlify Blobs (serverless)
 *   - (future) kv → Vercel KV / Cloudflare KV / Redis, etc.
 */
export interface ArticleStore {
  load(): Promise<Article[]>;
  save(articles: Article[]): Promise<void>;
}

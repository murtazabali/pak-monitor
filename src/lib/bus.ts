import { EventEmitter } from "node:events";
import type { Article } from "@/lib/types";

// A single in-process event bus shared between the poller (publisher) and the
// SSE route handlers (subscribers). Stashed on globalThis so it survives module
// re-evaluation during dev HMR and is shared across the Next.js server modules.
const g = globalThis as unknown as { __pakMonitorBus?: EventEmitter };

export const bus: EventEmitter =
  g.__pakMonitorBus ??
  (g.__pakMonitorBus = (() => {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(0); // unbounded — one listener per connected client
    return emitter;
  })());

export const ARTICLE_EVENT = "article";

export function publishArticle(article: Article): void {
  bus.emit(ARTICLE_EVENT, article);
}

export function onArticle(handler: (article: Article) => void): () => void {
  bus.on(ARTICLE_EVENT, handler);
  return () => bus.off(ARTICLE_EVENT, handler);
}

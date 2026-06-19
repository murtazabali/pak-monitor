import type { NextRequest } from "next/server";
import { onArticle } from "@/lib/bus";
import type { Article } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseList(value: string | null): string[] {
  return value
    ? value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];
}

/**
 * Server-Sent Events stream of newly-ingested articles, filtered server-side by
 * the requested cities/categories. Cleans up its bus listener + keepalive timer
 * on client disconnect (abort) or stream cancel so nothing leaks.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const cities = new Set(parseList(sp.get("cities")));
  const categories = new Set(parseList(sp.get("categories")));
  const fromMs = sp.get("from") ? Date.parse(sp.get("from")!) : NaN;
  const toMs = sp.get("to") ? Date.parse(sp.get("to")!) : NaN;
  const encoder = new TextEncoder();

  const matches = (a: Article): boolean => {
    if (cities.size && !a.cities.some((c) => cities.has(c))) return false;
    if (categories.size && !a.categories.some((c) => categories.has(c))) return false;
    const t = Date.parse(a.publishedAt);
    if (!Number.isNaN(fromMs) && t < fromMs) return false;
    if (!Number.isNaN(toMs) && t > toMs) return false;
    return true;
  };

  let unsubscribe: (() => void) | null = null;
  let keepAlive: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (unsubscribe) unsubscribe();
        if (keepAlive) clearInterval(keepAlive);
        req.signal.removeEventListener("abort", cleanup);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      send("ready", { ok: true, ts: Date.now() });

      unsubscribe = onArticle((article) => {
        if (!matches(article)) return;
        try {
          send("article", article);
        } catch {
          cleanup();
        }
      });

      // Comment line every 20s keeps proxies from dropping an idle connection.
      keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          cleanup();
        }
      }, 20_000);

      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      closed = true;
      if (unsubscribe) unsubscribe();
      if (keepAlive) clearInterval(keepAlive);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

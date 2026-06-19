// In-memory feed-health registry, updated by the poller each cycle and read by
// /api/health. Stashed on globalThis so it survives dev HMR and is shared across
// the server's module instances.
import type { FeedHealth } from "@/lib/types";

export type { FeedHealth };

const g = globalThis as unknown as { __pakMonitorHealth?: Map<string, FeedHealth> };
const store: Map<string, FeedHealth> = (g.__pakMonitorHealth ??= new Map());

export function recordHealth(h: FeedHealth): void {
  store.set(h.id, h);
}

export function getHealth(): FeedHealth[] {
  return [...store.values()].sort(
    (a, b) => a.outlet.localeCompare(b.outlet) || a.name.localeCompare(b.name),
  );
}

// Lightweight GA4 event helper. No-ops when gtag isn't present (analytics
// disabled, blocked by a content blocker, or not yet loaded) and is SSR-safe,
// so call sites stay clean and never need to guard for `window`.
type EventParams = Record<string, string | number | boolean>;

export function track(event: string, params?: EventParams): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  w.gtag?.("event", event, params);
}

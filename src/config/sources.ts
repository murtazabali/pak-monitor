// Outlet registry: colors + domains (for favicons). Safe to import on the client.

export interface SourceMeta {
  outlet: string;
  domain: string;
  color: string;
  /** A Pakistan-based outlet (used for the "local only" relevance filter). */
  pk?: boolean;
}

export const SOURCES: SourceMeta[] = [
  { outlet: "Dawn", domain: "dawn.com", color: "#ef4444", pk: true },
  { outlet: "The News", domain: "thenews.com.pk", color: "#0ea5e9", pk: true },
  { outlet: "Express Tribune", domain: "tribune.com.pk", color: "#f59e0b", pk: true },
  { outlet: "Geo News", domain: "geo.tv", color: "#22c55e", pk: true },
  { outlet: "ARY News", domain: "arynews.tv", color: "#a855f7", pk: true },
  { outlet: "Business Recorder", domain: "brecorder.com", color: "#14b8a6", pk: true },
  { outlet: "The Nation", domain: "nation.com.pk", color: "#e11d48", pk: true },
  { outlet: "Samaa TV", domain: "samaa.tv", color: "#f43f5e", pk: true },
  { outlet: "Pakistan Today", domain: "pakistantoday.com.pk", color: "#3b82f6", pk: true },
  { outlet: "Daily Times", domain: "dailytimes.com.pk", color: "#8b5cf6", pk: true },
  { outlet: "ProPakistani", domain: "propakistani.pk", color: "#84cc16", pk: true },
  { outlet: "Google News", domain: "news.google.com", color: "#94a3b8" },
  { outlet: "BBC Urdu", domain: "bbc.com", color: "#b91c1c", pk: true },
  { outlet: "Express Urdu", domain: "express.pk", color: "#d97706", pk: true },
];

export const SOURCE_BY_OUTLET: Record<string, SourceMeta> = Object.fromEntries(
  SOURCES.map((s) => [s.outlet, s]),
);

export function sourceColor(outlet: string): string {
  return SOURCE_BY_OUTLET[outlet]?.color ?? "#64748b";
}

/** Favicon via DuckDuckGo's icon service (no API key). Returns null if unknown. */
export function faviconUrl(outlet: string): string | null {
  const domain = SOURCE_BY_OUTLET[outlet]?.domain;
  return domain ? `https://icons.duckduckgo.com/ip3/${domain}.ico` : null;
}

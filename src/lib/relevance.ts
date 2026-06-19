import { SOURCE_BY_OUTLET } from "@/config/sources";

/**
 * Whether an article is Pakistan-relevant. Per-city Google News queries
 * occasionally surface foreign coverage (e.g. Hyderabad, India); this filters to
 * pieces from a Pakistani outlet OR that explicitly mention Pakistan.
 */
export function isLocalArticle(a: { source: string; title: string; summary: string }): boolean {
  if (SOURCE_BY_OUTLET[a.source]?.pk) return true;
  return /\bpakistan/i.test(`${a.title} ${a.summary}`);
}

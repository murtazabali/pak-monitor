import type { Category } from "@/lib/types";
import { TOPICS } from "@/config/topics";

export interface CategoryMeta {
  slug: Category;
  label: string;
  /** Accent color used for the tag pill + map signals. */
  color: string;
  /** Optional emoji shown on the filter chip (in place of the color dot). */
  icon?: string;
}

// Base (non-topic) categories. Topic categories (Stocks, FIFA, …) are appended
// from the topic registry, so adding a topic adds its chip automatically.
const BASE: CategoryMeta[] = [
  { slug: "politics", label: "Politics", color: "#60a5fa" },
  { slug: "crime", label: "Crime", color: "#f43f5e" },
  { slug: "accident", label: "Accident", color: "#fb923c" },
  { slug: "weather", label: "Weather", color: "#f59e0b" },
  { slug: "business", label: "Business", color: "#34d399" },
  { slug: "sports", label: "Sports", color: "#a78bfa" },
  { slug: "health", label: "Health", color: "#2dd4bf" },
];

const TOPIC_CATEGORIES: CategoryMeta[] = TOPICS.map((t) => ({
  slug: t.slug,
  label: t.label,
  color: t.color,
  icon: t.icon,
}));

const GENERAL: CategoryMeta = { slug: "general", label: "General", color: "#94a3b8" };

export const CATEGORIES: CategoryMeta[] = [...BASE, ...TOPIC_CATEGORIES, GENERAL];

export const CATEGORY_BY_SLUG: Record<string, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
);

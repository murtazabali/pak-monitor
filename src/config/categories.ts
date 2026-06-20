import type { Category } from "@/lib/types";

export interface CategoryMeta {
  slug: Category;
  label: string;
  /** Accent color used for the tag pill + map signals. */
  color: string;
  /** Optional emoji shown on the filter chip (in place of the color dot). */
  icon?: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { slug: "politics", label: "Politics", color: "#60a5fa" },
  { slug: "crime", label: "Crime", color: "#f43f5e" },
  { slug: "accident", label: "Accident", color: "#fb923c" },
  { slug: "weather", label: "Weather", color: "#f59e0b" },
  { slug: "business", label: "Business", color: "#34d399" },
  { slug: "stocks", label: "Stocks", color: "#facc15", icon: "📈" },
  { slug: "sports", label: "Sports", color: "#a78bfa" },
  { slug: "health", label: "Health", color: "#2dd4bf" },
  { slug: "general", label: "General", color: "#94a3b8" },
];

export const CATEGORY_BY_SLUG: Record<string, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
);

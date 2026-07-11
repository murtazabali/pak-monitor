import type { MetadataRoute } from "next";
import { CITIES } from "@/config/cities";
import { TOPIC_SLUGS } from "@/config/topics";
import { SITE_URL } from "@/config/site";

// Generated at build time (required for output: "export").
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const cityPages: MetadataRoute.Sitemap = CITIES.map((c) => ({
    url: `${SITE_URL}/city/${c.slug}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  const staticPages: MetadataRoute.Sitemap = ["about", "faq", "privacy", "contact"].map(
    (slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: slug === "faq" ? 0.5 : 0.3,
    }),
  );

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/digest`, lastModified: now, changeFrequency: "hourly", priority: 0.7 },
    ...TOPIC_SLUGS.map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: 0.7,
    })),
    ...cityPages,
    ...staticPages,
  ];
}

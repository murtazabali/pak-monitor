import type { MetadataRoute } from "next";
import { CITIES } from "@/config/cities";
import { SITE_URL } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const cityPages: MetadataRoute.Sitemap = CITIES.map((c) => ({
    url: `${SITE_URL}/city/${c.slug}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/digest`, lastModified: now, changeFrequency: "hourly", priority: 0.7 },
    ...cityPages,
  ];
}

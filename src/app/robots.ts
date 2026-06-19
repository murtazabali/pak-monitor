import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

// Generated at build time (required for output: "export").
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // No SEO value in crawling the live JSON/stream endpoints.
      disallow: "/api/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

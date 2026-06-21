// Single source of truth for the canonical site URL + branding, reused by
// metadata, sitemap, robots and structured data.

export const SITE_URL = "https://pak-monitor.pages.dev";
export const SITE_NAME = "Pak Monitor";
export const SITE_TAGLINE = "Realtime Pakistan City News";
export const SITE_DESCRIPTION =
  "Live news monitor for Pakistani cities. Pick cities and watch everything happening there — crime, politics, weather and business — stream in, in real time, aggregated from Pakistan's top outlets.";

// Where the dashboard / city / digest pages read their data from. In dev, the
// local /public seed; in any production build, GitHub's CDN (the `data` branch
// the cron force-pushes) — so the host needs no env config and data refreshes
// never trigger a rebuild. NEXT_PUBLIC_SNAPSHOT_URL overrides either.
export const SNAPSHOT_URL =
  process.env.NEXT_PUBLIC_SNAPSHOT_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://raw.githubusercontent.com/murtazabali/pak-monitor/data/snapshot.json"
    : "/data/snapshot.json");

// Public contact address shown on the Contact page (required for AdSense).
export const CONTACT_EMAIL = "murtaza_fakhruddin@outlook.com";

// Google AdSense publisher ID.
export const ADSENSE_CLIENT = "ca-pub-9118158293508962";

// Google Analytics 4 measurement ID. Loaded only when non-empty, so forks /
// local builds don't report to this property. NEXT_PUBLIC_GA_ID overrides it.
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-CYPLQF7JEX";

// Ad-unit slot IDs. Leave "" and ad slots render nothing (so there are no
// empty ad boxes before approval). After AdSense approves the site, create
// units under Ads → By ad unit and paste their slot IDs here to switch them on.
export const ADSENSE_SLOTS = {
  feed: "", // homepage, below the live feed
  article: "", // city + digest pages
};

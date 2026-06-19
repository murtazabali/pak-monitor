// Single source of truth for the canonical site URL + branding, reused by
// metadata, sitemap, robots and structured data.

export const SITE_URL = "https://pak-monitor.netlify.app";
export const SITE_NAME = "Pak Monitor";
export const SITE_TAGLINE = "Realtime Pakistan City News";
export const SITE_DESCRIPTION =
  "Live news monitor for Pakistani cities. Pick cities and watch everything happening there — crime, politics, weather and business — stream in, in real time, aggregated from Pakistan's top outlets.";

// Where the dashboard / city / digest pages read their data from. A prebuilt
// snapshot, served from the local /public copy in dev and from GitHub's CDN in
// production (so data refreshes never trigger a Netlify rebuild). Override with
// NEXT_PUBLIC_SNAPSHOT_URL at build time.
export const SNAPSHOT_URL =
  process.env.NEXT_PUBLIC_SNAPSHOT_URL || "/data/snapshot.json";

// Public contact address shown on the Contact page (required for AdSense).
export const CONTACT_EMAIL = "murtaza_fakhruddin@outlook.com";

// Google AdSense publisher ID.
export const ADSENSE_CLIENT = "ca-pub-9118158293508962";

// Ad-unit slot IDs. Leave "" and ad slots render nothing (so there are no
// empty ad boxes before approval). After AdSense approves the site, create
// units under Ads → By ad unit and paste their slot IDs here to switch them on.
export const ADSENSE_SLOTS = {
  feed: "", // homepage, below the live feed
  article: "", // city + digest pages
};

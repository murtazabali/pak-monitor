# Deploying to Vercel

The site is a plain Next.js **static export** (`output: "export"` → `out/`), so it
moves to Vercel with no code changes. Nothing in the app is host-specific: the
news snapshot is fetched client-side from GitHub's CDN
(`raw.githubusercontent.com/.../data/snapshot.json`, see `src/config/site.ts`),
and the snapshot refresh runs entirely in GitHub Actions (`.github/workflows/snapshot.yml`).
The host only ever serves static files.

## Steps

1. **Import the repo** at vercel.com → *Add New… → Project*.
2. Vercel reads [`vercel.json`](../vercel.json) — no dashboard build config needed:
   - `framework: null` + `buildCommand: next build` + `outputDirectory: out` → serves
     `out/` as a pure static site (no serverless functions), exactly like Cloudflare Pages.
   - `cleanUrls: true` maps `/about` → `about.html` (the export uses `trailingSlash: false`).
   - The `redirects` block sends `www.pak-monitor.com` → apex `https://pak-monitor.com`.
3. **Add the domains**: add both `pak-monitor.com` and `www.pak-monitor.com` to the
   project, then point DNS at Vercel (apex `A`/`ALIAS` + `www` `CNAME` per Vercel's
   instructions). The `vercel.json` redirect handles www → apex; you do **not** also
   need to set a redirect in the dashboard (avoid double-configuring).
4. The GitHub Actions snapshot cron keeps working untouched — it never knew about the host.

## ⚠️ Before you switch: cost / Terms of Service

This site runs **Google AdSense**, which makes it commercial use.

| | Cloudflare Pages (current) | Vercel Hobby (free) | Vercel Pro |
|---|---|---|---|
| Commercial use / ads | ✅ allowed | ❌ **prohibited** | ✅ allowed |
| Bandwidth | unlimited | 100 GB/mo | 1 TB/mo, then metered |
| Price | free | free | $20/mo |

Because of AdSense you'd need **Vercel Pro ($20/mo)** to be ToS-compliant, whereas
Cloudflare Pages allows ads on the free, unlimited-bandwidth tier. There's no
technical blocker to moving — just no free path while the site carries ads.

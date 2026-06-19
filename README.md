# 🛰️ Pak Monitor

**A realtime news monitor for Pakistan.** Pick one or more cities and watch everything happening there stream in live — on a glowing map of Pakistan and a realtime feed. Default city is **Karachi**.

[![CI](https://github.com/murtazabali/pak-monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/murtazabali/pak-monitor/actions/workflows/ci.yml)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/murtazabali/pak-monitor)

No API keys. No accounts. No database server. Just:

```bash
git clone https://github.com/murtazabali/pak-monitor.git
cd pak-monitor
nvm use            # uses Node 25 (see .nvmrc); Node 20+ works
npm install        # pure-JS deps — no native build step
npm run dev        # open http://localhost:3000
```

---

## ✨ Features

- **Live map of Pakistan** — every monitored city is a node that **pulses when fresh news lands**. Click a node to filter.
- **Realtime feed** over Server-Sent Events — new stories prepend themselves the moment they're ingested. Pause / resume with a "N new" pill.
- **Story clustering** — the same event across outlets is grouped into one card with a **"N outlets reporting"** badge, plus a **🔥 Trending** strip of the most-reported stories.
- **City filtering** — multi-select chips (Karachi by default) or a whole **province**. Articles match by city name + known neighborhoods/landmarks (Karachi ⇒ Clifton, Saddar, Korangi…), in English **and Urdu**.
- **Filters** — keyword **category tags** (politics/crime/weather/accident/business/sports/health), **source** filter, **date range** (rolling 24h/7d/30d or custom), and instant **search**.
- **Watchlist + alerts** — track keywords (highlighted in the feed) and opt into **browser notifications** + a sound ping for breaking news in your cities.
- **Read tracking** — mark-as-read, unread counts, hide-read.
- **Stats panel** — per-hour sparkline, top cities/categories/sources, a keyword cloud, and live **feed health**.
- **City pages** — `/city/karachi` with that city's feed and mini-stats.
- **Shareable URLs** + **saved views** — filters live in the query string (any view is a link), and you can name/recall presets. **CSV export** of the current view.
- **Output & integrations** — subscribe to any filtered view as **RSS** (`/api/rss`), read a **daily digest** at `/digest`, and push breaking news to a **webhook** (Slack / Discord / generic).
- **Signal extras** — **activity-spike** alerts when a city jumps vs its baseline, keyword **sentiment** tone, **entity** extraction ("who's in the news"), and a **PK-only** relevance filter to cut foreign noise.
- **Keyboard navigation** — `j`/`k` to move, `o`/Enter to open, `/` to search.
- **PWA** — installable, with an offline app shell.
- **~24 sources, no keys** — Dawn, The News, Express Tribune, Geo News, ARY News, Business Recorder, The Nation, BBC Urdu, Express Urdu, **+ per-city Google News** for wide local coverage.
- **Dark "intel command-center" aesthetic.**

## 🧱 Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS |
| Realtime | Server-Sent Events + an in-process event bus |
| Storage | [lowdb](https://github.com/typicode/lowdb) (embedded JSON — zero native deps) |
| Ingestion | `rss-parser`, polled on a background loop started via `instrumentation.ts` |
| Map | `d3-geo` + a bundled Pakistan GeoJSON (renders fully offline) |
| Tests | Playwright |

Everything runs in **one Node process**. There is no external service to stand up.

## 🛠️ How it works

```
instrumentation.register()  ─▶  poller (every ~90s)
                                 ├─ fetch all enabled RSS feeds (browser UA, fault-isolated)
                                 ├─ normalize → hash id, strip HTML, extract image, date fallback
                                 ├─ tag cities (name + localities) + classify categories
                                 ├─ store in lowdb (dedup + rolling 2000-item window)
                                 └─ emit each new article on the event bus
                                          │
        GET /api/articles?cities=…  ◀─────┤  (JSON backlog for first paint)
        GET /api/stream?cities=…    ◀─────┘  (SSE — server-side filtered live push)
```

The browser only ever talks to this app's own `/api/*` routes, so there are **no CORS issues** — feeds are fetched server-side.

## ⚙️ Configuration

### Add or remove a city

Edit [`src/config/cities.ts`](src/config/cities.ts) and append:

```ts
{
  slug: "gujranwala",
  name: "Gujranwala",
  province: "Punjab",
  lat: 32.1877,
  lng: 74.1945,
  localities: ["g.t. road", "satellite town", "model town", "sheikhupura road"],
}
```

It instantly becomes a filter chip and a map node, and starts tagging articles. **Tip:** prefer *distinctive* localities — generic names shared between cities are best left out (the city name itself is always matched).

### Add or remove a feed

Edit [`src/config/feeds.ts`](src/config/feeds.ts) and append:

```ts
{ id: "my-source", name: "Section", outlet: "My Outlet", url: "https://example.com/feed", enabled: true }
```

A few outlets (Samaa, Pakistan Today, Daily Times) are included but **disabled** because they block some fetchers at the CDN; flip `enabled: true` to try them — the poller already sends a browser User-Agent.

### Environment

| Variable | Default | Meaning |
|---|---|---|
| `POLL_INTERVAL_MS` | `90000` | How often (ms) to poll all feeds. |
| `GOOGLE_NEWS` | `on` | Set to `off` to disable the per-city Google News feeds. |
| `PORT` | `3000` | Port for the dev/prod server. |
| `ALERT_WEBHOOK_URL` | — | Incoming webhook URL for breaking-news alerts (enables webhooks). |
| `ALERT_WEBHOOK_FORMAT` | auto | `slack` \| `discord` \| `json` (auto-detected from the URL by default). |
| `ALERT_CITIES` | all | Comma-separated city slugs to alert on. |
| `ALERT_CATEGORIES` | `crime,accident` | Comma-separated categories to alert on. |

### Outputs

- **RSS** — `/api/rss?cities=karachi&categories=crime` — a filtered feed for any reader.
- **Digest** — `/digest?cities=karachi` — a 24-hour summary page (top stories, spikes, breakdowns).
- **Webhooks** — set `ALERT_WEBHOOK_URL` to a Slack/Discord incoming webhook (or any endpoint) and matching breaking news is posted there each poll cycle.

See [`.env.example`](.env.example).

## ✅ Testing

```bash
npm run test:unit   # fast Vitest unit tests (tagger, classifier, clustering, …)
npm test            # Playwright E2E suite (boots a dev server automatically)
npm run test:headed # watch the E2E run in a browser
```

Unit tests cover the pure logic; the E2E suite covers the real API + SSE stack and the UI (UI tests mock the API so they're deterministic and pass offline). Both run in CI.

## 📦 Production

```bash
npm run build
npm start
```

Or with Docker:

```bash
docker build -t pak-monitor .
docker run -p 3000:3000 pak-monitor
# with webhook alerts:
docker run -p 3000:3000 -e ALERT_WEBHOOK_URL=https://hooks.slack.com/... pak-monitor
```

> **Scaling note:** the realtime fan-out uses an in-process event bus, which is perfect for a single instance. To run multiple instances behind a load balancer, swap the bus in [`src/lib/bus.ts`](src/lib/bus.ts) for a shared pub/sub (e.g. Redis) and lowdb in [`src/lib/db.ts`](src/lib/db.ts) for a real database — both are isolated behind small modules.

## 🚀 Deploying

You only need a server because **browsers can't read cross-origin RSS feeds (CORS)** — the feeds must be fetched off-browser. But you don't need an *always-on* server or a database. Three modes, selected by env vars:

| Mode | Best host | Ingestion | Reads | Realtime |
|---|---|---|---|---|
| **Always-on** (default) | Render / Railway / Fly / VPS / Docker | in-process poller | live API + lowdb | SSE (instant) |
| **Serverless** | Netlify / Vercel | scheduled fn → `/api/ingest` | live API + Blobs | client polling |
| **Static-JSON** | anywhere (incl. static hosts) | cron → `snapshot.json` | a static file | client polling |

**Knobs:** `STORAGE` (`lowdb`\|`blobs`), `NEXT_PUBLIC_REALTIME` (`sse`\|`poll`), `NEXT_PUBLIC_DATA_SOURCE` (`api`\|`static`), plus the universal **`/api/ingest`** endpoint (protect it with `CRON_SECRET`) that any scheduler can call.

### Netlify (serverless)

1. Connect the repo to Netlify (it auto-detects Next.js). [`netlify.toml`](netlify.toml) already sets `STORAGE=blobs`, `NEXT_PUBLIC_REALTIME=poll`, `GOOGLE_NEWS=off`.
2. In the Netlify UI set a `CRON_SECRET` (and optionally `ALERT_WEBHOOK_URL`).
3. [`netlify/functions/ingest-scheduled.mts`](netlify/functions/ingest-scheduled.mts) pings `/api/ingest` every 2 minutes to refresh the data in Netlify Blobs.

### Static-JSON (no live backend)

1. A cron regenerates the data file: `npm run snapshot` writes `public/data/snapshot.json`. The included [`.github/workflows/snapshot.yml`](.github/workflows/snapshot.yml) does this on a schedule and commits it.
2. Build/host with `NEXT_PUBLIC_DATA_SOURCE=static`; the dashboard polls the snapshot — no live ingestion or DB needed.

> The static mode powers the **dashboard**. The **city pages** and **digest** read live data, so they need the always-on or serverless mode (or live ingestion). Committing the snapshot adds repo churn — lower the cron cadence or push it to a CDN/Blob if that matters.

## 🗂️ Project structure

```
src/
├── instrumentation.ts        # starts the poller on server boot (Node runtime only)
├── config/{feeds,cities,categories}.ts   # ← edit these to customize
├── lib/                      # poller, rss, normalize, cityTagger, classifier, db, bus
├── data/pakistan.geo.json    # offline map outline
└── app/
    ├── api/{articles,stream}/route.ts     # backlog + SSE
    └── components/           # Dashboard, PakistanMap, CityChips, FeedList, …
tests/                        # Playwright specs
```

## 📜 License

MIT — see [LICENSE](LICENSE).

News content belongs to the respective outlets; this project only links to their articles and reads their public RSS feeds.

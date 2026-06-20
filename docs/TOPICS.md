# Adding a "topic" (trending section)

A **topic** is a feed category (e.g. Stocks, FIFA) that gets its own filter chip,
a dedicated `/<slug>` page, and — optionally — a live-data **panel** (KSE-100
movers, World-Cup fixtures, …). Topics are config-driven: declare one and the
chip, route, nav links, sitemap, SEO, classifier rule, dashboard behaviour and
snapshot embedding are all wired up automatically.

This doc is the how-to. Keep it in sync when the system changes.

## Architecture at a glance

```
src/config/topics.ts                        ← TOPICS registry (single source of truth)
src/lib/topics/<slug>.ts                     ← data provider:  export async getData()
src/lib/topics/index.ts                      ← TOPIC_PROVIDERS map + fetchAllTopics()
src/app/components/topics/<Slug>Panel.tsx    ← the panel UI:  ({ data }: { data: unknown })
src/app/components/topics/registry.ts        ← TOPIC_PANELS map (slug → panel component)
src/app/components/topics/TopicPanel.tsx     ← renders a panel by slug (generic)
src/app/components/topics/TopicView.tsx      ← the GENERIC /<slug> page (panel + news feed)
src/app/<slug>/page.tsx                       ← 4-line route wrapper (metadata from config)
```

Data flow: the cron (`scripts/snapshot.ts`) calls `fetchAllTopics()`, which runs
every provider's `getData()` in parallel and writes the results to
`snapshot.json` under `topics.<slug>`. The frontend (dashboard + `/<slug>` page)
reads `topics.<slug>` and hands it to that topic's panel.

## What you get for free (from one `TopicConfig`)

- The `Category` chip (icon/label/colour) — `src/config/categories.ts`
- The classifier rule (your `keywords`) — `src/lib/classifier.ts`
- The dashboard chip behaviour: shows the panel atop the feed + feed scoping
  (`alsoInclude`, `scope.nationwide`, `scope.global`) — `Dashboard.tsx`
- Nav links (dashboard tools + footer), `sitemap.ts`, SEO keywords (`layout.tsx`)
- Snapshot embedding under `topics.<slug>`

The only hand-written, per-topic parts are the **data provider** and the **panel
UI** (because each topic's data shape and presentation differ).

## Steps to add a topic

Say the new topic is `weather` (with a live forecast panel).

1. **Add the category slug to the union** — `src/lib/types.ts`:
   ```ts
   export type Category = … | "weather-topic";  // must match the topic slug
   ```
   (Topic slugs are `Category` values. This is the one type edit required.)

2. **Add a `TopicConfig`** to `TOPICS` in `src/config/topics.ts`:
   ```ts
   {
     slug: "weather-topic", label: "Weather", icon: "🌦", color: "#38bdf8",
     keywords: ["forecast", "monsoon", "heatwave", …],   // high-precision; drives chip + classifier
     alsoInclude: [],                  // extra categories to fold into this topic's feed (Stocks ⊇ "business")
     scope: { nationwide: true, global: false },  // nationwide → ignore city filter; global → bypass "PK only"
     page: { title, description, heading, blurb, newsHeading, newsEmpty, keywords },
   }
   ```

3. **Add a data provider** (skip if the topic is news-only) —
   `src/lib/topics/weather-topic.ts`:
   ```ts
   export async function getData(): Promise<WeatherSnapshot | null> { … }
   ```
   - Fetch a **free, key-less** source server-side (no CORS concern in the cron).
     Precedent: PSX scrape (`stocks.ts`), ESPN JSON (`fifa.ts`).
   - **Never throw** — return `null` on any failure so the rest of the snapshot
     still publishes and the UI shows a placeholder.
   - Keep parsing in a **pure, exported** helper so it can be unit-tested against
     a captured fixture (see `parseMovers`, `parseScoreboard`).
   - Define its data type in `src/lib/types.ts`.
   Then register it in `src/lib/topics/index.ts`:
   ```ts
   import { getData as weatherTopic } from "./weather-topic";
   export const TOPIC_PROVIDERS = { stocks, fifa, "weather-topic": weatherTopic };
   ```

4. **Add a panel** (skip if news-only) —
   `src/app/components/topics/WeatherPanel.tsx`:
   ```tsx
   export default function WeatherPanel({ data }: { data: unknown }) {
     const w = (data ?? null) as WeatherSnapshot | null;
     if (!w) return <Placeholder/>;   // graceful when data is missing
     …
   }
   ```
   Register it in `src/app/components/topics/registry.ts`:
   ```ts
   export const TOPIC_PANELS = { stocks: StocksPanel, fifa: FifaPanel, "weather-topic": WeatherPanel };
   ```

5. **Add the route wrapper** — `src/app/weather-topic/page.tsx`:
   ```tsx
   import { topicMetadata } from "@/config/topics";
   import TopicView from "@/app/components/topics/TopicView";
   export const metadata = topicMetadata("weather-topic");
   export default function Page() { return <TopicView slug="weather-topic" />; }
   ```

6. **Tests** — add a unit test for the provider's pure parser
   (`tests/unit/topics-<slug>.test.ts`) and, optionally, an e2e in
   `tests/ui.spec.ts` mirroring the Stocks/FIFA blocks (mock
   `topics: { "weather-topic": FIXTURE }`).

That's it — the chip, `/weather-topic` page, nav links, sitemap and snapshot
embedding appear automatically.

## Scope flags (feed behaviour when the chip is active)

- `alsoInclude: Category[]` — also show these categories in the topic's feed.
  Stocks uses `["business"]` so the feed isn't empty during a stock-news lull.
- `scope.nationwide` — ignore the selected-city filter (the topic is national/
  global; its news often has no city tag). Stocks + FIFA both set this.
- `scope.global` — bypass the "PK only" relevance filter. FIFA sets this so
  foreign World-Cup coverage (otherwise dropped by `isLocalArticle`) shows.

## Gotchas

- **`Category` union** — the slug must be added to `src/lib/types.ts` (step 1),
  or TypeScript rejects it. This is intentional (keeps category types exact).
- **Local store staleness** — the local dev store (`data/db.json`, gitignored)
  persists between `npm run snapshot` runs and dedups by id WITHOUT re-classifying.
  After changing a topic's `keywords`, delete `data/db.json` before regenerating
  the seed, or already-stored articles keep their old tags. CI is unaffected (it
  starts from an empty store each run).
- **No API keys** — providers must use free, key-less sources (clone-and-run is a
  core constraint). Scrape/parse public endpoints server-side in the cron.
- **Graceful null** — a provider returning `null`, or an old snapshot without the
  `topics.<slug>` key, must render the panel's placeholder, never crash.
- **Snapshot shape** — topic data lives under `topics.<slug>` in `snapshot.json`
  (there is no top-level `market` field anymore).
```

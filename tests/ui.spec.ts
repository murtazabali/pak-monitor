import { test, expect, type Page } from "@playwright/test";
import type { Article } from "../src/lib/types";

// ── Deterministic fixtures ──────────────────────────────────────────────────
// "now" so the "Today"/"24h" presets always include these in the browser's
// local timezone, regardless of where the tests run.
const NOW = new Date().toISOString();

function makeArticle(over: Partial<Article> & Pick<Article, "id" | "title">): Article {
  return {
    link: "https://example.com/" + over.id,
    source: "Dawn",
    sourceId: "fixture",
    summary: "Fixture summary text.",
    imageUrl: null,
    publishedAt: NOW,
    fetchedAt: NOW,
    cities: ["karachi"],
    categories: ["crime"],
    ...over,
  };
}

const ALPHA = makeArticle({ id: "alpha", title: "ZZ Crime fixture headline alpha", categories: ["crime"] });
const BETA = makeArticle({ id: "beta", title: "ZZ Sports fixture headline beta", categories: ["sports"] });
const OLD = makeArticle({
  id: "old",
  title: "ZZ Old archived headline delta",
  publishedAt: "2020-01-01T00:00:00.000Z",
  fetchedAt: "2020-01-01T00:00:00.000Z",
  categories: ["politics"],
});

const STOCK = makeArticle({
  id: "stock1",
  title: "ZZ KSE-100 hits record high as PSX rallies",
  categories: ["stocks", "business"],
});

const MARKET = {
  asOf: NOW,
  status: "closed" as const,
  index: { symbol: "KSE100", label: "KSE-100", value: 178922.75, change: -2475.46, changePct: -1.36 },
  gainers: [{ symbol: "SSGC", name: "Sui Southern Gas Company", price: 31.32, changePct: 2.25, volume: 87347852 }],
  losers: [{ symbol: "HCAR", name: "Honda Atlas Cars", price: 300, changePct: -4.56, volume: 1200000 }],
};

// A football story from a NON-Pakistani outlet with no PK mention — normally
// dropped by "PK only", but FIFA is a global topic so it should still show.
const FOOTBALL = makeArticle({
  id: "fifa1",
  title: "ZZ England beat Spain in World Cup thriller",
  source: "Reuters",
  cities: [],
  categories: ["fifa", "general"],
});

const FIFA_DATA = {
  league: "FIFA World Cup",
  season: 2026,
  asOf: NOW,
  live: [],
  recent: [
    { id: "m1", date: NOW, state: "post", status: "FT", round: "Group Stage",
      home: { name: "Netherlands", abbr: "NED", logo: null, score: 5, winner: true },
      away: { name: "Sweden", abbr: "SWE", logo: null, score: 1, winner: false } },
  ],
  upcoming: [
    { id: "m2", date: NOW, state: "pre", status: "", round: "Group Stage",
      home: { name: "Ecuador", abbr: "ECU", logo: null, score: null, winner: false },
      away: { name: "Curacao", abbr: "CUW", logo: null, score: null, winner: false } },
  ],
};

const backlog = [ALPHA, BETA];

// Stats derived from the same article list, so aggregates line up with the feed.
function statsFor(list: Article[]) {
  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const byCity: Record<string, number> = {};
  for (const a of list) {
    for (const c of a.categories) byCategory[c] = (byCategory[c] ?? 0) + 1;
    bySource[a.source] = (bySource[a.source] ?? 0) + 1;
    for (const c of a.cities) byCity[c] = (byCity[c] ?? 0) + 1;
  }
  return {
    total: list.length,
    byCity,
    byCategory,
    bySource,
    perHour: Array.from({ length: 24 }, (_, i) => i % 4),
    topKeywords: [{ word: "karachi", count: 5 }],
    topEntities: [{ name: "Karachi", count: 5 }],
    spikes: [],
  };
}

// The static app reads everything from one prebuilt snapshot file. Intercept it
// so the dashboard, city pages and digest all run against deterministic data.
async function mockApi(page: Page, opts: { backlog?: Article[] } = {}) {
  const list = opts.backlog ?? backlog;
  await page.route("**/data/snapshot.json**", async (route) => {
    await route.fulfill({
      json: {
        generatedAt: NOW,
        articles: list,
        counts: { karachi: 2, lahore: 5, islamabad: 9 },
        stats: statsFor(list),
      },
    });
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────
test.describe("Dashboard UI", () => {
  test("renders the shell, default All Pakistan scope, the map and the backlog", async ({ page }) => {
    await mockApi(page);
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /PAK/ })).toBeVisible();

    // Defaults to All Pakistan (no city pre-selected); the city chips still render.
    await expect(page.getByRole("button", { name: /^Karachi/ })).toBeVisible();
    await expect(page.getByRole("main").getByText("All Pakistan")).toBeVisible();

    // Backlog articles render.
    await expect(page.getByText(ALPHA.title)).toBeVisible();
    await expect(page.getByText(BETA.title)).toBeVisible();

    // The Pakistan map renders with city nodes.
    const svg = page.locator("svg[aria-label*='Pakistan']");
    await expect(svg).toBeVisible();
    expect(await svg.locator("circle").count()).toBeGreaterThan(5);
  });

  test("city chip count is derived from the loaded articles, not the snapshot's counts", async ({ page }) => {
    // The snapshot's `counts` cover the full server-side store and over-count
    // vs the shipped articles[]. Make them deliberately wrong: the chip must
    // reflect the 3 Karachi articles actually loaded, not 99.
    const third = makeArticle({ id: "k3", title: "ZZ Third Karachi fixture headline" });
    await page.route("**/data/snapshot.json**", (route) =>
      route.fulfill({
        json: { generatedAt: NOW, articles: [ALPHA, BETA, third], counts: { karachi: 99 }, stats: statsFor([ALPHA, BETA, third]) },
      }),
    );
    await page.goto("/");
    await expect(page.getByRole("button", { name: /^Karachi\s*3\b/ })).toBeVisible();
  });

  test("search filters the feed", async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await expect(page.getByText(ALPHA.title)).toBeVisible();

    await page.getByPlaceholder(/Search headlines/).fill("alpha");
    await expect(page.getByText(ALPHA.title)).toBeVisible();
    await expect(page.getByText(BETA.title)).toHaveCount(0);
  });

  test("category filter narrows the feed", async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await expect(page.getByText(BETA.title)).toBeVisible();

    // Filter to Crime → the sports article disappears.
    await page.getByRole("button", { name: "Crime" }).click();
    await expect(page.getByText(ALPHA.title)).toBeVisible();
    await expect(page.getByText(BETA.title)).toHaveCount(0);
  });

  test("the Stocks chip reveals the market panel + market news in the feed", async ({ page }) => {
    await page.route("**/data/snapshot.json**", (route) =>
      route.fulfill({
        json: { generatedAt: NOW, articles: [STOCK, BETA], topics: { stocks: MARKET }, stats: statsFor([STOCK, BETA]) },
      }),
    );
    await page.goto("/");

    // The market panel only appears once the Stocks filter is active.
    await expect(page.getByText("178,922.75")).toHaveCount(0);

    // Narrow to Lahore first: the stocks view is national (PSX), so it must
    // ignore the city scope — the Karachi-tagged stock story still shows.
    await page.getByRole("button", { name: /^Lahore/ }).click();
    await page.getByRole("button", { name: "Stocks" }).click();

    await expect(page.getByText("178,922.75")).toBeVisible();
    await expect(page.getByText("Top gainers")).toBeVisible();
    // The feed continues with stock/market news; the sports story is filtered out.
    await expect(page.getByText(STOCK.title)).toBeVisible();
    await expect(page.getByText(BETA.title)).toHaveCount(0);
  });

  test("the FIFA chip shows fixtures/results and global football news", async ({ page }) => {
    await page.route("**/data/snapshot.json**", (route) =>
      route.fulfill({
        json: { generatedAt: NOW, articles: [FOOTBALL, BETA], topics: { fifa: FIFA_DATA }, stats: statsFor([FOOTBALL, BETA]) },
      }),
    );
    await page.goto("/");

    await page.getByRole("button", { name: "FIFA" }).click();

    // Fixtures/results panel.
    await expect(page.getByText("FIFA World Cup 2026")).toBeVisible();
    await expect(page.getByText("Netherlands")).toBeVisible();
    await expect(page.getByText("Ecuador")).toBeVisible();
    // FIFA is global → the foreign-outlet football story shows despite "PK only".
    await expect(page.getByText(FOOTBALL.title)).toBeVisible();
    await expect(page.getByText(BETA.title)).toHaveCount(0);
  });

  test("selecting Stocks + FIFA together shows both panels and both feeds", async ({ page }) => {
    await page.route("**/data/snapshot.json**", (route) =>
      route.fulfill({
        json: {
          generatedAt: NOW,
          articles: [STOCK, FOOTBALL, BETA],
          topics: { stocks: MARKET, fifa: FIFA_DATA },
          stats: statsFor([STOCK, FOOTBALL, BETA]),
        },
      }),
    );
    await page.goto("/");

    await page.getByRole("button", { name: "Stocks" }).click();
    await page.getByRole("button", { name: "FIFA" }).click();

    // Both panels render.
    await expect(page.getByText("178,922.75")).toBeVisible();
    await expect(page.getByText("FIFA World Cup 2026")).toBeVisible();
    // Both topics' news show; the unrelated sports story doesn't.
    await expect(page.getByText(STOCK.title)).toBeVisible();
    await expect(page.getByText(FOOTBALL.title)).toBeVisible();
    await expect(page.getByText(BETA.title)).toHaveCount(0);
  });

  test("selecting cities updates the live scope label", async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    // Defaults to All Pakistan; pick two cities to get a unique combined label.
    await page.getByRole("button", { name: /^Karachi/ }).click();
    await page.getByRole("button", { name: /^Lahore/ }).click();
    await expect(page.getByText("Karachi, Lahore")).toBeVisible();
  });

  test("date range preset hides out-of-range articles", async ({ page }) => {
    await mockApi(page, { backlog: [ALPHA, OLD] });
    await page.goto("/");

    // "All" by default → both the recent and the 2020 article show.
    await expect(page.getByText(ALPHA.title)).toBeVisible();
    await expect(page.getByText(OLD.title)).toBeVisible();

    // Restrict to the last 24h → the 2020 article drops out, the recent one stays.
    await page.getByRole("button", { name: "24h", exact: true }).click();
    await expect(page.getByText(ALPHA.title)).toBeVisible();
    await expect(page.getByText(OLD.title)).toHaveCount(0);
  });

  test("pause toggles the live feed state", async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await page.getByTitle("Pause live feed").click();
    await expect(page.getByText("Paused")).toBeVisible();
  });

  test("same-story headlines cluster with an 'outlets reporting' badge", async ({ page }) => {
    const headline = "Major flooding hits Karachi after record monsoon rain";
    await mockApi(page, {
      backlog: [
        makeArticle({ id: "c1", title: headline, source: "Dawn", categories: ["weather"] }),
        makeArticle({ id: "c2", title: headline, source: "Geo News", categories: ["weather"] }),
      ],
    });
    await page.goto("/");
    await expect(page.getByText(/2 outlets reporting/)).toBeVisible();
  });

  test("source filter narrows the feed", async ({ page }) => {
    const dawn = makeArticle({ id: "s1", title: "Provincial budget passes after lengthy debate", source: "Dawn" });
    const geo = makeArticle({ id: "s2", title: "Cricket board names squad for upcoming tour", source: "Geo News" });
    await mockApi(page, { backlog: [dawn, geo] });
    await page.goto("/");
    await expect(page.getByText(dawn.title)).toBeVisible();

    await page.locator("summary", { hasText: "Sources" }).click();
    await page.getByRole("checkbox", { name: "Geo News" }).check();

    await expect(page.getByText(geo.title)).toBeVisible();
    await expect(page.getByText(dawn.title)).toHaveCount(0);
  });

  test("watchlist highlights matching headlines", async ({ page }) => {
    await mockApi(page, { backlog: [makeArticle({ id: "w1", title: "Breaking flood alert downtown" })] });
    await page.goto("/");
    const input = page.getByLabel("Add watchlist keyword");
    await input.fill("flood");
    await input.press("Enter");
    await expect(page.locator("mark", { hasText: "flood" })).toBeVisible();
  });

  test("stats panel opens and shows aggregates", async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Stats/ }).click();
    await expect(page.getByText("Statistics")).toBeVisible();
    await expect(page.getByText("Articles by category")).toBeVisible();

    // Escape closes the drawer.
    await page.keyboard.press("Escape");
    await expect(page.getByText("Statistics")).toHaveCount(0);
  });

  test("the CSV export button is present", async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await expect(page.getByRole("button", { name: /CSV/ })).toBeVisible();
  });
});

test.describe("Stocks page", () => {
  async function mockStocks(page: Page) {
    await page.route("**/data/snapshot.json**", (route) =>
      route.fulfill({
        json: { generatedAt: NOW, articles: [STOCK, ALPHA], topics: { stocks: MARKET }, stats: statsFor([STOCK, ALPHA]) },
      }),
    );
  }

  test("shows the KSE-100 index, movers and stock-only news", async ({ page }) => {
    await mockStocks(page);
    await page.goto("/stocks");

    await expect(page.getByRole("heading", { name: /Pakistan Stocks/ })).toBeVisible();

    // Index hero: level, signed % change and the closed-market badge.
    await expect(page.getByText("178,922.75")).toBeVisible();
    await expect(page.getByText(/-1\.36%/)).toBeVisible();
    await expect(page.getByText("Market closed")).toBeVisible();

    // Movers tables.
    await expect(page.getByText("Top gainers")).toBeVisible();
    await expect(page.getByText("SSGC")).toBeVisible();
    await expect(page.getByText("HCAR")).toBeVisible();

    // The feed is narrowed to stock stories: the stock article shows, the crime one doesn't.
    await expect(page.getByText(STOCK.title)).toBeVisible();
    await expect(page.getByText(ALPHA.title)).toHaveCount(0);
  });

  test("degrades gracefully when market data is missing", async ({ page }) => {
    await page.route("**/data/snapshot.json**", (route) =>
      route.fulfill({ json: { generatedAt: NOW, articles: [STOCK], stats: statsFor([STOCK]) } }),
    );
    await page.goto("/stocks");
    await expect(page.getByText(/Market data is temporarily unavailable/)).toBeVisible();
    // News still renders without market data.
    await expect(page.getByText(STOCK.title)).toBeVisible();
  });
});

test.describe("FIFA page", () => {
  test("shows fixtures, results and football news", async ({ page }) => {
    await page.route("**/data/snapshot.json**", (route) =>
      route.fulfill({
        json: { generatedAt: NOW, articles: [FOOTBALL, ALPHA], topics: { fifa: FIFA_DATA }, stats: statsFor([FOOTBALL, ALPHA]) },
      }),
    );
    await page.goto("/fifa");

    await expect(page.getByRole("heading", { name: /FIFA World Cup 2026/ })).toBeVisible();
    // Results + upcoming fixtures (target the section headings, not the blurb).
    await expect(page.getByRole("heading", { name: "Recent results" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Upcoming fixtures" })).toBeVisible();
    await expect(page.getByText("Netherlands")).toBeVisible();
    await expect(page.getByText("Ecuador")).toBeVisible();
    // Global topic: foreign football news shows; the unrelated crime story doesn't.
    await expect(page.getByText(FOOTBALL.title)).toBeVisible();
    await expect(page.getByText(ALPHA.title)).toHaveCount(0);
  });

  test("degrades gracefully when fixtures are missing", async ({ page }) => {
    await page.route("**/data/snapshot.json**", (route) =>
      route.fulfill({ json: { generatedAt: NOW, articles: [FOOTBALL], stats: statsFor([FOOTBALL]) } }),
    );
    await page.goto("/fifa");
    await expect(page.getByText(/Fixtures & results are temporarily unavailable/)).toBeVisible();
    await expect(page.getByText(FOOTBALL.title)).toBeVisible();
  });
});

test.describe("City detail page", () => {
  test("lists articles for the city", async ({ page }) => {
    const article = makeArticle({ id: "cp1", title: "Karachi city page test headline" });
    await mockApi(page, { backlog: [article] });
    await page.goto("/city/karachi");
    await expect(page.getByRole("heading", { name: "Karachi" })).toBeVisible();
    await expect(page.getByText(article.title)).toBeVisible();
  });
});

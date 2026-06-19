import { test, expect, type Page } from "@playwright/test";
import type { Article } from "../src/lib/types";

// ── Deterministic fixtures ──────────────────────────────────────────────────
// "now" so that the "Today" date preset always includes these in the browser's
// local timezone, regardless of where the tests run.
const NOW = new Date().toISOString();
const DAY_MS = 86_400_000;
const isoAt = (deltaMs: number) => new Date(Date.parse(NOW) + deltaMs).toISOString();

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
const GAMMA = makeArticle({ id: "gamma", title: "ZZ Live streamed headline gamma", categories: ["crime"] });
const OLD = makeArticle({
  id: "old",
  title: "ZZ Old archived headline delta",
  publishedAt: "2020-01-01T00:00:00.000Z",
  fetchedAt: "2020-01-01T00:00:00.000Z",
  categories: ["politics"],
});

const backlog = [ALPHA, BETA];

function sseBody(...articles: Article[]): string {
  const events = [`event: ready`, `data: {"ok":true}`, ``];
  for (const a of articles) {
    events.push(`event: article`, `data: ${JSON.stringify(a)}`, ``);
  }
  return events.join("\n") + "\n";
}

async function mockApi(page: Page, opts: { stream?: Article[]; backlog?: Article[] } = {}) {
  const list = opts.backlog ?? backlog;
  await page.route("**/api/articles**", async (route) => {
    await route.fulfill({
      json: { articles: list, counts: { karachi: 2, lahore: 5, islamabad: 9 }, count: list.length },
    });
  });
  await page.route("**/api/stream**", async (route) => {
    await route.fulfill({
      status: 200,
      headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache" },
      body: sseBody(...(opts.stream ?? [])),
    });
  });
  await page.route("**/api/stats**", async (route) => {
    await route.fulfill({
      json: {
        total: list.length,
        byCity: { karachi: 2, lahore: 5 },
        byCategory: { crime: 1, sports: 1 },
        bySource: { Dawn: 1, "Geo News": 1 },
        perHour: Array.from({ length: 24 }, (_, i) => i % 4),
        topKeywords: [
          { word: "karachi", count: 5 },
          { word: "flood", count: 3 },
        ],
      },
    });
  });
  await page.route("**/api/health**", async (route) => {
    await route.fulfill({
      json: {
        feeds: [
          { id: "dawn", outlet: "Dawn", name: "Latest", url: "x", ok: true, items: 30, lastFetch: NOW },
        ],
        ok: 1,
        total: 1,
      },
    });
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────
test.describe("Dashboard UI", () => {
  test("renders the shell, default Karachi scope, the map and the backlog", async ({ page }) => {
    await mockApi(page);
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /PAK/ })).toBeVisible();

    // Karachi is the default selected city chip.
    await expect(page.getByRole("button", { name: /^Karachi/ })).toBeVisible();

    // Backlog articles render.
    await expect(page.getByText(ALPHA.title)).toBeVisible();
    await expect(page.getByText(BETA.title)).toBeVisible();

    // The Pakistan map renders with city nodes.
    const svg = page.locator("svg[aria-label*='Pakistan']");
    await expect(svg).toBeVisible();
    expect(await svg.locator("circle").count()).toBeGreaterThan(5);
  });

  test("a live SSE article is prepended to the feed", async ({ page }) => {
    await mockApi(page, { stream: [GAMMA] });
    await page.goto("/");
    await expect(page.getByText(GAMMA.title)).toBeVisible({ timeout: 10_000 });
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

  test("selecting another city updates the live scope label", async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await page.getByRole("button", { name: /^Lahore/ }).click();
    // Scope label in the map panel reflects the new selection.
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

  test("clicking a preset fills the From and To date inputs", async ({ page }) => {
    await mockApi(page);
    await page.goto("/");

    const from = page.getByLabel("From date", { exact: true });
    const to = page.getByLabel("To date", { exact: true });

    // "All" (default) leaves the boxes empty.
    await expect(from).toHaveValue("");
    await expect(to).toHaveValue("");

    // A preset fills both boxes (From = start of window, To = today).
    await page.getByRole("button", { name: "24h", exact: true }).click();
    await expect(from).not.toHaveValue("");
    await expect(to).not.toHaveValue("");
  });

  test("pause toggles the live feed state", async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await page.getByTitle("Pause live feed").click();
    await expect(page.getByText("Paused")).toBeVisible();
  });

  test("flushing the 'new' pill keeps the feed newest-first", async ({ page }) => {
    const A = makeArticle({ id: "ord-a", title: "Provincial assembly debate concludes", publishedAt: isoAt(-2 * DAY_MS) });
    const B = makeArticle({ id: "ord-b", title: "Cricket squad announced for tour", publishedAt: isoAt(0) });
    const C = makeArticle({ id: "ord-c", title: "Rupee gains versus dollar markets", publishedAt: isoAt(-5 * DAY_MS) });

    await page.route("**/api/articles**", (route) =>
      route.fulfill({ json: { articles: [A], counts: { karachi: 1 }, count: 1 } }),
    );
    await page.route("**/api/stats**", (route) =>
      route.fulfill({ json: { total: 1, byCity: {}, byCategory: {}, bySource: {}, perHour: [], topKeywords: [], topEntities: [], spikes: [] } }),
    );
    // Delay the stream so we can pause before B and C arrive (they then buffer).
    await page.route("**/api/stream**", async (route) => {
      await new Promise((res) => setTimeout(res, 1200));
      await route.fulfill({
        status: 200,
        headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache" },
        body: sseBody(B, C),
      });
    });

    await page.goto("/");
    await expect(page.getByText(A.title)).toBeVisible();

    await page.getByTitle("Pause live feed").click();
    const pill = page.getByText(/new article/);
    await expect(pill).toBeVisible();
    await pill.click();

    // After flushing, the feed must be newest-first: B (now), A (-2d), C (-5d).
    const titles = (await page.locator("a.clamp-3").allTextContents()).map((t) => t.trim());
    expect(titles).toEqual([B.title, A.title, C.title]);
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
    await expect(page.getByText(/Feed health/)).toBeVisible();

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

test.describe("City detail page", () => {
  test("lists articles for the city", async ({ page }) => {
    const article = makeArticle({ id: "cp1", title: "Karachi city page test headline" });
    await page.route("**/api/articles**", (route) =>
      route.fulfill({ json: { articles: [article], counts: {}, count: 1 } }),
    );
    await page.route("**/api/stats**", (route) =>
      route.fulfill({
        json: {
          total: 1,
          byCity: { karachi: 1 },
          byCategory: { crime: 1 },
          bySource: { Dawn: 1 },
          perHour: Array.from({ length: 24 }, () => 1),
          topKeywords: [],
        },
      }),
    );
    await page.goto("/city/karachi");
    await expect(page.getByRole("heading", { name: "Karachi" })).toBeVisible();
    await expect(page.getByText(article.title)).toBeVisible();
  });
});

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

test.describe("City detail page", () => {
  test("lists articles for the city", async ({ page }) => {
    const article = makeArticle({ id: "cp1", title: "Karachi city page test headline" });
    await mockApi(page, { backlog: [article] });
    await page.goto("/city/karachi");
    await expect(page.getByRole("heading", { name: "Karachi" })).toBeVisible();
    await expect(page.getByText(article.title)).toBeVisible();
  });
});

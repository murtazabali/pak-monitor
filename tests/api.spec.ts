import { test, expect } from "@playwright/test";

/**
 * The app is a static export with no API. Data is a prebuilt snapshot served as
 * a static file, so we validate that file's shape rather than any live endpoint.
 */
test.describe("Static snapshot", () => {
  test("/data/snapshot.json is served and has the expected shape", async ({ request }) => {
    const res = await request.get("/data/snapshot.json");
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(Array.isArray(body.articles)).toBe(true);
    expect(typeof body.counts).toBe("object");
    expect(typeof body.stats).toBe("object");

    // Every article has the required shape.
    for (const a of body.articles.slice(0, 5)) {
      expect(typeof a.id).toBe("string");
      expect(typeof a.title).toBe("string");
      expect(typeof a.link).toBe("string");
      expect(Array.isArray(a.cities)).toBe(true);
      expect(Array.isArray(a.categories)).toBe(true);
    }
  });
});

import { test, expect } from "@playwright/test";

/**
 * These run against the REAL running stack (live poller + RSS feeds), so they
 * assert on structure and invariants rather than specific articles — the data
 * set changes constantly and may even be empty when offline.
 */
test.describe("API: backlog", () => {
  test("GET /api/articles returns an articles array and counts object", async ({ request }) => {
    const res = await request.get("/api/articles?limit=5");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.articles)).toBe(true);
    expect(typeof body.counts).toBe("object");
    // Every article has the required shape.
    for (const a of body.articles) {
      expect(typeof a.id).toBe("string");
      expect(typeof a.title).toBe("string");
      expect(typeof a.link).toBe("string");
      expect(Array.isArray(a.cities)).toBe(true);
      expect(Array.isArray(a.categories)).toBe(true);
    }
  });

  test("city filter only returns articles tagged to that city", async ({ request }) => {
    const res = await request.get("/api/articles?cities=karachi&limit=30");
    expect(res.ok()).toBeTruthy();
    const { articles } = await res.json();
    for (const a of articles) {
      expect(a.cities).toContain("karachi");
    }
  });

  test("limit is respected", async ({ request }) => {
    const res = await request.get("/api/articles?limit=3");
    const { articles } = await res.json();
    expect(articles.length).toBeLessThanOrEqual(3);
  });

  test("a future 'from' date returns no articles", async ({ request }) => {
    const res = await request.get("/api/articles?from=2999-01-01T00:00:00.000Z&limit=50");
    expect(res.ok()).toBeTruthy();
    const { articles } = await res.json();
    expect(articles.length).toBe(0);
  });

  test("date filter only returns articles within range", async ({ request }) => {
    const from = "2000-01-01T00:00:00.000Z";
    const to = new Date().toISOString();
    const res = await request.get(`/api/articles?from=${from}&to=${to}&limit=30`);
    const { articles } = await res.json();
    for (const a of articles) {
      const t = Date.parse(a.publishedAt);
      expect(t).toBeGreaterThanOrEqual(Date.parse(from));
      expect(t).toBeLessThanOrEqual(Date.parse(to));
    }
  });
});

test.describe("API: SSE stream", () => {
  test("GET /api/stream emits a ready event with text/event-stream", async ({ baseURL }) => {
    const controller = new AbortController();
    const res = await fetch(`${baseURL}/api/stream?cities=karachi`, {
      signal: controller.signal,
      headers: { Accept: "text/event-stream" },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type") ?? "").toContain("text/event-stream");

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      if (buffer.includes("event: ready")) break;
    }
    controller.abort();

    expect(buffer).toContain("event: ready");
  });
});

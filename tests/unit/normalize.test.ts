import { describe, it, expect } from "vitest";
import { normalize } from "@/lib/normalize";
import type { FeedSource } from "@/lib/types";

const src: FeedSource = { id: "dawn-latest", name: "Latest", outlet: "Dawn", url: "x", enabled: true };

describe("normalize", () => {
  it("returns null without a title or link", () => {
    expect(normalize({ title: "x" }, src)).toBeNull();
    expect(normalize({ link: "x" }, src)).toBeNull();
  });

  it("builds an article with a stable hashed id", () => {
    const a = normalize({ title: "Hello", link: "http://e.com/1", guid: "g1", isoDate: "2026-06-19T10:00:00Z" }, src)!;
    expect(a.title).toBe("Hello");
    expect(a.source).toBe("Dawn");
    expect(a.id).toMatch(/^[a-f0-9]{16}$/);
    expect(a.publishedAt).toBe("2026-06-19T10:00:00.000Z");
  });

  it("falls back to fetch time when the date is missing", () => {
    const a = normalize({ title: "No date", link: "http://e.com/2" }, src)!;
    expect(a.publishedAt).toBe(a.fetchedAt);
  });

  it("extracts an image from media:content", () => {
    const a = normalize(
      { title: "Img", link: "http://e.com/3", media: [{ $: { url: "https://img/x.jpg", medium: "image" } }] },
      src,
    )!;
    expect(a.imageUrl).toBe("https://img/x.jpg");
  });

  it("parses the real outlet from a Google News title", () => {
    const g: FeedSource = { id: "gnews-karachi", name: "Karachi", outlet: "Google News", url: "x", enabled: true };
    const a = normalize({ title: "Big story - The Express Tribune", link: "http://e.com/4" }, g)!;
    expect(a.title).toBe("Big story");
    expect(a.source).toBe("The Express Tribune");
  });
});

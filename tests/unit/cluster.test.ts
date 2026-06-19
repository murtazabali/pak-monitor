import { describe, it, expect } from "vitest";
import { clusterArticles } from "@/lib/cluster";
import type { Article } from "@/lib/types";

function mk(id: string, title: string, source: string): Article {
  return {
    id,
    title,
    link: "https://example.com/" + id,
    source,
    sourceId: "s",
    summary: "",
    imageUrl: null,
    publishedAt: "2026-06-20T00:00:00.000Z",
    fetchedAt: "2026-06-20T00:00:00.000Z",
    cities: [],
    categories: [],
  };
}

describe("clusterArticles", () => {
  it("groups identical headlines from different outlets", () => {
    const t = "Flooding hits Karachi after record monsoon rain";
    const clusters = clusterArticles([mk("1", t, "Dawn"), mk("2", t, "Geo News")]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].sources.sort()).toEqual(["Dawn", "Geo News"]);
    expect(clusters[0].articles).toHaveLength(2);
  });

  it("keeps unrelated headlines separate", () => {
    const clusters = clusterArticles([
      mk("1", "Provincial budget passes assembly", "Dawn"),
      mk("2", "Cricket team wins overseas series", "Geo News"),
    ]);
    expect(clusters).toHaveLength(2);
  });
});

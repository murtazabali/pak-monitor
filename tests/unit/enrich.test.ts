import { describe, it, expect } from "vitest";
import { isLocalArticle } from "@/lib/relevance";
import { sentimentOf } from "@/lib/sentiment";
import { extractEntities } from "@/lib/entities";

describe("isLocalArticle", () => {
  it("is true for a Pakistani outlet", () => {
    expect(isLocalArticle({ source: "Dawn", title: "anything", summary: "" })).toBe(true);
  });
  it("is true when it mentions Pakistan", () => {
    expect(isLocalArticle({ source: "Times of India", title: "Pakistan border tension", summary: "" })).toBe(true);
  });
  it("is false for a foreign outlet with no mention", () => {
    expect(isLocalArticle({ source: "Times of India", title: "Hyderabad rains", summary: "local news" })).toBe(false);
  });
});

describe("sentimentOf", () => {
  it("detects positive tone", () => expect(sentimentOf("Team wins record victory")).toBe("pos"));
  it("detects negative tone", () => expect(sentimentOf("Blast kills several people")).toBe("neg"));
  it("returns neutral otherwise", () => expect(sentimentOf("Meeting held in the city")).toBe("neu"));
});

describe("extractEntities", () => {
  it("surfaces repeated proper nouns", () => {
    const ents = extractEntities(["Imran Khan speaks today", "Imran Khan returns home"]);
    expect(ents.find((e) => e.name === "Imran Khan")?.count).toBe(2);
  });
  it("ignores single mentions and bare city names", () => {
    const ents = extractEntities(["Karachi update", "Karachi news"]);
    expect(ents.find((e) => e.name.toLowerCase() === "karachi")).toBeUndefined();
  });
});

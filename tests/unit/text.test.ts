import { describe, it, expect } from "vitest";
import { tokenize, wholeWordRegex, stripHtml, truncate } from "@/lib/text";

describe("tokenize", () => {
  it("drops stopwords and short tokens", () => {
    expect(tokenize("The new Karachi port and a big ship")).toEqual(["karachi", "port", "big", "ship"]);
  });
  it("keeps Unicode (Urdu) words", () => {
    expect(tokenize("کراچی بارش")).toContain("کراچی");
  });
});

describe("wholeWordRegex", () => {
  it("matches whole words", () => {
    expect(wholeWordRegex("multan").test("multan city")).toBe(true);
  });
  it("does not match substrings", () => {
    expect(wholeWordRegex("multan").test("multani halwa")).toBe(false);
  });
});

describe("stripHtml / truncate", () => {
  it("strips tags and decodes entities", () => {
    expect(stripHtml("<p>Hello &amp; bye</p>")).toBe("Hello & bye");
  });
  it("truncates with an ellipsis", () => {
    expect(truncate("abcdef", 4)).toBe("abc…");
  });
});

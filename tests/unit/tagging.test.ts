import { describe, it, expect } from "vitest";
import { tagCities } from "@/lib/cityTagger";
import { classify } from "@/lib/classifier";

describe("tagCities", () => {
  it("matches a city name", () => expect(tagCities("Protest in Karachi")).toContain("karachi"));
  it("matches a locality", () => expect(tagCities("Fire reported in Clifton")).toContain("karachi"));
  it("avoids substring false positives", () => expect(tagCities("Multani halwa is famous")).not.toContain("multan"));
  it("matches an Urdu city name", () => expect(tagCities("کراچی میں بارش")).toContain("karachi"));
});

describe("classify", () => {
  it("detects crime", () => expect(classify("Two killed in firing")).toContain("crime"));
  it("detects weather", () => expect(classify("Heavy monsoon flooding")).toContain("weather"));
  it("detects business", () => expect(classify("Stocks rise as rupee gains")).toContain("business"));
  it("detects stocks (PSX/equities)", () => {
    const cats = classify("KSE-100 surges as PSX hits record high");
    expect(cats).toContain("stocks");
  });
  it("does not tag generic business news as stocks", () => {
    expect(classify("Government raises petrol prices and taxes")).not.toContain("stocks");
  });
  it("detects FIFA (football/World Cup)", () => {
    expect(classify("Messi shines as Argentina win World Cup opener")).toContain("fifa");
  });
  it("falls back to general", () => expect(classify("a quiet announcement")).toEqual(["general"]));
});

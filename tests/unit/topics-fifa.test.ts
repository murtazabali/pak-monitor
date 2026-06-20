import { describe, it, expect } from "vitest";
import { parseScoreboard } from "@/lib/topics/fifa";

// Mirrors the shape of ESPN's soccer scoreboard payload.
const event = (id: string, state: string, date: string, h: [string, string, number | null], a: [string, string, number | null]) => ({
  id,
  date,
  season: { slug: "group-stage", year: 2026 },
  status: { type: { state, shortDetail: state === "post" ? "FT" : state === "in" ? "55'" : "" } },
  competitions: [
    {
      competitors: [
        { homeAway: "home", score: h[2] == null ? "" : String(h[2]), winner: false, team: { displayName: h[0], abbreviation: h[1], logo: "x.png" } },
        { homeAway: "away", score: a[2] == null ? "" : String(a[2]), winner: false, team: { displayName: a[0], abbreviation: a[1], logo: "y.png" } },
      ],
    },
  ],
});

const SCOREBOARD = {
  leagues: [{ name: "FIFA World Cup" }],
  season: { year: 2026 },
  events: [
    event("e1", "post", "2026-06-19T17:00Z", ["Netherlands", "NED", 5], ["Sweden", "SWE", 1]),
    event("e2", "post", "2026-06-20T17:00Z", ["Germany", "GER", 2], ["Ivory Coast", "CIV", 0]),
    event("e3", "in", "2026-06-21T20:00Z", ["Brazil", "BRA", 1], ["Spain", "ESP", 1]),
    event("e4", "pre", "2026-06-22T18:00Z", ["Ecuador", "ECU", null], ["Curacao", "CUW", null]),
    event("e5", "pre", "2026-06-23T18:00Z", ["England", "ENG", null], ["France", "FRA", null]),
  ],
};

describe("parseScoreboard", () => {
  const r = parseScoreboard(SCOREBOARD);

  it("reads league + season", () => {
    expect(r.league).toBe("FIFA World Cup");
    expect(r.season).toBe(2026);
  });

  it("buckets matches by state", () => {
    expect(r.live.map((m) => m.id)).toEqual(["e3"]);
    expect(r.recent.map((m) => m.id)).toEqual(["e2", "e1"]); // newest first
    expect(r.upcoming.map((m) => m.id)).toEqual(["e4", "e5"]); // soonest first
  });

  it("parses scores, teams and a tidy round label", () => {
    const ned = r.recent.find((m) => m.id === "e1")!;
    expect(ned.home.abbr).toBe("NED");
    expect(ned.home.score).toBe(5);
    expect(ned.away.score).toBe(1);
    expect(ned.round).toBe("Group Stage");
  });

  it("leaves upcoming scores null", () => {
    expect(r.upcoming[0].home.score).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { parseIndex, parseMovers } from "@/lib/topics/stocks";

const DAY = 86_400;
// A day-aligned "today" (matches how parseIndex buckets timestamps by day).
const TODAY = 20_623 * DAY;

describe("parseIndex", () => {
  it("measures change against the prior session when today has already closed", () => {
    const int = { status: 1, data: [[TODAY + 3600, 178_922.75, 6605]] };
    const eod = {
      status: 1,
      data: [
        [TODAY, 178_922.75, 458_025_154], // today's close
        [TODAY - DAY, 181_398.21, 445_724_711], // yesterday's close
        [TODAY - 2 * DAY, 180_511.02, 526_919_075],
      ],
    };
    const q = parseIndex(int, eod)!;
    expect(q.symbol).toBe("KSE100");
    expect(q.value).toBeCloseTo(178_922.75, 2);
    expect(q.change).toBeCloseTo(178_922.75 - 181_398.21, 2);
    expect(q.changePct).toBeLessThan(0);
  });

  it("uses yesterday's close while a live session is in progress (no EOD for today yet)", () => {
    const int = { status: 1, data: [[TODAY + 7200, 182_000, 10]] };
    const eod = {
      status: 1,
      data: [
        [TODAY - DAY, 181_398.21, 445_724_711], // yesterday's close (latest EOD)
        [TODAY - 2 * DAY, 180_511.02, 526_919_075],
      ],
    };
    const q = parseIndex(int, eod)!;
    expect(q.value).toBe(182_000);
    expect(q.change).toBeCloseTo(182_000 - 181_398.21, 2);
    expect(q.changePct).toBeGreaterThan(0);
  });

  it("returns null when there is no data at all", () => {
    expect(parseIndex({ data: [] }, { data: [] })).toBeNull();
  });
});

// Mirrors the real /market-watch markup: data-order numeric cells in the order
// LDCP, OPEN, HIGH, LOW, CURRENT, CHANGE, CHANGE%, VOLUME, with the sign carried
// by a change__text--pos / --neg class.
const row = (
  sym: string,
  name: string,
  indices: string,
  cur: number,
  pct: number,
  vol: number,
) => {
  const cls = pct < 0 ? "change__text--neg" : "change__text--pos";
  return `<tr><td data-search="${sym}" data-order="${sym}"><a class="tbl__symbol" href="/company/${sym}" data-title="${name}"><strong>${sym}</strong></a></td><td>0821</td><td>${indices}</td><td class="right" data-order="${cur - 1}">x</td><td class="right" data-order="${cur - 1}">x</td><td class="right" data-order="${cur + 1}">x</td><td class="right" data-order="${cur - 2}">x</td><td class="right" data-order="${cur}">x</td><td class="right ${cls}" data-order="${Math.abs(cur * pct / 100)}">x</td><td class="right ${cls}" data-order="${Math.abs(pct)}">x</td><td class="right" data-order="${vol}">x</td></tr>`;
};

const HTML = `<table><thead><tr><th>SYMBOL</th></tr></thead><tbody>${[
  row("SSGC", "Sui Southern Gas Company Limited", "ALLSHR,KMI30,KSE100,KSE100PR,KSE30", 31.32, 2.25, 87_347_852),
  row("LUCK", "Lucky Cement Limited", "ALLSHR,KSE100,KSE30", 1455.5, -2.97, 1_200_000),
  row("KOSM", "Kohinoor Spinning Mills Limited", "ALLSHR", 5.4, 8.0, 50_000),
].join("")}</tbody></table>`;

describe("parseMovers", () => {
  const { gainers, losers } = parseMovers(HTML);

  it("ranks KSE-100 gainers", () => {
    expect(gainers.map((m) => m.symbol)).toEqual(["SSGC"]);
    expect(gainers[0].changePct).toBeCloseTo(2.25, 2);
    expect(gainers[0].price).toBeCloseTo(31.32, 2);
    expect(gainers[0].name).toBe("Sui Southern Gas Company Limited");
  });

  it("ranks KSE-100 losers with a negative percentage", () => {
    expect(losers.map((m) => m.symbol)).toEqual(["LUCK"]);
    expect(losers[0].changePct).toBeCloseTo(-2.97, 2);
  });

  it("excludes non-KSE-100 constituents (e.g. an ALLSHR-only stock)", () => {
    const all = [...gainers, ...losers].map((m) => m.symbol);
    expect(all).not.toContain("KOSM");
  });
});

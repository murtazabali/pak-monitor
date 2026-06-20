import type { FifaGoal, FifaMatch, FifaSnapshot, FifaTeam } from "@/lib/types";

/**
 * FIFA topic provider — FIFA World Cup fixtures & results from ESPN's public
 * soccer scoreboard JSON (no API key). Run off-browser by the snapshot cron via
 * the topic registry; embedded under `topics.fifa` in snapshot.json. Returns
 * `null` on failure so the rest of the snapshot still publishes.
 */

const LEAGUE = "fifa.world"; // ESPN slug for the men's FIFA World Cup
const BASE = `https://site.api.espn.com/apis/site/v2/sports/soccer/${LEAGUE}/scoreboard`;
const TIMEOUT_MS = Number(process.env.FIFA_TIMEOUT_MS) || 15_000;
const RECENT_N = 8;
const UPCOMING_N = 10;
const USER_AGENT =
  "Mozilla/5.0 (compatible; pak-monitor/1.0; +https://github.com/pak-monitor)";

const DAY_MS = 86_400_000;

interface EspnCompetitor {
  homeAway?: string;
  score?: string;
  winner?: boolean;
  team?: { id?: string; displayName?: string; abbreviation?: string; logo?: string };
}
interface EspnDetail {
  scoringPlay?: boolean;
  ownGoal?: boolean;
  penaltyKick?: boolean;
  team?: { id?: string };
  clock?: { displayValue?: string };
  athletesInvolved?: Array<{ displayName?: string; shortName?: string }>;
}
interface EspnEvent {
  id?: string;
  date?: string;
  season?: { slug?: string; year?: number };
  status?: { type?: { state?: string; shortDetail?: string } };
  competitions?: Array<{
    notes?: Array<{ headline?: string }>;
    competitors?: EspnCompetitor[];
    details?: EspnDetail[];
  }>;
}
interface EspnScoreboard {
  leagues?: Array<{ name?: string }>;
  season?: { year?: number };
  events?: EspnEvent[];
}

function prettyRound(slug: string | undefined, note: string | undefined): string {
  if (note) return note;
  if (!slug) return "";
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Goalscorers from a competition's scoring plays, grouped by team id. */
function goalsByTeam(details: EspnDetail[] | undefined): Record<string, FifaGoal[]> {
  const out: Record<string, FifaGoal[]> = {};
  for (const d of details ?? []) {
    if (!d.scoringPlay) continue;
    const teamId = d.team?.id;
    const player = d.athletesInvolved?.[0]?.shortName || d.athletesInvolved?.[0]?.displayName;
    if (!teamId || !player) continue;
    const goal: FifaGoal = {
      player,
      minute: d.clock?.displayValue ?? "",
      ...(d.ownGoal ? { note: "OG" } : d.penaltyKick ? { note: "P" } : {}),
    };
    (out[teamId] ??= []).push(goal);
  }
  return out;
}

function toTeam(c: EspnCompetitor | undefined, goals: FifaGoal[]): FifaTeam {
  return {
    name: c?.team?.displayName ?? "TBD",
    abbr: c?.team?.abbreviation ?? "—",
    logo: c?.team?.logo ?? null,
    score: c?.score != null && c.score !== "" ? Number(c.score) : null,
    winner: !!c?.winner,
    goals,
  };
}

function toMatch(e: EspnEvent): FifaMatch | null {
  const comp = e.competitions?.[0];
  const cs = comp?.competitors ?? [];
  if (cs.length < 2 || !e.id) return null;
  const home = cs.find((c) => c.homeAway === "home") ?? cs[0];
  const away = cs.find((c) => c.homeAway === "away") ?? cs[1];
  const rawState = e.status?.type?.state;
  const state: FifaMatch["state"] = rawState === "in" ? "in" : rawState === "post" ? "post" : "pre";
  let date = e.date ?? "";
  const ms = Date.parse(date);
  if (!Number.isNaN(ms)) date = new Date(ms).toISOString();
  const goals = goalsByTeam(comp?.details);
  return {
    id: e.id,
    date,
    state,
    status: e.status?.type?.shortDetail ?? "",
    round: prettyRound(e.season?.slug, comp?.notes?.[0]?.headline),
    home: toTeam(home, goals[home.team?.id ?? ""] ?? []),
    away: toTeam(away, goals[away.team?.id ?? ""] ?? []),
  };
}

/**
 * Split an ESPN scoreboard payload into live / recent / upcoming matches. Pure
 * so it can be unit-tested against a captured fixture.
 */
export function parseScoreboard(json: EspnScoreboard): Omit<FifaSnapshot, "asOf"> {
  const matches = (json.events ?? []).map(toMatch).filter((m): m is FifaMatch => m !== null);
  const byDateAsc = (a: FifaMatch, b: FifaMatch) => Date.parse(a.date) - Date.parse(b.date);

  const live = matches.filter((m) => m.state === "in").sort(byDateAsc);
  const recent = matches
    .filter((m) => m.state === "post")
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, RECENT_N);
  const upcoming = matches.filter((m) => m.state === "pre").sort(byDateAsc).slice(0, UPCOMING_N);

  return {
    league: json.leagues?.[0]?.name ?? "FIFA World Cup",
    season: json.season?.year ?? new Date().getFullYear(),
    live,
    recent,
    upcoming,
  };
}

function yyyymmdd(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10).replace(/-/g, "");
}

export async function getData(): Promise<FifaSnapshot | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    // A rolling window: recent results (back ~2 weeks) + all upcoming fixtures
    // (forward ~7 weeks, covering the rest of the tournament).
    const now = Date.now();
    const dates = `${yyyymmdd(now - 14 * DAY_MS)}-${yyyymmdd(now + 49 * DAY_MS)}`;
    const res = await fetch(`${BASE}?dates=${dates}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as EspnScoreboard;
    const parsed = parseScoreboard(json);
    if (!parsed.live.length && !parsed.recent.length && !parsed.upcoming.length) {
      console.warn("[topics:fifa] no matches in window — skipping");
      return null;
    }
    return { ...parsed, asOf: new Date(now).toISOString() };
  } catch (err) {
    console.warn("[topics:fifa] fetch failed:", err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

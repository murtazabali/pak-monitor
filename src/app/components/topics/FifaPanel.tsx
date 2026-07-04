"use client";

import { useEffect, useMemo, useState } from "react";
import type { FifaGoal, FifaMatch, FifaSnapshot } from "@/lib/types";
import { parseScoreboard, scoreboardUrl } from "@/lib/topics/fifa";

function kickoff(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  return new Date(ms).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Group goals by scorer → "B. Brobbey 5', 17'" (penalties/own-goals marked). */
function groupScorers(goals: FifaGoal[]): string[] {
  const order: string[] = [];
  const mins = new Map<string, string[]>();
  for (const g of goals) {
    const min = g.note ? `${g.minute} (${g.note})` : g.minute;
    if (!mins.has(g.player)) {
      mins.set(g.player, []);
      order.push(g.player);
    }
    mins.get(g.player)!.push(min);
  }
  return order.map((p) => `${p} ${mins.get(p)!.join(", ")}`);
}

function TeamSide({ name, abbr, logo, align }: { name: string; abbr: string; logo: string | null; align: "left" | "right" }) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {logo ? <img src={logo} alt="" width={20} height={20} className="h-5 w-5 shrink-0 object-contain" /> : null}
      <span className="truncate text-sm text-slate-200" title={name}>
        <span className="sm:hidden">{abbr}</span>
        <span className="hidden sm:inline">{name}</span>
      </span>
    </div>
  );
}

function MatchRow({ m }: { m: FifaMatch }) {
  const live = m.state === "in";
  const done = m.state === "post";
  const scoreText = m.home.score != null && m.away.score != null ? `${m.home.score} – ${m.away.score}` : "v";
  const homeGoals = groupScorers(m.home.goals ?? []);
  const awayGoals = groupScorers(m.away.goals ?? []);
  const hasGoals = homeGoals.length > 0 || awayGoals.length > 0;
  return (
    <div className="py-2">
      <div className="flex items-center gap-3">
        <TeamSide {...m.home} align="left" />
        <div className="flex w-36 shrink-0 flex-col items-center">
          <span
            className={[
              "font-mono tabular-nums",
              done || live ? "text-base font-semibold text-slate-100" : "text-xs text-muted",
            ].join(" ")}
          >
            {m.state === "pre" ? "vs" : scoreText}
          </span>
          <span className={`mt-0.5 whitespace-nowrap font-mono text-[10px] ${live ? "text-signal-live" : "text-muted"}`}>
            {live ? `● ${m.status || "LIVE"}` : m.state === "pre" ? kickoff(m.date) : m.status || "FT"}
          </span>
        </div>
        <TeamSide {...m.away} align="right" />
      </div>
      {hasGoals && (
        <div className="mt-1 flex items-start gap-3 text-[10px] leading-snug text-muted">
          <div className="min-w-0 flex-1 space-y-0.5">
            {homeGoals.map((s, i) => (
              <div key={i} className="truncate" title={s}>⚽ {s}</div>
            ))}
          </div>
          <div className="w-36 shrink-0" />
          <div className="min-w-0 flex-1 space-y-0.5 text-right">
            {awayGoals.map((s, i) => (
              <div key={i} className="truncate" title={s}>{s} ⚽</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, accent, matches, empty }: { title: string; accent: string; matches: FifaMatch[]; empty: string }) {
  return (
    <div className="min-w-0 flex-1 rounded-lg border border-edge/70 bg-base-850/50 p-3">
      <h3 className="mb-1 font-mono text-[11px] uppercase tracking-widest" style={{ color: accent }}>
        {title}
      </h3>
      {matches.length === 0 ? (
        <p className="py-2 text-xs text-muted">{empty}</p>
      ) : (
        <div className="divide-y divide-edge/40">
          {matches.map((m) => (
            <MatchRow key={m.id} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * FIFA panel: live / recent results / upcoming fixtures, rendered from the
 * topic's snapshot data. Graceful placeholder when missing.
 */
export default function FifaPanel({ data }: { data: unknown }) {
  const snapshot = (data ?? null) as FifaSnapshot | null;
  // Live overlay polled straight from ESPN during match windows.
  const [live, setLive] = useState<FifaSnapshot | null>(null);

  // Are we around match time? A live match, a kickoff within the next ~15 min,
  // or one that kicked off in the last ~3h (still settling). Derived from the
  // snapshot baseline — NOT our own poll result — so the effect below doesn't
  // restart on every successful poll.
  const inMatchWindow = useMemo(() => {
    if (!snapshot) return false;
    if (snapshot.live.length > 0) return true;
    const now = Date.now();
    return [...snapshot.upcoming, ...snapshot.recent].some((m) => {
      const t = Date.parse(m.date);
      return Number.isFinite(t) && now >= t - 15 * 60_000 && now <= t + 3 * 60 * 60_000;
    });
  }, [snapshot]);

  // ESPN's scoreboard is CORS-open and cached ~9s, so the browser can poll it
  // directly — no backend. Poll every 30s only inside a match window; outside
  // one the 5-min snapshot is fresh enough and we never touch ESPN. Keeps the
  // last good data on error, and drops the overlay once the window ends.
  useEffect(() => {
    if (!inMatchWindow) {
      setLive(null);
      return;
    }
    let cancelled = false;
    // Responses can resolve out of order (latency jitter, ESPN's ~9s CDN cache):
    // an older poll landing after a newer one would clobber fresh scores with
    // stale data. Tag each request and never apply one older than the newest
    // response we've already processed.
    let issued = 0;
    let newestSeen = 0;
    const poll = async () => {
      const seq = ++issued;
      try {
        const res = await fetch(scoreboardUrl(), { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled || seq < newestSeen) return;
        newestSeen = seq;
        const parsed = parseScoreboard(json);
        if (parsed.live.length || parsed.recent.length || parsed.upcoming.length) {
          setLive({ ...parsed, asOf: new Date().toISOString() });
        }
      } catch {
        /* network blip — keep the last good data */
      }
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [inMatchWindow]);

  // Show whichever source is actually newer. The live poll is normally freshest,
  // but the snapshot baseline refreshes periodically (home page), so a stale
  // retained overlay must never outrank a fresher snapshot.
  const fifa =
    live && (!snapshot || Date.parse(snapshot.asOf) <= Date.parse(live.asOf))
      ? live
      : snapshot;

  if (!fifa) {
    return (
      <div className="rounded-xl border border-edge/70 bg-base-850/40 p-5 text-center text-sm text-muted">
        Fixtures & results are temporarily unavailable. They refresh with the next
        snapshot.
      </div>
    );
  }

  const livePolling = live !== null && fifa.live.length > 0;
  const asOfLabel = new Date(fifa.asOf).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2 rounded-xl border border-edge/70 bg-base-850/60 px-5 py-3">
        <p className="font-mono text-sm font-bold text-slate-100">
          {fifa.league} {fifa.season}
          {fifa.season === 2026 && (
            <span className="ml-1.5 font-normal" title="Hosts: Canada, Mexico & USA">
              🇨🇦 🇲🇽 🇺🇸
            </span>
          )}
        </p>
        <p className="font-mono text-[11px] text-muted">
          {livePolling && <span className="font-semibold text-signal-live">● LIVE · </span>}
          updated {asOfLabel}
        </p>
      </div>

      {fifa.live.length > 0 && (
        <Section title="● Live now" accent="#34d399" matches={fifa.live} empty="No live matches." />
      )}

      <div className="flex flex-col gap-3 lg:flex-row">
        <Section title="Recent results" accent="#a78bfa" matches={fifa.recent} empty="No recent results." />
        <Section title="Upcoming fixtures" accent="#38bdf8" matches={fifa.upcoming} empty="No upcoming fixtures." />
      </div>

      <p className="font-mono text-[10px] text-muted/70">
        Source: ESPN · live during matches · times shown in your local timezone.
      </p>
    </div>
  );
}

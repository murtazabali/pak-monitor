"use client";

import type { FifaGoal, FifaMatch, FifaSnapshot } from "@/lib/types";

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
  const fifa = (data ?? null) as FifaSnapshot | null;

  if (!fifa) {
    return (
      <div className="rounded-xl border border-edge/70 bg-base-850/40 p-5 text-center text-sm text-muted">
        Fixtures & results are temporarily unavailable. They refresh with the next
        snapshot.
      </div>
    );
  }

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
        <p className="font-mono text-[11px] text-muted">updated {asOfLabel}</p>
      </div>

      {fifa.live.length > 0 && (
        <Section title="● Live now" accent="#34d399" matches={fifa.live} empty="No live matches." />
      )}

      <div className="flex flex-col gap-3 lg:flex-row">
        <Section title="Recent results" accent="#a78bfa" matches={fifa.recent} empty="No recent results." />
        <Section title="Upcoming fixtures" accent="#38bdf8" matches={fifa.upcoming} empty="No upcoming fixtures." />
      </div>

      <p className="font-mono text-[10px] text-muted/70">
        Source: ESPN · times shown in your local timezone.
      </p>
    </div>
  );
}

"use client";

import type { MarketSnapshot, Mover } from "@/lib/types";

const num = (n: number, dp = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

const compactVol = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : `${n}`;

const UP = "#34d399";
const DOWN = "#f43f5e";

function signColor(n: number) {
  return n > 0 ? UP : n < 0 ? DOWN : "#7d8aa5";
}

function MoverRow({ m }: { m: Mover }) {
  const color = signColor(m.changePct);
  return (
    <div className="flex items-center gap-2 py-1 text-sm">
      <span className="w-16 shrink-0 truncate font-mono font-medium text-slate-200" title={m.name}>
        {m.symbol}
      </span>
      <span className="flex-1 text-right font-mono text-slate-300 tabular-nums">{num(m.price)}</span>
      <span className="w-20 text-right font-mono tabular-nums" style={{ color }}>
        {m.changePct > 0 ? "▲" : m.changePct < 0 ? "▼" : "—"} {num(Math.abs(m.changePct))}%
      </span>
      <span className="hidden w-16 text-right font-mono text-[11px] text-muted tabular-nums sm:inline">
        {compactVol(m.volume)}
      </span>
    </div>
  );
}

function MoverTable({ title, rows, accent }: { title: string; rows: Mover[]; accent: string }) {
  return (
    <div className="min-w-0 flex-1 rounded-lg border border-edge/70 bg-base-850/50 p-3">
      <h3 className="mb-1.5 font-mono text-[11px] uppercase tracking-widest" style={{ color: accent }}>
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="py-2 text-xs text-muted">No data.</p>
      ) : (
        <div className="divide-y divide-edge/40">
          {rows.map((m) => (
            <MoverRow key={m.symbol} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Stocks panel: KSE-100 hero + gainers/losers, rendered from the topic's
 * snapshot data. Renders a graceful placeholder when the data is missing.
 */
export default function StocksPanel({ data }: { data: unknown }) {
  const market = (data ?? null) as MarketSnapshot | null;

  if (!market) {
    return (
      <div className="rounded-xl border border-edge/70 bg-base-850/40 p-5 text-center text-sm text-muted">
        Market data is temporarily unavailable. The KSE-100 feed refreshes with the
        next snapshot.
      </div>
    );
  }

  const { index, gainers, losers, status, asOf } = market;
  const color = signColor(index.change);
  const asOfLabel = new Date(asOf).toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Index hero */}
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-edge/70 bg-base-850/60 p-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
            {index.label} · Pakistan Stock Exchange
          </p>
          <p className="mt-1 font-mono text-3xl font-bold text-slate-100 tabular-nums sm:text-4xl">
            {num(index.value)}
          </p>
          <p className="mt-1 font-mono text-sm tabular-nums" style={{ color }}>
            {index.change > 0 ? "▲" : index.change < 0 ? "▼" : "—"} {num(Math.abs(index.change))}{" "}
            ({index.changePct > 0 ? "+" : ""}
            {num(index.changePct)}%)
          </p>
        </div>
        <div className="text-right">
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px]",
              status === "open"
                ? "border-signal-live/40 bg-signal-live/10 text-signal-live"
                : "border-base-600 bg-base-800/60 text-muted",
            ].join(" ")}
          >
            <span className={`h-2 w-2 rounded-full ${status === "open" ? "bg-signal-live" : "bg-muted"}`} />
            {status === "open" ? "Market open" : "Market closed"}
          </span>
          <p className="mt-1.5 font-mono text-[11px] text-muted">as of {asOfLabel} PKT</p>
        </div>
      </div>

      {/* Movers */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <MoverTable title="▲ Top gainers" rows={gainers} accent={UP} />
        <MoverTable title="▼ Top losers" rows={losers} accent={DOWN} />
      </div>
      <p className="font-mono text-[10px] text-muted/70">
        Source: Pakistan Stock Exchange (dps.psx.com.pk) · KSE-100 constituents · delayed,
        for information only — not investment advice.
      </p>
    </div>
  );
}

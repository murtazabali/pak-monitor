"use client";

export interface DateRange {
  /** Active preset: "all" | "6h" | "24h" | "3d". */
  preset: string;
  /** Window length for rolling presets (ms). Null for "all". */
  durationMs: number | null;
  /** Explicit bounds (epoch ms) — reserved; not set by the current UI. */
  fromMs: number | null;
  toMs: number | null;
}

export const DEFAULT_RANGE: DateRange = { preset: "all", durationMs: null, fromMs: null, toMs: null };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

// Windows are sized to the data that actually exists: the snapshot ships the
// ~600 most-recent articles, which span only a few days (RSS feeds don't carry
// older items, and the store isn't persisted between cron runs). A custom
// From/To picker was dropped — over a ~3-day window the presets cover every
// useful slice, and arbitrary dates only invited empty (no-data) results.
const PRESETS: Array<{ key: string; label: string; make: () => DateRange }> = [
  { key: "6h", label: "6h", make: () => ({ preset: "6h", durationMs: 6 * HOUR, fromMs: null, toMs: null }) },
  { key: "24h", label: "24h", make: () => ({ preset: "24h", durationMs: DAY, fromMs: null, toMs: null }) },
  { key: "3d", label: "3 days", make: () => ({ preset: "3d", durationMs: 3 * DAY, fromMs: null, toMs: null }) },
  { key: "all", label: "All", make: () => ({ preset: "all", durationMs: null, fromMs: null, toMs: null }) },
];

export default function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Date</span>

      {PRESETS.map((p) => {
        const active = value.preset === p.key;
        return (
          <button
            key={p.key}
            onClick={() => onChange(p.make())}
            className={[
              "rounded-md border px-2 py-1 text-xs transition-colors",
              active
                ? "border-accent/60 bg-accent/15 text-accent"
                : "border-base-600 bg-base-800/50 text-slate-400 hover:bg-base-700/60",
            ].join(" ")}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

"use client";

export interface DateRange {
  /** Active preset: "all" | "6h" | "24h" | "3d" | "custom". */
  preset: string;
  /** Window length for rolling presets (ms). Null for "all"/"custom". */
  durationMs: number | null;
  /** Explicit bounds for "custom" (epoch ms), else null. */
  fromMs: number | null;
  toMs: number | null;
}

export const DEFAULT_RANGE: DateRange = { preset: "all", durationMs: null, fromMs: null, toMs: null };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

// Rolling presets are stored as a DURATION, not a fixed timestamp, so the window
// keeps advancing as the clock ticks (the dashboard passes a live `now`).
// Windows are sized to the data that actually exists: the snapshot ships the
// ~600 most-recent articles, which span only a few days (RSS feeds don't carry
// older items, and the store isn't persisted between cron runs). 7d/30d would
// always equal "All", so the presets stay within the real ~3-day window.
const PRESETS: Array<{ key: string; label: string; make: () => DateRange }> = [
  { key: "6h", label: "6h", make: () => ({ preset: "6h", durationMs: 6 * HOUR, fromMs: null, toMs: null }) },
  { key: "24h", label: "24h", make: () => ({ preset: "24h", durationMs: DAY, fromMs: null, toMs: null }) },
  { key: "3d", label: "3 days", make: () => ({ preset: "3d", durationMs: 3 * DAY, fromMs: null, toMs: null }) },
  { key: "all", label: "All", make: () => ({ preset: "all", durationMs: null, fromMs: null, toMs: null }) },
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local-day string (yyyy-mm-dd) for a `<input type="date">`. */
export function msToDay(ms: number | null): string {
  if (ms == null) return "";
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** A local calendar day → epoch ms at its start or end. */
function dayToMs(day: string, endOfDay: boolean): number | null {
  if (!day) return null;
  return new Date(`${day}T${endOfDay ? "23:59:59.999" : "00:00:00"}`).getTime();
}

const inputClass =
  "rounded border border-base-600 bg-base-850/80 px-1.5 py-0.5 text-xs text-slate-200 [color-scheme:dark] focus:border-accent/60 focus:outline-none";

export default function DateRangeFilter({
  value,
  now,
  onChange,
}: {
  value: DateRange;
  now: number;
  onChange: (r: DateRange) => void;
}) {
  const today = msToDay(now);

  // The day shown in each box. Rolling presets derive theirs from `now` so they
  // visibly advance; "custom" uses the explicit bounds; "all" shows nothing.
  let fromDay = "";
  let toDay = "";
  if (value.preset === "custom") {
    fromDay = msToDay(value.fromMs);
    toDay = msToDay(value.toMs);
  } else if (value.durationMs != null) {
    fromDay = msToDay(now - value.durationMs);
    toDay = today;
  }

  // Editing either box switches to a custom range, day-aligned, keeping whatever
  // the other box currently shows.
  const setFrom = (day: string) =>
    onChange({ preset: "custom", durationMs: null, fromMs: dayToMs(day, false), toMs: dayToMs(toDay, true) });
  const setTo = (day: string) =>
    onChange({ preset: "custom", durationMs: null, fromMs: dayToMs(fromDay, false), toMs: dayToMs(day, true) });

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

      <span className="px-0.5 text-base-600">·</span>

      <label className="flex items-center gap-1 text-[11px] text-muted">
        From
        <input
          type="date"
          aria-label="From date"
          value={fromDay}
          max={toDay || today}
          onChange={(e) => setFrom(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex items-center gap-1 text-[11px] text-muted">
        To
        <input
          type="date"
          aria-label="To date"
          value={toDay}
          min={fromDay || undefined}
          max={today}
          onChange={(e) => setTo(e.target.value)}
          className={inputClass}
        />
      </label>
    </div>
  );
}

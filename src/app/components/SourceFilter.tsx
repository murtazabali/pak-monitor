"use client";

import { sourceColor } from "@/config/sources";

export default function SourceFilter({
  available,
  selected,
  onToggle,
  onClear,
}: {
  available: string[];
  selected: string[];
  onToggle: (s: string) => void;
  onClear: () => void;
}) {
  const count = selected.length;
  return (
    <details className="group relative">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-base-600 bg-base-800/50 px-2 py-1 text-xs text-slate-300 hover:bg-base-700/60 [&::-webkit-details-marker]:hidden">
        Sources{count > 0 ? ` · ${count}` : ""}
        <span className="text-[9px] text-muted">▾</span>
      </summary>
      <div className="scroll-thin absolute z-30 mt-1 max-h-72 w-56 overflow-y-auto rounded-lg border border-edge bg-base-850 p-1.5 shadow-2xl">
        <button
          onClick={onClear}
          className={[
            "mb-1 w-full rounded px-2 py-1 text-left text-xs",
            count === 0 ? "bg-accent/15 text-accent" : "text-slate-300 hover:bg-base-700/60",
          ].join(" ")}
        >
          All sources
        </button>
        {available.map((s) => {
          const on = selected.includes(s);
          return (
            <label
              key={s}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs text-slate-300 hover:bg-base-700/50"
            >
              <input type="checkbox" checked={on} onChange={() => onToggle(s)} className="accent-accent" />
              <span className="h-2 w-2 rounded-full" style={{ background: sourceColor(s) }} />
              <span className="truncate">{s}</span>
            </label>
          );
        })}
      </div>
    </details>
  );
}

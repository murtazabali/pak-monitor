"use client";

import type { City } from "@/lib/types";

interface Props {
  cities: City[];
  selected: string[];
  counts: Record<string, number>;
  onToggle: (slug: string) => void;
  onSelectAll: () => void;
}

function chipClass(active: boolean): string {
  return [
    "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
    active
      ? "border-accent/60 bg-accent/15 text-accent"
      : "border-base-600 bg-base-800/60 text-slate-300 hover:border-base-600 hover:bg-base-700/70",
  ].join(" ");
}

export default function CityChips({ cities, selected, counts, onToggle, onSelectAll }: Props) {
  const allActive = selected.length === 0;
  return (
    <div className="flex items-center gap-2 overflow-x-auto scroll-thin border-b border-edge/70 bg-base-900/70 px-4 py-2.5 backdrop-blur">
      <span className="shrink-0 pr-1 font-mono text-[10px] uppercase tracking-widest text-muted">
        Cities
      </span>
      <button className={chipClass(allActive)} onClick={onSelectAll}>
        All Pakistan
      </button>
      <span className="shrink-0 text-base-600">|</span>
      {cities.map((c) => {
        const active = selected.includes(c.slug);
        const n = counts[c.slug] ?? 0;
        return (
          <button key={c.slug} className={chipClass(active)} onClick={() => onToggle(c.slug)}>
            {c.name}
            {n > 0 && (
              <span
                className={[
                  "rounded-full px-1.5 py-px font-mono text-[10px]",
                  active ? "bg-accent/20 text-accent" : "bg-base-700 text-muted",
                ].join(" ")}
              >
                {n}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

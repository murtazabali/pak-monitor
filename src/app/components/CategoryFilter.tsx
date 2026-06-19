"use client";

import { CATEGORIES } from "@/config/categories";

interface Props {
  selected: string[];
  onToggle: (slug: string) => void;
}

export default function CategoryFilter({ selected, onToggle }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {CATEGORIES.map((c) => {
        const active = selected.includes(c.slug);
        return (
          <button
            key={c.slug}
            onClick={() => onToggle(c.slug)}
            className={[
              "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
              active
                ? "font-medium"
                : "border-base-600 bg-base-800/50 text-slate-400 hover:bg-base-700/60",
            ].join(" ")}
            style={
              active
                ? { borderColor: `${c.color}99`, color: c.color, background: `${c.color}1f` }
                : undefined
            }
          >
            <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

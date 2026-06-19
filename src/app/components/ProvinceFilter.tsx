"use client";

import { CITIES } from "@/config/cities";

const PROVINCES = Array.from(new Set(CITIES.map((c) => c.province))).sort();

/** Selecting a province selects all of its cities at once. */
export default function ProvinceFilter({ onSelect }: { onSelect: (slugs: string[]) => void }) {
  return (
    <select
      defaultValue=""
      aria-label="Filter by province"
      onChange={(e) => {
        const p = e.target.value;
        e.currentTarget.value = "";
        if (p) onSelect(CITIES.filter((c) => c.province === p).map((c) => c.slug));
      }}
      className="shrink-0 rounded-md border border-base-600 bg-base-800/60 px-2 py-1 text-xs text-slate-300 [color-scheme:dark] hover:bg-base-700/70 focus:outline-none"
    >
      <option value="">Province…</option>
      {PROVINCES.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
}

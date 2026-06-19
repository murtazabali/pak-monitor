"use client";

import { useState } from "react";

export default function Watchlist({
  terms,
  onAdd,
  onRemove,
}: {
  terms: string[];
  onAdd: (t: string) => void;
  onRemove: (t: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Watch</span>
      {terms.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200"
        >
          {t}
          <button onClick={() => onRemove(t)} className="text-amber-300/70 hover:text-amber-100" aria-label={`Remove ${t}`}>
            ×
          </button>
        </span>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const t = value.trim();
          if (t) {
            onAdd(t);
            setValue("");
          }
        }}
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="+ keyword"
          aria-label="Add watchlist keyword"
          className="w-24 rounded border border-base-600 bg-base-850/80 px-1.5 py-0.5 text-xs text-slate-200 placeholder:text-muted focus:border-amber-400/60 focus:outline-none"
        />
      </form>
    </div>
  );
}

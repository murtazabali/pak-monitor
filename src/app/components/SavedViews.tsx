"use client";

import { useState } from "react";

export interface SavedView {
  name: string;
  /** The URL query string capturing the filters. */
  query: string;
}

export default function SavedViews({
  views,
  currentQuery,
  onSave,
  onApply,
  onDelete,
}: {
  views: SavedView[];
  currentQuery: string;
  onSave: (name: string, query: string) => void;
  onApply: (query: string) => void;
  onDelete: (name: string) => void;
}) {
  const [name, setName] = useState("");

  return (
    <details className="relative">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-base-600 bg-base-800/50 px-2 py-1 text-xs text-slate-300 hover:bg-base-700/60 [&::-webkit-details-marker]:hidden">
        ★ Views{views.length ? ` · ${views.length}` : ""}
        <span className="text-[9px] text-muted">▾</span>
      </summary>
      <div className="absolute z-30 mt-1 w-60 rounded-lg border border-edge bg-base-850 p-2 shadow-2xl">
        <form
          className="mb-2 flex gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            const n = name.trim();
            if (n) {
              onSave(n, currentQuery);
              setName("");
            }
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Save current view as…"
            className="min-w-0 flex-1 rounded border border-base-600 bg-base-900 px-1.5 py-1 text-xs text-slate-200 placeholder:text-muted focus:border-accent/60 focus:outline-none"
          />
          <button className="rounded bg-accent/15 px-2 text-xs text-accent hover:bg-accent/25">Save</button>
        </form>
        {views.length === 0 ? (
          <p className="px-1 py-1 text-xs text-muted">No saved views yet.</p>
        ) : (
          <ul className="flex flex-col">
            {views.map((v) => (
              <li key={v.name} className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-base-700/50">
                <button onClick={() => onApply(v.query)} className="flex-1 truncate text-left text-xs text-slate-300 hover:text-accent">
                  {v.name}
                </button>
                <button onClick={() => onDelete(v.name)} className="text-muted hover:text-signal-alert" aria-label={`Delete ${v.name}`}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

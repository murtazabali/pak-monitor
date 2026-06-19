"use client";

export type ConnStatus = "connecting" | "live" | "closed";

interface Props {
  status: ConnStatus;
  paused: boolean;
  onToggle: () => void;
}

export default function LiveToggle({ status, paused, onToggle }: Props) {
  const live = status === "live" && !paused;
  const label = paused
    ? "Paused"
    : status === "live"
      ? "Live"
      : status === "connecting"
        ? "Connecting"
        : "Offline";
  const color = paused
    ? "#f59e0b"
    : status === "live"
      ? "#34d399"
      : status === "connecting"
        ? "#22d3ee"
        : "#ef4444";

  return (
    <button
      onClick={onToggle}
      title={paused ? "Resume live feed" : "Pause live feed"}
      className="inline-flex items-center gap-2 rounded-md border border-base-600 bg-base-800/70 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-base-600 hover:bg-base-700/70"
    >
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        {live && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ background: color }}
          />
        )}
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      </span>
      <span className="font-mono uppercase tracking-wide" style={{ color }}>
        {label}
      </span>
      <span className="text-[10px] text-muted">{paused ? "▶" : "❚❚"}</span>
    </button>
  );
}

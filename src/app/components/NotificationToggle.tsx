"use client";

import { ensureNotificationPermission, notificationsSupported } from "./alerts";

export default function NotificationToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (b: boolean) => void;
}) {
  if (!notificationsSupported()) return null;

  return (
    <button
      title="Breaking-news alerts for your cities (watchlist + crime/accident)"
      onClick={async () => {
        if (enabled) {
          onChange(false);
        } else {
          onChange(await ensureNotificationPermission());
        }
      }}
      className={[
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
        enabled
          ? "border-signal-warn/50 bg-signal-warn/15 text-signal-warn"
          : "border-base-600 bg-base-800/70 text-slate-300 hover:bg-base-700/70",
      ].join(" ")}
    >
      {enabled ? "🔔" : "🔕"} Alerts
    </button>
  );
}

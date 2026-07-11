// Original, evergreen one-line descriptions of the news categories Pak Monitor
// tracks. Used in the homepage editorial ("What Pak Monitor tracks") to give
// each category a human explanation rather than only a coloured chip. Kept
// evergreen — no dates or figures that go stale.

import type { Category } from "@/lib/types";

export const CATEGORY_INTROS: Partial<Record<Category, string>> = {
  politics:
    "Federal and provincial politics — parliament, the courts, elections, party movements and the policy decisions that shape daily life across Pakistan.",
  crime:
    "Law-and-order reporting from Pakistan's cities: police operations, street crime, court cases and the security stories that dominate local coverage.",
  accident:
    "Road, rail and industrial accidents, fires and building collapses — the incident reporting that spreads fastest across a city's news feeds.",
  weather:
    "Monsoon rains, heatwaves, flooding and the alerts issued by the Pakistan Meteorological Department, tracked as warnings are published.",
  business:
    "Trade, industry, energy, the rupee and the wider economy — the commercial news that moves Pakistan's markets and its job market alike.",
  sports:
    "Cricket, football, hockey and more — national teams, domestic leagues and the international fixtures Pakistani fans follow most closely.",
  health:
    "Public-health news: disease outbreaks, hospitals, vaccination drives and the medical stories that affect Pakistani communities.",
};

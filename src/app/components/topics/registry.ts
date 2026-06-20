import type { ComponentType } from "react";
import StocksPanel from "./StocksPanel";
import FifaPanel from "./FifaPanel";

/**
 * Topic panel components, keyed by topic slug. A topic with a live-data panel
 * registers it here; the generic TopicView / Dashboard render it from the
 * matching `topics.<slug>` snapshot data. A topic with no panel simply omits an
 * entry (its page/chip then show only the news feed).
 *
 * To add a topic's panel: create ./<Slug>Panel.tsx taking `{ data: unknown }`
 * and register it below.
 */
export const TOPIC_PANELS: Record<string, ComponentType<{ data: unknown }>> = {
  stocks: StocksPanel,
  fifa: FifaPanel,
};

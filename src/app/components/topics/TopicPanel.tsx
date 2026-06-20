"use client";

import { TOPIC_PANELS } from "./registry";

/**
 * Renders a topic's live-data panel by slug, passing the matching snapshot data.
 * Returns null for topics without a registered panel.
 */
export default function TopicPanel({ slug, data }: { slug: string; data: unknown }) {
  const Panel = TOPIC_PANELS[slug];
  return Panel ? <Panel data={data} /> : null;
}

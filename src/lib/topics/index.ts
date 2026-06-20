import { getData as stocks } from "./stocks";
import { getData as fifa } from "./fifa";

/**
 * Topic data providers, keyed by topic slug. Each returns a JSON-serialisable
 * snapshot (or null on failure). A topic without live data simply has no entry
 * here — its page/chip then show only the news feed.
 *
 * To add a topic's data: implement `getData()` in ./<slug>.ts and register it.
 */
export const TOPIC_PROVIDERS: Record<string, () => Promise<unknown | null>> = {
  stocks,
  fifa,
};

/**
 * Fetch every topic provider in parallel → { [slug]: data | null }. Embedded as
 * `topics` in snapshot.json. Never throws: a failing provider yields null.
 */
export async function fetchAllTopics(): Promise<Record<string, unknown | null>> {
  const slugs = Object.keys(TOPIC_PROVIDERS);
  const results = await Promise.all(
    slugs.map((s) => TOPIC_PROVIDERS[s]().catch(() => null)),
  );
  return Object.fromEntries(slugs.map((s, i) => [s, results[i]]));
}

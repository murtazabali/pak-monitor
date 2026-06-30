import Dashboard from "./components/Dashboard";
import { loadBuildSnapshot } from "@/lib/buildSnapshot";

// Server component: bakes the latest headlines into the static HTML so crawlers,
// AdSense and no-JS visitors get real content. The client Dashboard hydrates over
// this and switches to the live feed. ~60 newest is plenty of content without
// bloating the HTML (the live feed renders up to 300 once it loads).
export default async function Page() {
  const { articles, now } = await loadBuildSnapshot();
  const initialArticles = [...articles]
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 60);
  return <Dashboard initialArticles={initialArticles} initialNow={now} />;
}

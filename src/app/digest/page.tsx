import Link from "next/link";
import { getRecent, getStats } from "@/lib/db";
import { clusterArticles } from "@/lib/cluster";
import { CITY_BY_SLUG } from "@/config/cities";
import { CATEGORY_BY_SLUG } from "@/config/categories";
import { sourceColor } from "@/config/sources";

export const dynamic = "force-dynamic";

export default async function DigestPage({
  searchParams,
}: {
  searchParams: Promise<{ cities?: string }>;
}) {
  const sp = await searchParams;
  const cities = sp.cities ? sp.cities.split(",").filter(Boolean) : [];
  const since = new Date(Date.now() - 24 * 3_600_000).toISOString();

  const [articles, stats] = await Promise.all([
    getRecent({ cities, from: since, limit: 500 }),
    getStats(cities),
  ]);

  const trending = clusterArticles(articles)
    .filter((c) => c.sources.length >= 2)
    .sort((a, b) => b.sources.length - a.sources.length)
    .slice(0, 12);

  const scope = cities.length ? cities.map((c) => CITY_BY_SLUG[c]?.name ?? c).join(", ") : "All Pakistan";
  const day = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
        ← Back to monitor
      </Link>

      <header className="mb-6 border-b border-edge/70 pb-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Daily digest · {day}</p>
        <h1 className="font-mono text-2xl font-bold text-slate-100">{scope}</h1>
        <p className="mt-1 text-sm text-muted">
          {stats.total} articles in the last 24 hours across {Object.keys(stats.byCity).length} cities.
        </p>
      </header>

      {stats.spikes.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-signal-warn">⚠ Activity spikes</h2>
          <div className="flex flex-wrap gap-2">
            {stats.spikes.map((s) => (
              <span key={s.city} className="rounded-md border border-signal-warn/40 bg-signal-warn/10 px-2.5 py-1 text-sm text-signal-warn">
                {CITY_BY_SLUG[s.city]?.name ?? s.city} ↑ {s.ratio}× ({s.recent} this hour)
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="mb-6">
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">🔥 Top stories</h2>
        {trending.length === 0 ? (
          <p className="text-sm text-muted">No multi-outlet stories in the last 24h.</p>
        ) : (
          <ol className="flex flex-col gap-2.5">
            {trending.map((c) => (
              <li key={c.id} className="flex gap-2">
                <span className="mt-0.5 shrink-0 rounded-full bg-signal-warn/20 px-1.5 font-mono text-[10px] text-signal-warn">
                  {c.sources.length}
                </span>
                <div className="min-w-0">
                  <a href={c.lead.link} target="_blank" rel="noopener noreferrer" dir="auto" className="font-medium text-slate-100 hover:text-accent">
                    {c.lead.title}
                  </a>
                  <p className="mt-0.5 flex flex-wrap gap-x-1.5 text-[11px]">
                    {c.sources.map((s) => (
                      <span key={s} style={{ color: sourceColor(s) }}>
                        {s}
                      </span>
                    ))}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mb-6 grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">By category</h2>
          <div className="flex flex-col gap-1">
            {Object.entries(stats.byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, n]) => (
                <div key={cat} className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_BY_SLUG[cat]?.color ?? "#64748b" }} />
                  <span className="flex-1 text-slate-300">{CATEGORY_BY_SLUG[cat]?.label ?? cat}</span>
                  <span className="font-mono text-muted">{n}</span>
                </div>
              ))}
          </div>
        </div>
        <div>
          <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">Most mentioned</h2>
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {stats.topEntities.slice(0, 14).map((e) => (
              <span key={e.name} className="text-sm text-slate-300">
                {e.name}
                <span className="text-muted"> {e.count}</span>
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Article, Stats } from "@/lib/types";
import { CATEGORY_BY_SLUG } from "@/config/categories";
import ArticleCard from "@/app/components/ArticleCard";
import Sparkline from "@/app/components/Sparkline";

export default function CityView({
  slug,
  name,
  province,
}: {
  slug: string;
  name: string;
  province: string;
}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancel = false;
    setNow(Date.now());
    fetch(`/api/articles?cities=${slug}&limit=100`)
      .then((r) => r.json())
      .then((d) => !cancel && setArticles(d.articles ?? []))
      .catch(() => {});
    fetch(`/api/stats?cities=${slug}`)
      .then((r) => r.json())
      .then((d) => !cancel && setStats(d))
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [slug]);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
        ← Back to monitor
      </Link>

      <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-edge/70 pb-4">
        <div>
          <h1 className="font-mono text-2xl font-bold text-slate-100">{name}</h1>
          <p className="mt-0.5 text-xs uppercase tracking-widest text-muted">{province}</p>
        </div>
        {stats && (
          <div className="text-right">
            <div className="font-mono text-2xl font-bold text-accent">{stats.total}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted">articles in window</div>
          </div>
        )}
      </header>

      {stats && stats.perHour.some((n) => n > 0) && (
        <div className="mb-5">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">Last 24h</p>
          <Sparkline data={stats.perHour} width={680} height={48} />
        </div>
      )}

      {stats && Object.keys(stats.byCategory).length > 0 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {Object.entries(stats.byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, n]) => {
              const m = CATEGORY_BY_SLUG[cat];
              return (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
                  style={{ borderColor: `${m?.color ?? "#64748b"}55`, color: m?.color ?? "#94a3b8" }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: m?.color ?? "#64748b" }} />
                  {m?.label ?? cat} · {n}
                </span>
              );
            })}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {articles.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">No recent articles for {name}.</p>
        ) : (
          articles.map((a) => <ArticleCard key={a.id} article={a} now={now} />)
        )}
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import type { Article } from "@/lib/types";
import { CITY_BY_SLUG } from "@/config/cities";
import { CATEGORY_BY_SLUG } from "@/config/categories";
import { sourceColor, faviconUrl } from "@/config/sources";
import { timeAgo } from "@/lib/timeago";
import { escapeRegExp } from "@/lib/text";
import { sentimentOf } from "@/lib/sentiment";

function highlight(text: string, terms: string[]): ReactNode {
  const valid = terms.map((t) => t.trim()).filter((t) => t.length >= 2);
  if (valid.length === 0) return text;
  const lower = new Set(valid.map((t) => t.toLowerCase()));
  const re = new RegExp(`(${valid.map(escapeRegExp).join("|")})`, "ig");
  return text.split(re).map((part, i) =>
    lower.has(part.toLowerCase()) ? (
      <mark key={i} className="rounded bg-amber-400/30 px-0.5 text-amber-200">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function ArticleCard({
  article,
  now,
  read = false,
  watch = [],
  onOpen,
}: {
  article: Article;
  now: number;
  read?: boolean;
  watch?: string[];
  onOpen?: () => void;
}) {
  const color = sourceColor(article.source);
  const favicon = faviconUrl(article.source);
  const sentiment = sentimentOf(`${article.title} ${article.summary}`);

  return (
    <article
      className={[
        "group animate-slide-in flex gap-3 rounded-lg border border-edge/60 bg-base-850/60 p-3 transition-colors hover:border-accent/40 hover:bg-base-800/70",
        read ? "opacity-55" : "",
      ].join(" ")}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[11px]">
          {favicon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={favicon}
              alt=""
              width={14}
              height={14}
              className="h-3.5 w-3.5 rounded-sm"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <span
            className="rounded border px-1.5 py-0.5 font-mono font-medium uppercase tracking-wide"
            style={{ color, borderColor: `${color}55`, background: `${color}14` }}
          >
            {article.source}
          </span>
          <span className="text-muted">{timeAgo(article.publishedAt, now)}</span>
          <span className="ml-auto flex items-center gap-1.5">
            {sentiment !== "neu" && (
              <span
                title={sentiment === "pos" ? "Positive tone" : "Negative tone"}
                className={sentiment === "pos" ? "text-signal-live" : "text-signal-alert"}
              >
                {sentiment === "pos" ? "▲" : "▼"}
              </span>
            )}
            {article.categories.map((cat) => {
              const m = CATEGORY_BY_SLUG[cat];
              if (!m) return null;
              return (
                <span
                  key={cat}
                  title={m.label}
                  className="h-2 w-2 rounded-full"
                  style={{ background: m.color }}
                />
              );
            })}
          </span>
        </div>

        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onOpen}
          dir="auto"
          className="clamp-3 mt-1.5 block text-[15px] font-semibold leading-snug text-slate-100 decoration-accent/50 underline-offset-2 hover:text-accent hover:underline"
        >
          {highlight(article.title, watch)}
        </a>

        {article.summary && (
          <p dir="auto" className="clamp-2 mt-1 text-[13px] leading-relaxed text-slate-400">
            {article.summary}
          </p>
        )}

        {article.cities.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {article.cities.map((slug) => (
              <a
                key={slug}
                href={`/city/${slug}`}
                className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent ring-1 ring-inset ring-accent/20 hover:bg-accent/20"
              >
                ◉ {CITY_BY_SLUG[slug]?.name ?? slug}
              </a>
            ))}
          </div>
        )}
      </div>

      {article.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.imageUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          className="h-20 w-20 shrink-0 rounded-md object-cover ring-1 ring-edge/60 sm:h-24 sm:w-24"
        />
      )}
    </article>
  );
}

import { CATEGORIES } from "@/config/categories";
import { CATEGORY_INTROS } from "@/config/categoryIntros";
import { HOME_LEAD_HEADING, HOME_INTRO, HOME_SECTIONS } from "@/config/homeContent";
import { CITIES } from "@/config/cities";
import { TOPICS } from "@/config/topics";
import { SITE_NAME, ADSENSE_SLOTS } from "@/config/site";
import AdUnit from "./AdUnit";
import SiteFooter from "./SiteFooter";

/**
 * Original editorial content band shown on the homepage, below the live
 * dashboard. Server-rendered so the hand-written prose is baked into the static
 * HTML (what crawlers and AdSense's reviewer read), and fully visible to anyone
 * who scrolls past the tool. Its text is unique to this site — see
 * src/config/homeContent.ts / categoryIntros.ts.
 */
export default function HomeEditorial() {
  const tracked = CATEGORIES.filter((c) => CATEGORY_INTROS[c.slug]);

  return (
    <section className="border-t border-edge/70 bg-base-900/40">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-sm leading-relaxed text-slate-300">
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-100">{HOME_LEAD_HEADING}</h2>
          {HOME_INTRO.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {HOME_SECTIONS.map((section) => (
          <div key={section.heading} className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-100">{section.heading}</h2>
            {section.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}

            {section.id === "track" && (
              <ul className="mt-2 space-y-2.5">
                {tracked.map((c) => (
                  <li key={c.slug} className="flex gap-3">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: c.color }}
                      aria-hidden
                    />
                    <span className="text-slate-400">
                      <span className="font-medium text-slate-200">{c.label}</span> —{" "}
                      {CATEGORY_INTROS[c.slug]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">Explore</h2>
          <div className="flex flex-wrap gap-2">
            {CITIES.map((c) => (
              <a
                key={c.slug}
                href={`/city/${c.slug}`}
                className="rounded-md border border-base-600 bg-base-800/50 px-2.5 py-1 text-xs text-slate-300 hover:bg-base-700/70"
              >
                {c.name}
              </a>
            ))}
            {TOPICS.map((t) => (
              <a
                key={t.slug}
                href={`/${t.slug}`}
                className="rounded-md border border-base-600 bg-base-800/50 px-2.5 py-1 text-xs text-slate-300 hover:bg-base-700/70"
              >
                {t.icon} {t.label}
              </a>
            ))}
            <a
              href="/digest"
              className="rounded-md border border-base-600 bg-base-800/50 px-2.5 py-1 text-xs text-slate-300 hover:bg-base-700/70"
            >
              Daily digest
            </a>
          </div>
          <p className="text-xs text-muted">
            {SITE_NAME} is an aggregator and index — it links to reporting by
            Pakistan&apos;s outlets and never republishes full articles. Learn more on{" "}
            <a href="/about" className="text-accent hover:underline">
              About
            </a>
            ,{" "}
            <a href="/faq" className="text-accent hover:underline">
              FAQ
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-accent hover:underline">
              Privacy
            </a>
            .
          </p>
        </div>
      </div>

      <AdUnit slot={ADSENSE_SLOTS.feed} className="mx-auto w-full max-w-3xl px-2" />
      <SiteFooter />
    </section>
  );
}

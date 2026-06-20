import Link from "next/link";
import { SITE_NAME } from "@/config/site";
import { TOPICS } from "@/config/topics";

/** Site-wide footer with the legal/info links AdSense expects to be reachable. */
export default function SiteFooter() {
  return (
    <footer className="border-t border-edge/60 px-4 py-3 text-[11px] text-muted">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          {SITE_NAME} · Headlines aggregated from public RSS feeds; all rights
          remain with the original publishers.
        </p>
        <nav className="flex items-center gap-3">
          <Link href="/about" className="hover:text-accent">
            About
          </Link>
          <Link href="/privacy" className="hover:text-accent">
            Privacy
          </Link>
          <Link href="/contact" className="hover:text-accent">
            Contact
          </Link>
          <Link href="/digest" className="hover:text-accent">
            Digest
          </Link>
          {TOPICS.map((t) => (
            <Link key={t.slug} href={`/${t.slug}`} className="hover:text-accent">
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

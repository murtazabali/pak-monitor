import Link from "next/link";
import type { ReactNode } from "react";
import SiteFooter from "./SiteFooter";

/** Simple readable shell for static content pages (About / Privacy / Contact). */
export default function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent"
      >
        ← Pak Monitor
      </Link>
      <header className="mb-6 border-b border-edge/70 pb-4">
        <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </header>
      <article className="flex-1 space-y-4 text-sm leading-relaxed text-slate-300 [&_a]:text-accent [&_a:hover]:underline [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-100 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </article>
      <div className="mt-10">
        <SiteFooter />
      </div>
    </div>
  );
}

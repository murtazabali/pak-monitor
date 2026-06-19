import type { Metadata } from "next";
import PageShell from "@/app/components/PageShell";
import { SITE_NAME, CONTACT_EMAIL } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${SITE_NAME} — feedback, corrections, or publisher feed requests.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PageShell title="Contact" subtitle="We&rsquo;d love to hear from you">
      <p>
        For feedback, corrections, partnership enquiries or any question about{" "}
        {SITE_NAME}, email us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We read every
        message and aim to reply within a few days.
      </p>

      <h2>Publishers</h2>
      <p>
        {SITE_NAME} aggregates only publicly available RSS feeds and links back
        to your site for the full story. If you are a publisher and would like
        your feed added, adjusted or removed, email us at the address above with
        the details and we will action it promptly.
      </p>

      <h2>Corrections</h2>
      <p>
        Because every story links to its original source, factual corrections are
        best made by the publishing outlet. If something is mis-tagged or
        displayed incorrectly on {SITE_NAME} itself, let us know and we&apos;ll
        fix it.
      </p>
    </PageShell>
  );
}

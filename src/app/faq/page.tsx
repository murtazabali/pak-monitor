import type { Metadata } from "next";
import PageShell from "@/app/components/PageShell";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { FAQ } from "@/config/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description: `Answers to common questions about ${SITE_NAME} — what it is, where the news comes from, how it updates and how to follow a city or topic.`,
  alternates: { canonical: "/faq" },
};

// FAQPage structured data — lets the answers appear as rich results and signals
// genuine Q&A content. Built from the same hand-written FAQ shown on the page.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function FaqPage() {
  return (
    <PageShell
      title="Frequently asked questions"
      subtitle={`What ${SITE_NAME} is and how to get the most out of it`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {FAQ.map((item) => (
        <section key={item.q}>
          <h2>{item.q}</h2>
          <p>{item.a}</p>
        </section>
      ))}
      <p className="text-muted">
        Still have a question? Reach us via the{" "}
        <a href="/contact">contact page</a>. More about how the site works is on{" "}
        <a href="/about">About {SITE_NAME}</a>, and the canonical site lives at{" "}
        <a href={SITE_URL}>{SITE_URL.replace("https://", "")}</a>.
      </p>
    </PageShell>
  );
}

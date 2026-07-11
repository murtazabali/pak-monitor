import type { Metadata } from "next";
import PageShell from "@/app/components/PageShell";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { CITIES } from "@/config/cities";

export const metadata: Metadata = {
  title: "About",
  description: `What ${SITE_NAME} is, how it aggregates Pakistan news in real time, and how it links back to the original publishers.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PageShell title={`About ${SITE_NAME}`} subtitle="What this is and how it works">
      <p>
        {SITE_NAME} is a free, realtime news monitor for Pakistan. It watches the
        public news feeds of the country&apos;s leading outlets and streams new
        stories in as they are published, organised by city and by topic — crime,
        politics, weather, business and more — so you can follow exactly what is
        happening where, as it happens.
      </p>

      <h2>How it works</h2>
      <p>
        {SITE_NAME} continuously reads the publicly available RSS feeds of major
        Pakistani news organisations. For each story it shows the headline, a
        short summary, the source outlet and a link to the full article on the
        publisher&apos;s own website. Stories are automatically tagged to a city
        when they mention that city or one of its neighbourhoods, grouped into
        clusters when several outlets cover the same event, and pushed to your
        screen live.
      </p>

      <h2>Where the news comes from</h2>
      <p>
        Sources are established Pakistani news organisations — national
        newspapers, television and radio broadcasters, and specialist business
        and sport outlets — chosen because they publish a public, machine-readable
        feed and cover the cities and topics {SITE_NAME} follows. Every item is
        attributed to its outlet by name and links straight back to the original
        report; {SITE_NAME} shows only the headline and a short summary and never
        reproduces a full article.
      </p>

      <h2>How often it updates</h2>
      <p>
        {SITE_NAME} re-reads its sources continuously through the day and shows new
        stories within minutes of publication. The live indicator in the header
        reflects the current connection, and the daily digest and city pages draw
        on the same stream so what you see is always the latest available.
      </p>

      <h2>Editorial independence</h2>
      <p>
        {SITE_NAME} does not edit, rewrite or take a position on the stories it
        links to — headlines and summaries appear as the original publisher wrote
        them, and ranking is by time and by how many outlets are covering an
        event, not by any editorial preference of ours. The original outlet holds
        all copyright and editorial responsibility. If you believe something has
        been mis-tagged, or you spot an error on the site itself, please tell us
        via the <a href="/contact">contact page</a>.
      </p>

      <h2>Cities we monitor</h2>
      <p>{SITE_NAME} currently tracks {CITIES.length} cities, including {CITIES.slice(0, 5).map((c) => c.name).join(", ")} and more.</p>

      <h2>About the content</h2>
      <p>
        {SITE_NAME} is an aggregator and index — it does not republish full
        articles. Headlines and short excerpts are shown to help you decide what
        to read, and every item links back to the original publisher, where all
        copyright and editorial responsibility remain. If you are a publisher and
        would like a feed adjusted or removed, please get in touch via our{" "}
        <a href="/contact">contact page</a>.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, feedback or corrections are welcome — see the{" "}
        <a href="/contact">contact page</a>, or the{" "}
        <a href="/faq">frequently asked questions</a> for the quick answers. The site lives at{" "}
        <a href={SITE_URL}>{SITE_URL.replace("https://", "")}</a>.
      </p>
    </PageShell>
  );
}

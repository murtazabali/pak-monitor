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
        <a href="/contact">contact page</a>. The site lives at{" "}
        <a href={SITE_URL}>{SITE_URL.replace("https://", "")}</a>.
      </p>
    </PageShell>
  );
}

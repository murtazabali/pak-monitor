// Original, evergreen editorial for the homepage.
//
// The dashboard above the fold is a live tool whose content is aggregated
// third-party headlines. This hand-written prose, rendered in a content band
// below it, explains what Pak Monitor is, what it covers and how it works — so
// crawlers, AdSense's reviewer and first-time visitors get real, unique writing
// rather than only a feed of other people's links. Kept evergreen (no dates or
// figures that go stale).

export interface HomeSection {
  /** Optional marker so the component can inject the category grid in one place. */
  id?: "track";
  heading: string;
  paragraphs: string[];
}

export const HOME_LEAD_HEADING = "Pakistan's news, as it breaks — in one place";

export const HOME_INTRO: string[] = [
  "Pakistan produces a relentless news cycle, and it lives in a hundred places at once — dozens of national newspapers, television channels and specialist outlets, each with its own website and feed. Following what is happening in a single city, or keeping up with one subject as it develops, normally means juggling a stack of browser tabs. Pak Monitor exists to close that gap: it continuously watches the public feeds of Pakistan's major news organisations and pulls new stories into one live, filterable stream, organised by city and by topic, the moment they are published.",
  "The result is a single place to watch the country's news as it happens. Narrow the feed to Karachi or Lahore, follow only crime or only business, group together the duplicate coverage that appears when every outlet chases the same story, and keep an eye on the subjects that matter to you — from the KSE-100 index to the FIFA World Cup — without leaving the page.",
];

export const HOME_SECTIONS: HomeSection[] = [
  {
    id: "track",
    heading: "What Pak Monitor tracks",
    paragraphs: [
      "Every incoming story is automatically sorted into the categories Pakistani readers care about most, so you can follow a single beat or scan them all at once:",
    ],
  },
  {
    heading: "How Pak Monitor works",
    paragraphs: [
      "Pak Monitor reads the publicly available RSS feeds of Pakistan's leading news organisations — national dailies, broadcasters and specialist business and sport outlets — and refreshes them continuously through the day. For each story it keeps the headline, a short summary, the name of the outlet and a link straight to the original article. It never republishes the full text of a report: every click goes back to the newsroom that did the work.",
      "Behind the feed, a few automated steps turn that flood of headlines into something usable. Each story is tagged to a city whenever it mentions that city or one of its neighbourhoods; near-identical reports of the same event from different outlets are clustered together so one story does not crowd out everything else; and every item is classified by topic so the filters and trending sections stay accurate. When several outlets suddenly converge on one city or one subject, that surge surfaces as an activity spike.",
    ],
  },
  {
    heading: "Following a city or a topic",
    paragraphs: [
      "Pick one or more of the ten cities Pak Monitor tracks to see only their news, or open a dedicated city page for a focused view with its own activity chart and background. Topic pages go deeper on a single subject — live KSE-100 figures and the day's biggest market movers on the Stocks page, fixtures, results and live scores on the FIFA World Cup page — while the daily digest rounds up the last 24 hours at a glance.",
      "Everything is free and needs no account. Your filters live in your own browser and can be saved or shared as a link, and because Pak Monitor is a Progressive Web App you can install it on your phone and open it like any other app.",
    ],
  },
  {
    heading: "Why real-time coverage matters",
    paragraphs: [
      "In a country where a weather warning, a security incident or a market swing can reshape the day, the gap between a story breaking and a reader seeing it matters. Pak Monitor is built to shrink that gap — not by writing the news, but by making the news that Pakistan's journalists publish easier to find, follow and make sense of, city by city and topic by topic.",
    ],
  },
];

// Original, evergreen FAQ shown on /faq. Hand-written questions and answers that
// give the site substantial unique content and answer what real visitors ask.
// Answers are plain text so they can also feed the FAQPage structured data.
// Kept evergreen — no dates or figures that go stale.

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ: FaqItem[] = [
  {
    q: "What is Pak Monitor?",
    a: "Pak Monitor is a free, realtime news monitor for Pakistan. It watches the public feeds of the country's leading news outlets and streams new stories into one place the moment they are published, organised by city and by topic so you can follow exactly what is happening where.",
  },
  {
    q: "Where does the news come from?",
    a: "Every story comes from the public RSS feeds of established Pakistani news organisations — national newspapers, broadcasters and specialist business and sport outlets. Pak Monitor shows the headline, a short summary and a link to the original article; the full report always lives on the publisher's own website.",
  },
  {
    q: "Does Pak Monitor write its own articles?",
    a: "No. Pak Monitor is an aggregator and index, not a newsroom. It does not republish full articles or claim authorship — it organises links to reporting done by Pakistan's journalists so that coverage is easier to find and follow. The written explanations on the site, like this page and the city and topic introductions, are its own.",
  },
  {
    q: "Is it free to use?",
    a: "Yes, completely. There is no account, no paywall and no sign-up. You can start following your city or topic straight away.",
  },
  {
    q: "How often does the feed update?",
    a: "The feed refreshes continuously through the day and pulls in new stories within minutes of them being published. The live indicator in the header shows when the connection is active.",
  },
  {
    q: "Which cities does it cover?",
    a: "Pak Monitor tracks ten of Pakistan's largest cities — including Karachi, Lahore, Islamabad, Rawalpindi and Faisalabad — automatically tagging each story to the city it mentions. You can follow one city, several at once, or the whole country.",
  },
  {
    q: "Can I follow just one kind of news, like crime in Karachi?",
    a: "Yes. Combine a city filter with a category — crime, politics, weather, business, sports or health — to narrow the feed to exactly the coverage you want. You can then bookmark or share the resulting link to return to the same view.",
  },
  {
    q: "What are the Stocks and FIFA sections?",
    a: "They are dedicated topic pages that go beyond headlines. The Stocks page shows the live KSE-100 index and the day's top movers on the Pakistan Stock Exchange; the FIFA page shows World Cup fixtures, results and live scores, each alongside the latest related news.",
  },
  {
    q: "How are duplicate stories handled?",
    a: "When several outlets cover the same event, Pak Monitor groups their reports into a single cluster so one story does not flood the feed. You can see at a glance how many outlets are covering it, and switch grouping off if you would rather see every item listed separately.",
  },
  {
    q: "Does Pak Monitor track me?",
    a: "Your filter preferences are stored in your own browser, not on a server tied to your identity, and the site uses privacy-respecting analytics only to understand overall traffic. The Privacy page explains this in full.",
  },
  {
    q: "Can I install it on my phone?",
    a: "Yes. Pak Monitor is a Progressive Web App, so you can add it to your home screen from your browser and open it like any other app, with a full-screen live feed.",
  },
  {
    q: "I run a publication — can my feed be added, adjusted or removed?",
    a: "Yes. Pak Monitor links back to every source and respects publisher requests. Get in touch through the contact page and we will add, adjust or remove a feed.",
  },
  {
    q: "How is this different from a search engine or Google News?",
    a: "Pak Monitor is narrow by design. It focuses only on Pakistan, tags stories to specific cities, clusters duplicate coverage and surfaces real-time spikes in local reporting — a live monitoring tool for a single country rather than a general search box.",
  },
];

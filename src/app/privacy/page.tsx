import type { Metadata } from "next";
import PageShell from "@/app/components/PageShell";
import { SITE_NAME, CONTACT_EMAIL } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} handles data, cookies and third-party advertising.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy" subtitle="Last updated: June 2026">
      <p>
        This Privacy Policy explains how {SITE_NAME} (&quot;we&quot;, &quot;us&quot;)
        handles information when you visit this website. By using the site you
        agree to the practices described here.
      </p>

      <h2>Information we collect</h2>
      <p>
        {SITE_NAME} does not require an account and does not ask you for personal
        information such as your name, email or phone number. Your filter
        preferences, selected cities, saved views and watchlist are stored
        locally in your own browser (local storage) and are never sent to us.
        Like most websites, our hosting provider may process standard technical
        information such as your IP address, browser type and pages visited for
        security and aggregate analytics.
      </p>

      <h2>Cookies and local storage</h2>
      <p>
        We use browser local storage to remember your preferences on your device.
        Cookies may also be set by the third-party services described below.
      </p>

      <h2>Advertising and third-party cookies</h2>
      <ul>
        <li>
          Third-party vendors, including Google, use cookies to serve ads based
          on your prior visits to this and other websites.
        </li>
        <li>
          Google&apos;s use of advertising cookies enables it and its partners to
          serve ads to you based on your visit to this site and/or other sites on
          the Internet.
        </li>
        <li>
          You can opt out of personalised advertising by visiting{" "}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            Google Ads Settings
          </a>
          . You can also opt out of some third-party vendors&apos; use of cookies
          for personalised advertising at{" "}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">
            aboutads.info
          </a>
          .
        </li>
      </ul>
      <p>
        Third-party ad networks may use cookies, web beacons and similar
        technologies that are subject to their own privacy policies, not ours.
      </p>

      <h2>Links to other sites</h2>
      <p>
        {SITE_NAME} links extensively to articles on third-party news websites.
        Once you follow a link to another site, this policy no longer applies —
        please review the privacy policy of any site you visit.
      </p>

      <h2>Children&apos;s privacy</h2>
      <p>
        This site is intended for a general audience and does not knowingly
        collect personal information from children.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Changes are posted on this
        page with a revised &quot;last updated&quot; date.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy can be sent to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </PageShell>
  );
}

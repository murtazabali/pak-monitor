import type { Metadata } from "next";
import DigestView from "./DigestView";

export const metadata: Metadata = {
  title: "24-Hour News Digest",
  description:
    "A rolling 24-hour digest of Pakistan city news — top stories, trending topics and the people, places and organisations making headlines across monitored cities.",
  alternates: { canonical: "/digest" },
};

export default function DigestPage() {
  return <DigestView />;
}

import { topicMetadata } from "@/config/topics";
import TopicView from "@/app/components/topics/TopicView";

export const metadata = topicMetadata("fifa");

export default function FifaPage() {
  return <TopicView slug="fifa" />;
}

import { topicMetadata } from "@/config/topics";
import TopicView from "@/app/components/topics/TopicView";

export const metadata = topicMetadata("stocks");

export default function StocksPage() {
  return <TopicView slug="stocks" />;
}

import type { Metadata } from "next";
import StocksView from "./StocksView";

export const metadata: Metadata = {
  title: "Pakistan Stocks — KSE-100 & Market News",
  description:
    "Live KSE-100 index, top gainers and losers on the Pakistan Stock Exchange (PSX), and the latest Pakistani stock-market and business headlines — aggregated in real time.",
  keywords: [
    "KSE-100",
    "KSE 100 index",
    "PSX",
    "Pakistan Stock Exchange",
    "Pakistan stocks",
    "PSX market watch",
    "KSE-100 today",
    "Pakistan stock market news",
  ],
  alternates: { canonical: "/stocks" },
};

export default function StocksPage() {
  return <StocksView />;
}

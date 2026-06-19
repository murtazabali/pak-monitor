import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CITIES, CITY_BY_SLUG } from "@/config/cities";
import { SITE_NAME } from "@/config/site";
import CityView from "./CityView";

export function generateStaticParams() {
  return CITIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = CITY_BY_SLUG[slug];
  if (!city) return {};

  const title = `${city.name} News — Live Updates`;
  const description = `Live, realtime news from ${city.name}, ${city.province}. Track breaking news, crime, politics, weather and business across ${city.name} as it happens — aggregated from Pakistan's top outlets.`;
  const url = `/city/${city.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      locale: "en_PK",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = CITY_BY_SLUG[slug];
  if (!city) notFound();
  return <CityView slug={city.slug} name={city.name} province={city.province} />;
}

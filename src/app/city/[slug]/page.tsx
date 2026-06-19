import { notFound } from "next/navigation";
import { CITIES, CITY_BY_SLUG } from "@/config/cities";
import CityView from "./CityView";

export function generateStaticParams() {
  return CITIES.map((c) => ({ slug: c.slug }));
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = CITY_BY_SLUG[slug];
  if (!city) notFound();
  return <CityView slug={city.slug} name={city.name} province={city.province} />;
}

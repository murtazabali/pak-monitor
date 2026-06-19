"use client";

import { useMemo } from "react";
import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import pakistanGeo from "@/data/pakistan.geo.json";
import type { City } from "@/lib/types";

const W = 720;
const H = 560;

interface Props {
  cities: City[];
  selected: string[];
  counts: Record<string, number>;
  pulsing: Set<string>;
  onToggle: (slug: string) => void;
}

export default function PakistanMap({ cities, selected, counts, pulsing, onToggle }: Props) {
  const { countryPath, points } = useMemo(() => {
    // GeoJSON typings are loose; cast through unknown for the projection fit.
    const fc = pakistanGeo as unknown as GeoPermissibleObjects;
    const projection = geoMercator().fitExtent(
      [
        [30, 30],
        [W - 30, H - 30],
      ],
      fc,
    );
    const path = geoPath(projection);
    const d = path(fc) ?? "";
    const pts = cities.map((c) => {
      const xy = projection([c.lng, c.lat]);
      return { city: c, x: xy ? xy[0] : null, y: xy ? xy[1] : null };
    });
    return { countryPath: d, points: pts };
  }, [cities]);

  const allActive = selected.length === 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-full w-full"
      role="img"
      aria-label="Map of Pakistan showing live news activity by city"
    >
      <defs>
        <radialGradient id="seaGlow" cx="55%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#0b1830" />
          <stop offset="100%" stopColor="#070b13" />
        </radialGradient>
        <linearGradient id="landFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16243f" />
          <stop offset="100%" stopColor="#0e1a2e" />
        </linearGradient>
        <filter id="nodeGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width={W} height={H} fill="url(#seaGlow)" />

      {/* soft outer glow of the border */}
      <path d={countryPath} fill="none" stroke="#2bd4ee" strokeOpacity={0.1} strokeWidth={7} filter="url(#nodeGlow)" />
      {/* the country */}
      <path
        d={countryPath}
        fill="url(#landFill)"
        stroke="#3fd8ef"
        strokeOpacity={0.6}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />

      {points.map(({ city, x, y }) => {
        if (x === null || y === null) return null;
        const active = allActive || selected.includes(city.slug);
        const isPulsing = pulsing.has(city.slug);
        const count = counts[city.slug] ?? 0;
        const r = 3 + (Math.min(count, 50) / 50) * 4 + (active ? 1.5 : 0);
        const color = active ? "#22d3ee" : "#5b7290";

        return (
          <g
            key={city.slug}
            transform={`translate(${x},${y})`}
            onClick={() => onToggle(city.slug)}
            className="cursor-pointer"
          >
            <circle r={18} fill="transparent" />
            {isPulsing && (
              <circle
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={1.6}
                className="origin-center animate-pulse-ring"
              />
            )}
            {active && <circle r={r + 4} fill="none" stroke={color} strokeOpacity={0.45} strokeWidth={1} />}
            <circle
              r={r}
              fill={color}
              fillOpacity={active ? 1 : 0.7}
              filter={active ? "url(#nodeGlow)" : undefined}
            />
            <text
              x={r + 6}
              y={4}
              fontSize={12}
              className="pointer-events-none select-none font-mono"
              fill={active ? "#cbe9f5" : "#7d8aa5"}
              opacity={active ? 1 : 0.7}
            >
              {city.name}
              {count > 0 ? `  ${count}` : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/config/site";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded social-share card. Kept to Satori-safe CSS (flex layouts, no gap).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          backgroundColor: "#05070b",
          backgroundImage:
            "radial-gradient(900px circle at 78% 18%, rgba(34,211,238,0.18), transparent 60%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* LIVE badge */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "9px",
              backgroundColor: "#34d399",
              marginRight: "16px",
            }}
          />
          <div
            style={{
              fontSize: "30px",
              letterSpacing: "6px",
              color: "#22d3ee",
              fontWeight: 700,
            }}
          >
            LIVE · PAKISTAN
          </div>
        </div>

        {/* Title + tagline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "132px",
              fontWeight: 800,
              color: "#f1f5f9",
              lineHeight: 1,
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              fontSize: "52px",
              color: "#7d8aa5",
              marginTop: "24px",
            }}
          >
            {SITE_TAGLINE}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            fontSize: "30px",
            color: "#22d3ee",
            letterSpacing: "1px",
          }}
        >
          pak-monitor.netlify.app
        </div>
      </div>
    ),
    { ...size },
  );
}

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "Intel command center" dark palette
        base: {
          950: "#05070b",
          900: "#0a0e16",
          850: "#0e1320",
          800: "#121829",
          700: "#1b2236",
          600: "#283149",
        },
        edge: "#243049",
        accent: {
          DEFAULT: "#22d3ee", // cyan — live / primary
          soft: "#0e7490",
        },
        signal: {
          live: "#34d399", // emerald
          alert: "#f43f5e", // rose — crime/accident
          warn: "#f59e0b", // amber — weather
          info: "#60a5fa", // blue — politics/business
        },
        muted: "#7d8aa5",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.6)", opacity: "0.8" },
          "100%": { transform: "scale(2.6)", opacity: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
        "fade-in": "fade-in 0.25s ease-out",
        "slide-in": "slide-in 0.35s cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [],
};

export default config;

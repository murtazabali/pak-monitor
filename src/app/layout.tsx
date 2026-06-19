import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import PWARegister from "./components/PWARegister";

export const metadata: Metadata = {
  title: "Pak Monitor — Realtime Pakistan City News",
  description:
    "Live news monitor for Pakistani cities. Pick cities and watch everything happening there stream in, in real time.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070b",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}

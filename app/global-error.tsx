"use client";

import { DM_Sans, Fraunces } from "next/font/google";
import { StoreErrorPage } from "@/components/errors/StoreErrorPage";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`} style={{ backgroundColor: "#f7f7f7" }}>
      <body style={{ margin: 0, backgroundColor: "#f7f7f7" }}>
        <StoreErrorPage variant="server" onRetry={reset} />
      </body>
    </html>
  );
}

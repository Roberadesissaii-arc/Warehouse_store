"use client";

import type { LucideIcon } from "lucide-react";

type Tone = "brand" | "warn";

export function StoreIntroBanner({
  title,
  message,
  icon: Icon,
  tone = "brand",
}: {
  title: string;
  message: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div
      className={`store-status-banner${tone === "warn" ? " store-status-banner--warn" : ""}`}
      role="status"
    >
      <div className="store-status-banner__copy">
        <p className="store-status-banner__title">{title}</p>
        <p className="store-status-banner__text">{message}</p>
      </div>
      <Icon className="store-status-banner__icon" aria-hidden />
    </div>
  );
}

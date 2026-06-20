"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gauge, History, PackageCheck, Search } from "lucide-react";

const PROMOS = [
  {
    title: "Recently added",
    text: "Newest items in your warehouse",
    sectionId: "section-recent",
    icon: History,
  },
  {
    title: "Low stock",
    text: "Request a pick before they run out",
    sectionId: "section-low-stock",
    icon: Gauge,
  },
  {
    title: "Ready to pick",
    text: "Well-stocked shelves for fast robot picks",
    sectionId: "section-well-stocked",
    icon: PackageCheck,
  },
  {
    title: "Browse all",
    text: "See everything on the shelf",
    href: "/shop",
    icon: Search,
  },
] as const;

function scrollToHomeSection(sectionId: string) {
  const target = document.getElementById(sectionId);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function PromoStrip() {
  const router = useRouter();

  function onPromoClick(sectionId: string) {
    if (window.location.pathname !== "/") {
      router.push(`/#${sectionId}`);
      return;
    }
    scrollToHomeSection(sectionId);
  }

  return (
    <section className="promo-strip" aria-label="Quick browse">
      {PROMOS.map((promo) => {
        const Icon = promo.icon;
        if ("href" in promo) {
          return (
            <Link key={promo.href} href={promo.href} className="promo-card">
              <span className="promo-card-icon" aria-hidden>
                <Icon size={22} strokeWidth={2} />
              </span>
              <span className="promo-card-text">
                <strong>{promo.title}</strong>
                <small>{promo.text}</small>
              </span>
            </Link>
          );
        }

        return (
          <button
            key={promo.sectionId}
            type="button"
            className="promo-card"
            onClick={() => onPromoClick(promo.sectionId)}
          >
            <span className="promo-card-icon" aria-hidden>
              <Icon size={22} strokeWidth={2} />
            </span>
            <span className="promo-card-text">
              <strong>{promo.title}</strong>
              <small>{promo.text}</small>
            </span>
          </button>
        );
      })}
    </section>
  );
}

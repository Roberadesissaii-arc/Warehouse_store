"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StoreProduct } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";

function updateTrackState(track: HTMLDivElement, setState: (s: { overflow: boolean; atStart: boolean; atEnd: boolean }) => void) {
  const overflow = track.scrollWidth > track.clientWidth + 2;
  const max = Math.max(0, track.scrollWidth - track.clientWidth);
  setState({
    overflow,
    atStart: track.scrollLeft <= 2,
    atEnd: track.scrollLeft >= max - 2,
  });
}

export function ProductRow({
  id,
  title,
  subtitle,
  href,
  products,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  href?: string;
  products: StoreProduct[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [nav, setNav] = useState({ overflow: false, atStart: true, atEnd: false });

  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    updateTrackState(track, setNav);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    sync();
    track.addEventListener("scroll", sync, { passive: true });

    const ro = new ResizeObserver(sync);
    ro.observe(track);

    return () => {
      track.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [products.length, sync]);

  function scrollBy(direction: "prev" | "next") {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(".product-card");
    const gap = Number.parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || "12") || 12;
    const delta = (card?.offsetWidth || 178) + gap;
    track.scrollBy({
      left: direction === "next" ? delta : -delta,
      behavior: "smooth",
    });
  }

  if (!products.length) return null;

  return (
    <section className="store-row" id={id}>
      <div className="store-row-head">
        <div className="store-row-head-text">
          <h2 className="store-row-title">{title}</h2>
          {subtitle ? <p className="store-row-sub">{subtitle}</p> : null}
        </div>
        {nav.overflow ? (
          <div className="store-row-nav" aria-hidden={false}>
            <button
              type="button"
              className="store-row-arrow"
              aria-label="Show previous items"
              disabled={nav.atStart}
              onClick={() => scrollBy("prev")}
            >
              <ChevronLeft size={18} strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              className="store-row-arrow"
              aria-label="Show more items"
              disabled={nav.atEnd}
              onClick={() => scrollBy("next")}
            >
              <ChevronRight size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
        ) : null}
        {href ? (
          <Link href={href} className="store-row-link">
            See all
          </Link>
        ) : null}
      </div>
      <div
        ref={trackRef}
        className={`store-row-track${nav.overflow ? " has-overflow" : ""}`}
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

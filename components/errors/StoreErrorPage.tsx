"use client";

import Image from "next/image";
import Link from "next/link";
import { storeImages } from "@/lib/images";

type ErrorVariant = "notFound" | "server";

const COPY: Record<
  ErrorVariant,
  { code: string; title: string; lead: string; detail: string; image: string; imageAlt: string }
> = {
  notFound: {
    code: "404",
    title: "Shelf not found",
    lead: "That page isn't in our warehouse catalog.",
    detail: "The link may be wrong, or this item was moved off the shelf.",
    image: storeImages.errors.notFound,
    imageAlt: "Illustration of a parcel that could not be located",
  },
  server: {
    code: "500",
    title: "Something went wrong",
    lead: "We couldn't load this page right now.",
    detail: "Try reloading — if the warehouse API is starting up, give it a moment and try again.",
    image: storeImages.errors.serverError,
    imageAlt: "Illustration of a parcel loading issue",
  },
};

export function StoreErrorPage({
  variant,
  onRetry,
}: {
  variant: ErrorVariant;
  onRetry?: () => void;
}) {
  const copy = COPY[variant];

  return (
    <div className="store-error-page">
      <div className="m-lab-hero store-error-hero">
        <div className="m-lab-hero-top">
          <p className="m-lab-hero-eyebrow">{copy.code}</p>
          <span className="m-lab-hero-badge">Lab</span>
        </div>
        <h1>{copy.title}</h1>
        <p className="m-lab-hero-lead">{copy.lead}</p>
        <div className="m-lab-hero-dot" aria-hidden />
      </div>

      <div className="store-error-card">
        <div className="store-error-art" aria-hidden>
          <Image
            src={copy.image}
            alt=""
            width={320}
            height={320}
            className="store-error-art-img"
            priority
          />
        </div>
        <p className="store-error-detail">{copy.detail}</p>
        <div className="store-error-actions">
          {onRetry ? (
            <button type="button" className="m-btn m-btn--primary" onClick={onRetry}>
              Reload
            </button>
          ) : null}
          <Link href="/" className="m-btn">
            Back to store
          </Link>
          {variant === "notFound" ? (
            <Link href="/shop" className="m-btn">
              Browse inventory
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

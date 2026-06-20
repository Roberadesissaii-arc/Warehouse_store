"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { GalleryVerticalEnd } from "lucide-react";
import { useAccount } from "@/components/AccountProvider";
import { useBag } from "@/components/BagProvider";
import { useCatalog } from "@/components/CatalogProvider";
import { MobileLabHero } from "@/components/mobile/MobileLabHero";
import { AccountSubpageFrame } from "@/components/account/AccountSubpageFrame";
import { PickCartItem } from "@/components/bag/PickCartItem";
import { useIsMobile } from "@/hooks/useIsMobile";
import { pickListCopy } from "@/lib/pickList";
import type { StoreProduct } from "@/lib/api";
import { type BagLine } from "@/lib/store";

type EnrichedLine = BagLine & { product?: StoreProduct };

function zoneKey(product?: StoreProduct) {
  return product?.location?.section || "Unassigned";
}

function PickListContent({
  lines,
  enriched,
  count,
  zones,
  onReview,
  onClear,
  onQty,
  onRemove,
  signedIn,
}: {
  lines: BagLine[];
  enriched: EnrichedLine[];
  count: number;
  zones: Array<[string, number]>;
  onReview: () => void;
  onClear: () => void;
  onQty: (itemId: number, qty: number) => void;
  onRemove: (itemId: number) => void;
  signedIn: boolean;
}) {
  return (
    <>
      <div className="pl-m-toolbar">
        {lines.length ? (
          <button type="button" className="pl-m-toolbar-btn" onClick={onClear}>
            Clear all
          </button>
        ) : null}
        <Link href="/shop" className="pl-m-toolbar-btn pl-m-toolbar-btn--primary">
          Add items
        </Link>
      </div>

      {!lines.length ? (
        <div className="pl-cart-empty">
          <div className="pl-cart-empty-icon" aria-hidden>
            <GalleryVerticalEnd size={32} strokeWidth={1.75} />
          </div>
          <h2>{pickListCopy.empty}</h2>
          <p>{pickListCopy.emptyHint}</p>
          <Link href="/shop" className="pl-m-toolbar-btn pl-m-toolbar-btn--primary pl-cart-empty-cta">
            {pickListCopy.browseInventory}
          </Link>
        </div>
      ) : (
        <>
          <div className="pl-cart-intro">
            <div className="pl-cart-intro-head">
              <h2>{pickListCopy.itemsHeading}</h2>
              <span className="pl-cart-count">
                {count} unit{count === 1 ? "" : "s"}
              </span>
            </div>
            {zones.length ? (
              <div className="pl-cart-zones" aria-label="Pick zones">
                {zones.map(([name, qty]) => (
                  <span key={name} className="pl-cart-zone-pill">
                    {name} · {qty}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="pl-cart-items">
            <div className="pl-cart-list">
              {enriched.map((line) => (
                <PickCartItem
                  key={line.item_id}
                  line={line}
                  product={line.product}
                  onQty={(qty) => onQty(line.item_id, qty)}
                  onRemove={() => onRemove(line.item_id)}
                />
              ))}
            </div>
          </div>

          <button type="button" className="pl-review-btn" onClick={onReview}>
            {signedIn ? pickListCopy.dispatch : "Sign in to review pick"}
          </button>
        </>
      )}
    </>
  );
}

export function BagClient() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { lines, setQty, remove, clear, count } = useBag();
  const { products } = useCatalog();
  const { signedIn } = useAccount();

  const enriched = useMemo<EnrichedLine[]>(
    () => lines.map((line) => ({ ...line, product: products.find((p) => p.id === line.item_id) })),
    [lines, products],
  );

  const zones = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of enriched) {
      const key = zoneKey(line.product);
      map.set(key, (map.get(key) || 0) + line.quantity);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [enriched]);

  function goToReview() {
    if (!lines.length) return;
    if (!signedIn) {
      router.push("/sign-in?next=/bag/review&intent=checkout");
      return;
    }
    router.push("/bag/review");
  }

  const heroLead = lines.length
    ? `${count} unit${count === 1 ? "" : "s"} · ${lines.length} line${lines.length === 1 ? "" : "s"} · ${zones.length} zone${zones.length === 1 ? "" : "s"}`
    : "Queue shelf stock, then review and send a pick to your floor";

  const content = (
    <PickListContent
      lines={lines}
      enriched={enriched}
      count={count}
      zones={zones}
      onReview={goToReview}
      onClear={clear}
      onQty={setQty}
      onRemove={remove}
      signedIn={signedIn}
    />
  );

  if (isMobile === null) {
    return <div className="empty-state">Loading…</div>;
  }

  if (isMobile) {
    return (
      <div className="pl-page pl-page--mobile">
        <MobileLabHero eyebrow="Your lab queue" title={pickListCopy.title} lead={heroLead} />
        <div className="pl-m-body">
          <div className="pl-m-card">{content}</div>
        </div>
      </div>
    );
  }

  return (
    <AccountSubpageFrame
      eyebrow="Your pick list"
      title={lines.length ? "Ready to send a pick" : "Your pick list"}
      lead={
        lines.length
          ? heroLead
          : "Browse your warehouse and add items to pick from the shelf."
      }
      pills={["Live shelf stock", "Robot pick", "Standard & rush"]}
    >
      <section className="store-row account-panel">{content}</section>
    </AccountSubpageFrame>
  );
}

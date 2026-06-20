"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Package, Zap } from "lucide-react";
import { useAccount } from "@/components/AccountProvider";
import { useBag } from "@/components/BagProvider";
import { useCatalog } from "@/components/CatalogProvider";
import { useToast } from "@/components/ToastProvider";
import { MobileLabHero } from "@/components/mobile/MobileLabHero";
import { useIsMobile } from "@/hooks/useIsMobile";
import { checkoutPick } from "@/lib/checkoutPick";
import { locationLabel } from "@/lib/products";
import { pickListCopy } from "@/lib/pickList";
import type { StoreProduct } from "@/lib/api";

function zoneKey(product?: StoreProduct) {
  return product?.location?.section || "Unassigned";
}

export function BagReviewClient() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { lines, count, clear, draftPriority, draftNote } = useBag();
  const { products } = useCatalog();
  const { account, signedIn, refresh, updatePreferences } = useAccount();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const enriched = useMemo(
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

  const zoneSummary = zones.map(([zone, qty]) => `${zone} (${qty})`).join(", ");

  async function confirmSend() {
    if (!lines.length || !signedIn || !account) return;
    setBusy(true);
    try {
      const orderRef = await checkoutPick({
        lines,
        customerName: account.name || account.email || "Warehouse",
        priority: draftPriority,
        note: draftNote,
      });
      await refresh();
      clear();
      void updatePreferences({ priority: draftPriority, note: draftNote.trim() });
      router.push(`/account/orders/${encodeURIComponent(orderRef)}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not send pick", true);
      setBusy(false);
    }
  }

  if (isMobile === null) {
    return <div className="empty-state">Loading…</div>;
  }

  if (!lines.length) {
    return (
      <div className={isMobile ? "pl-page pl-page--mobile" : "pl-page pl-page--desktop"}>
        <MobileLabHero
          eyebrow="Review"
          title="Nothing to send"
          lead="Your pick list is empty. Add items before reviewing a pick."
        />
        <div className="pl-m-body">
          <div className="pl-m-card">
            <Link href="/bag" className="pl-review-back">
              <ArrowLeft size={16} aria-hidden />
              {pickListCopy.reviewBack}
            </Link>
            <div className="pl-cart-empty">
              <p>{pickListCopy.emptyHint}</p>
              <Link href="/shop" className="m-btn m-btn--primary">
                {pickListCopy.browseInventory}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const shell = (
    <>
      <MobileLabHero
        eyebrow="Final check"
        title={pickListCopy.reviewTitle}
        lead={pickListCopy.reviewLead}
      />
      <div className="pl-m-body">
        <div className="pl-m-card">
          <Link href="/bag" className="pl-review-back">
            <ArrowLeft size={16} aria-hidden />
            {pickListCopy.reviewBack}
          </Link>

          <div className="pl-review-summary">
            <p>
              <Package size={14} aria-hidden />
              {count} unit{count === 1 ? "" : "s"} · {lines.length} line{lines.length === 1 ? "" : "s"}
            </p>
            {zoneSummary ? (
              <p>
                <MapPin size={14} aria-hidden />
                {zoneSummary}
              </p>
            ) : null}
            <p>
              <Zap size={14} aria-hidden />
              {draftPriority === "rush" ? "Priority pick" : "Standard pick"}
            </p>
            {draftNote.trim() ? <p className="pl-review-note">{draftNote.trim()}</p> : null}
          </div>

          <ul className="pl-review-lines">
            {enriched.map((line) => (
              <li key={line.item_id}>
                <strong>{line.name || `Item #${line.item_id}`}</strong>
                <span>
                  {line.quantity}×
                  {line.sku ? ` · SKU ${line.sku}` : ""}
                  {line.product ? ` · ${locationLabel(line.product)}` : ""}
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="pl-review-btn"
            disabled={busy}
            onClick={() => {
              if (!signedIn) {
                router.push("/sign-in?next=/bag/review&intent=checkout");
                return;
              }
              void confirmSend();
            }}
          >
            {busy ? "Sending…" : signedIn ? pickListCopy.reviewConfirm : "Sign in to send pick"}
          </button>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return <div className="pl-page pl-page--mobile">{shell}</div>;
  }

  return <div className="pl-page pl-page--desktop">{shell}</div>;
}

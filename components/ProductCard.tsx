"use client";

import Link from "next/link";
import { Check, ListPlus } from "lucide-react";
import type { StoreProduct } from "@/lib/api";
import { locationLabel, productInitials, productPalette, productStockMeta, stockBadge } from "@/lib/products";
import { pickListCopy } from "@/lib/pickList";
import { cn } from "@/lib/utils";
import { useBag } from "./BagProvider";
import { useToast } from "./ToastProvider";

export function ProductCard({
  product,
  showBadge = false,
  compact = false,
}: {
  product: StoreProduct;
  showBadge?: boolean;
  compact?: boolean;
}) {
  const { add, lines } = useBag();
  const { showToast } = useToast();
  const inPickList = lines.some((line) => line.item_id === product.id);
  const [from, to] = productPalette(product.id);
  const initials = productInitials(product.name);
  const badge = stockBadge(product.quantity);

  function onAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (product.quantity < 1) {
      showToast("Out of stock on the shelf", true);
      return;
    }
    add({
      item_id: product.id,
      quantity: 1,
      name: product.name,
      sku: product.sku || undefined,
    });
    showToast(pickListCopy.added(product.name));
  }

  return (
    <Link
      href={`/product/${product.id}`}
      className={cn("product-card", compact && "product-card--compact")}
    >
      <div
        className="product-card-thumb"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        {showBadge ? (
          <span className={cn("product-card-badge", `product-card-badge--${badge.tone}`)}>
            {badge.label}
          </span>
        ) : null}
        <span>{initials}</span>
      </div>
      <div className="product-card-body">
        <p className="product-card-name">{product.name}</p>
        <p className="product-card-meta">
          {showBadge ? productStockMeta(product) : `${locationLabel(product)}${locationLabel(product) ? " · " : ""}${product.quantity <= 3 && product.quantity > 0 ? `Only ${product.quantity} left` : product.quantity > 0 ? "In stock" : "Out of stock"}`}
        </p>
        {!compact ? (
          <button
            type="button"
            className={cn("product-card-add pick-add-btn", inPickList && "pick-add-btn--added")}
            onClick={onAdd}
            aria-pressed={inPickList}
          >
            {inPickList ? <Check size={16} strokeWidth={2.5} /> : <ListPlus size={16} />}
            {inPickList ? (
              pickListCopy.buttonAdded
            ) : (
              <>
                <span className="product-card-add-label product-card-add-label--long">{pickListCopy.add}</span>
                <span className="product-card-add-label product-card-add-label--short">{pickListCopy.addShort}</span>
              </>
            )}
          </button>
        ) : null}
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return <div className={cn("product-card", "product-card--skeleton")} aria-hidden />;
}

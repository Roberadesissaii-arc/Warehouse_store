"use client";

import Link from "next/link";
import { MapPin, Minus, Plus, Trash2 } from "lucide-react";
import type { StoreProduct } from "@/lib/api";
import type { BagLine } from "@/lib/store";
import { locationLabel, productInitials, productPalette, stockLabel } from "@/lib/products";

export function PickCartItem({
  line,
  product,
  onQty,
  onRemove,
}: {
  line: BagLine;
  product?: StoreProduct;
  onQty: (qty: number) => void;
  onRemove: () => void;
}) {
  const [from, to] = productPalette(line.item_id);
  const shelfQty = product?.quantity ?? 0;
  const name = line.name || `Item #${line.item_id}`;
  const loc = product ? locationLabel(product) : "";
  const stock = shelfQty > 0 ? stockLabel(shelfQty) : "Out of stock";

  return (
    <article className="pl-line">
      <Link href={`/product/${line.item_id}`} className="pl-line-thumb" aria-label={name}>
        <div style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
          <span>{productInitials(name)}</span>
        </div>
      </Link>

      <div className="pl-line-main">
        <Link href={`/product/${line.item_id}`} className="pl-line-title">
          {name}
        </Link>
        <p className="pl-line-meta">
          {line.sku ? <span>SKU {line.sku}</span> : null}
          {line.sku && loc ? <span className="pl-line-dot" aria-hidden>·</span> : null}
          {loc ? (
            <span className="pl-line-loc">
              <MapPin size={12} aria-hidden />
              {loc}
            </span>
          ) : null}
          <span className="pl-line-dot" aria-hidden>·</span>
          <span>{stock}</span>
        </p>
      </div>

      <div className="pl-line-actions">
        <div className="qty-row qty-row--line" aria-label="Quantity">
          <button type="button" aria-label="Decrease quantity" onClick={() => onQty(line.quantity - 1)}>
            <Minus size={14} />
          </button>
          <span className="pl-line-qty-value">{line.quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => onQty(Math.min(line.quantity + 1, shelfQty || line.quantity + 1))}
          >
            <Plus size={14} />
          </button>
        </div>
        <button type="button" className="pl-line-remove" onClick={onRemove} aria-label={`Remove ${name}`}>
          <Trash2 size={15} aria-hidden />
        </button>
      </div>
    </article>
  );
}

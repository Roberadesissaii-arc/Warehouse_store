"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, GalleryVerticalEnd, MapPin, Minus, Plus, ListPlus, PackageCheck } from "lucide-react";
import type { StoreProduct } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { MobileLabHero } from "@/components/mobile/MobileLabHero";
import { useBag } from "@/components/BagProvider";
import { useCatalog } from "@/components/CatalogProvider";
import { useToast } from "@/components/ToastProvider";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  aisleItemLabel,
  locationLabel,
  productInitials,
  productPalette,
  productStockMeta,
  stockBadge,
} from "@/lib/products";
import { pickListCopy } from "@/lib/pickList";
import { cn } from "@/lib/utils";

function ProductBreadcrumb({ product }: { product: StoreProduct }) {
  const section = product.location?.section;

  return (
    <nav className="product-detail-crumb" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      <span aria-hidden>/</span>
      <Link href="/shop">Shop</Link>
      {section ? (
        <>
          <span aria-hidden>/</span>
          <Link href={`/shop?section=${encodeURIComponent(section)}`}>{section}</Link>
        </>
      ) : null}
      <span aria-hidden>/</span>
      <span aria-current="page">{product.name}</span>
    </nav>
  );
}

function LocationGrid({ product }: { product: StoreProduct }) {
  const loc = product.location;
  const rows: Array<[string, string]> = [];
  if (loc?.warehouse) rows.push(["Warehouse", loc.warehouse]);
  if (loc?.section) rows.push(["Aisle", loc.section]);
  if (loc?.shelf) rows.push(["Bay", loc.shelf]);
  if (product.sku) rows.push(["SKU", product.sku]);
  if (!rows.length) return null;

  return (
    <dl className="product-detail-meta">
      {rows.map(([label, value]) => (
        <div key={label} className="product-detail-meta-row">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ProductDetail({
  product,
  related,
  mobile,
}: {
  product: StoreProduct;
  related: StoreProduct[];
  mobile?: boolean;
}) {
  const { add, lines } = useBag();
  const { showToast } = useToast();
  const inPickList = lines.some((line) => line.item_id === product.id);
  const [qty, setQty] = useState(1);
  const [from, to] = productPalette(product.id);
  const maxQty = Math.max(product.quantity, 1);
  const badge = stockBadge(product.quantity);
  const section = product.location?.section;

  function onAdd() {
    if (product.quantity < 1) {
      showToast("Out of stock on the shelf", true);
      return;
    }
    add({
      item_id: product.id,
      quantity: qty,
      name: product.name,
      sku: product.sku || undefined,
    });
    showToast(pickListCopy.addedQty(qty, product.name));
  }

  const mediaBlock = (
    <section className="store-row product-detail-media" aria-label="Product preview">
      <div
        className="product-detail-thumb"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        <span className="product-detail-initials">{productInitials(product.name)}</span>
      </div>
    </section>
  );

  const panelBlock = (
    <section className="store-row product-detail-panel" aria-label="Queue for pick">
      <div className="product-detail-panel-head">
        <span className={`product-detail-badge product-detail-badge--${badge.tone}`}>{badge.label}</span>
        <h2>Queue for your pick list</h2>
        <p className="product-detail-panel-lead">
          Add how many you need — then open your pick list and send a floor pick to bring it to your bench.
        </p>
      </div>

      <LocationGrid product={product} />

      <div className="product-detail-actions">
        <div className="product-detail-qty">
          <label htmlFor="product-qty">Quantity</label>
          <div className="qty-row qty-row--product">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQty((n) => Math.max(1, n - 1))}
            >
              <Minus size={16} />
            </button>
            <input
              id="product-qty"
              className="qty-input"
              type="number"
              min={1}
              max={maxQty}
              value={qty}
              onChange={(e) => setQty(Math.min(maxQty, Math.max(1, Number(e.target.value) || 1)))}
              inputMode="numeric"
              aria-label="Quantity"
            />
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQty((n) => Math.min(maxQty, n + 1))}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <button
          type="button"
          className={cn(
            "pick-add-btn btn-add-product",
            mobile ? "m-btn m-btn--primary" : "btn-primary",
            inPickList && "pick-add-btn--added",
          )}
          disabled={product.quantity < 1}
          onClick={onAdd}
          aria-pressed={inPickList}
        >
          {inPickList ? (
            <Check size={18} strokeWidth={2.5} aria-hidden />
          ) : (
            <ListPlus size={18} strokeWidth={2.2} aria-hidden />
          )}
          {inPickList ? pickListCopy.buttonAdded : pickListCopy.add}
        </button>

        <Link
          href="/bag"
          className={mobile ? "m-btn product-detail-view-list" : "btn-secondary product-detail-view-list"}
        >
          <GalleryVerticalEnd size={18} strokeWidth={2} aria-hidden />
          {pickListCopy.view}
        </Link>
      </div>

      <ul className="product-detail-perks">
        <li>
          <PackageCheck size={18} strokeWidth={2} aria-hidden />
          Live count from your warehouse shelf
        </li>
        <li>
          <MapPin size={18} strokeWidth={2} aria-hidden />
          Pick routes to this item&apos;s aisle on the floor
        </li>
      </ul>
    </section>
  );

  const relatedBlock =
    related.length >= 2 && section ? (
      <section className="store-row product-detail-related" aria-label="Related products">
        <div className="store-row-head">
          <div className="store-row-head-text">
            <h2 className="store-row-title">More in {section}</h2>
            <p className="store-row-sub">{aisleItemLabel(related.length)}</p>
          </div>
          <Link href={`/shop?section=${encodeURIComponent(section)}`} className="store-row-link">
            See all
          </Link>
        </div>
        <div className="product-grid product-grid--shop">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} showBadge />
          ))}
        </div>
      </section>
    ) : null;

  if (mobile) {
    return (
      <div className="product-detail-page product-detail-page--mobile">
        <MobileLabHero
          eyebrow={section || "On your shelf"}
          title={product.name}
          lead={productStockMeta(product)}
        />

        <div className="product-m-body">
          <ProductBreadcrumb product={product} />

          <div className="product-detail-layout">
            {mediaBlock}
            {panelBlock}
          </div>

          {relatedBlock}
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <section className="hero" aria-labelledby="product-title">
        <div className="hero-inner">
          <p className="hero-eyebrow">{section || "On your shelf"}</p>
          <h1 id="product-title">{product.name}</h1>
          <p className="hero-lead">{productStockMeta(product)}</p>
          <div className="hero-pills">
            <span className="pill">{badge.label}</span>
            {product.sku ? <span className="pill">SKU {product.sku}</span> : null}
            {locationLabel(product) ? <span className="pill">{locationLabel(product)}</span> : null}
          </div>
        </div>
      </section>

      <div className="product-detail-body">
        <ProductBreadcrumb product={product} />

        <div className="product-detail-layout">
          {mediaBlock}
          {panelBlock}
        </div>

        {relatedBlock}
      </div>
    </div>
  );
}

function ProductPageSkeleton({ mobile }: { mobile?: boolean }) {
  return (
    <div className={mobile ? "product-detail-page product-detail-page--mobile" : "product-detail-page"}>
      <div
        className={mobile ? "m-lab-hero m-lab-hero--skeleton" : "hero hero--skeleton"}
        aria-hidden
      />
      <div className={mobile ? "product-m-body" : "product-detail-body"}>
        <div className="product-detail-layout">
          <div className="store-row product-detail-media product-detail-media--skeleton" aria-hidden />
          <div className="store-row product-detail-panel product-detail-panel--skeleton" aria-hidden />
        </div>
      </div>
    </div>
  );
}

function ProductNotFound({ mobile }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <div className="product-detail-page product-detail-page--mobile">
        <MobileLabHero
          eyebrow="Not found"
          title="Item not on the shelf"
          lead="This product may have been removed or is no longer in your warehouse catalog."
        />
        <div className="product-m-body">
          <section className="store-row product-detail-empty">
            <Link href="/shop" className="m-btn m-btn--primary">
              Browse inventory
            </Link>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <section className="hero" aria-labelledby="product-missing-title">
        <div className="hero-inner">
          <p className="hero-eyebrow">Not found</p>
          <h1 id="product-missing-title">Item not on the shelf</h1>
          <p className="hero-lead">This product may have been removed or is no longer in your warehouse catalog.</p>
        </div>
      </section>
      <div className="product-detail-body">
        <section className="store-row product-detail-empty">
          <Link href="/shop" className="btn-primary">
            Browse inventory
          </Link>
        </section>
      </div>
    </div>
  );
}

export function ProductClient({ productId }: { productId: number }) {
  const isMobile = useIsMobile();
  const { products, loading } = useCatalog();
  const product = products.find((p) => p.id === productId);

  const related = useMemo(() => {
    if (!product?.location?.section) return [];
    return products
      .filter((p) => p.id !== product.id && p.location?.section === product.location?.section)
      .slice(0, 5);
  }, [products, product]);

  if (loading || isMobile === null) {
    return <ProductPageSkeleton mobile={isMobile ?? undefined} />;
  }

  if (!product) {
    return <ProductNotFound mobile={isMobile} />;
  }

  return <ProductDetail key={product.id} product={product} related={related} mobile={isMobile} />;
}

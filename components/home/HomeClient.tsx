"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCatalog } from "@/components/CatalogProvider";
import { MobileLabHero } from "@/components/mobile/MobileLabHero";
import { PromoStrip } from "@/components/home/PromoStrip";
import { ProductRow } from "@/components/home/ProductRow";
import { HomePickQueueBanner } from "@/components/home/HomePickQueueBanner";
import { useIsMobile } from "@/hooks/useIsMobile";
import { buildCategories, sortByNewest } from "@/lib/products";

function HomeLoading({ mobile }: { mobile?: boolean }) {
  return (
    <div className={mobile ? "store-home store-home--mobile" : "store-home"}>
      <div className={mobile ? "m-lab-hero m-lab-hero--skeleton" : "hero hero--skeleton"} aria-hidden />
      <div className="shop-section">
        <div className="store-row store-row--skeleton" aria-hidden />
      </div>
    </div>
  );
}

function HomeContent({
  mobile,
  recent,
  lowStock,
  wellStocked,
  categories,
  hasProducts,
}: {
  mobile?: boolean;
  recent: ReturnType<typeof sortByNewest>;
  lowStock: ReturnType<typeof sortByNewest>;
  wellStocked: ReturnType<typeof sortByNewest>;
  categories: ReturnType<typeof buildCategories>;
  hasProducts: boolean;
}) {
  const body = (
    <div className={mobile ? "home-m-body" : "shop-section"}>
      <PromoStrip />

      {!hasProducts ? (
        <section className="store-empty-panel">
          <h2>No inventory yet</h2>
          <p>
            Add items in WarehouseDB first. This store reads your warehouse catalog over the API —
            nothing is stored here except your owner login and pick history.
          </p>
        </section>
      ) : (
        <>
          <ProductRow
            id="section-recent"
            title="Recently added"
            subtitle="Newest items in your warehouse"
            href="/shop?filter=recent"
            products={recent}
          />
          <ProductRow
            id="section-low-stock"
            title="Low stock"
            subtitle="Request a pick before they run out"
            href="/shop?filter=low-stock"
            products={lowStock}
          />
          <ProductRow
            id="section-well-stocked"
            title="Plenty in stock"
            subtitle="Well-stocked shelves"
            href="/shop?filter=well-stocked"
            products={wellStocked}
          />
          {categories.length ? (
            <section className="store-row store-row--sections">
              <div className="store-row-head">
                <div className="store-row-head-text">
                  <h2 className="store-row-title">Browse by section</h2>
                  <p className="store-row-sub">Jump to a warehouse section</p>
                </div>
                <Link href="/shop" className="store-row-link">
                  All items
                </Link>
              </div>
              <div className="category-grid">
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={`/shop?section=${encodeURIComponent(cat.name)}`}
                    className="category-card"
                  >
                    <strong>{cat.name}</strong>
                    <span>
                      {cat.count} item{cat.count === 1 ? "" : "s"}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          <HomePickQueueBanner />
        </>
      )}
    </div>
  );

  if (mobile) {
    return (
      <div className="store-home store-home--mobile">
        <MobileLabHero
          eyebrow="Your personal lab"
          title="What's on the shelf"
          lead="Browse stock, build your pick list, and send picks to the floor."
        />
        {body}
      </div>
    );
  }

  return (
    <div className="store-home">
      <section className="hero" aria-labelledby="store-home-title">
        <div className="hero-inner">
          <p className="hero-eyebrow">Your personal lab</p>
          <h1 id="store-home-title">
            See what&apos;s on the shelf.
            <br />
            Queue a robot pick when you need it.
          </h1>
          <p className="hero-lead">
            Browse your warehouse stock, build a pick list, and tell the floor what to bring to your bench.
            New arrivals get shelved here first — you&apos;re not ordering for delivery, you&apos;re directing your own inventory.
          </p>
          <div className="hero-pills">
            <span className="pill">Live shelf counts</span>
            <span className="pill">Robot pick & bring</span>
            <span className="pill">New stock → shelf</span>
          </div>
        </div>
      </section>
      {body}
    </div>
  );
}

export function HomeClient() {
  const isMobile = useIsMobile();
  const { products, loading } = useCatalog();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash.startsWith("section-")) return;

    const timer = window.setTimeout(() => {
      const target = document.getElementById(hash);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [loading]);

  if (loading || isMobile === null) {
    return <HomeLoading mobile={isMobile ?? false} />;
  }

  const recent = sortByNewest(products).slice(0, 12);
  const lowStock = products.filter((p) => p.quantity <= 3).slice(0, 12);
  const wellStocked = [...products]
    .filter((p) => p.quantity > 3)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 12);
  const categories = buildCategories(products).slice(0, 6);

  return (
    <HomeContent
      mobile={isMobile}
      recent={recent}
      lowStock={lowStock}
      wellStocked={wellStocked}
      categories={categories}
      hasProducts={products.length > 0}
    />
  );
}

"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useCatalog } from "@/components/CatalogProvider";
import { ProductCard } from "@/components/ProductCard";
import { MobileLabHero } from "@/components/mobile/MobileLabHero";
import { ShopToolbar } from "@/components/shop/ShopToolbar";
import { useIsMobile } from "@/hooks/useIsMobile";
import { buildCategories, groupProductsBySection, sortByNewest } from "@/lib/products";
import type { StoreProduct } from "@/lib/api";

function ShopLoading({ mobile }: { mobile?: boolean }) {
  return (
    <div className={mobile ? "store-shop store-shop--mobile" : "store-shop"}>
      <div
        className={mobile ? "m-lab-hero m-lab-hero--skeleton" : "hero hero--skeleton"}
        aria-hidden
      />
      <div className={mobile ? "shop-m-body" : "shop-section"}>
        <div className="shop-toolbar shop-toolbar--skeleton" aria-hidden />
        <div className="store-row store-row--skeleton" aria-hidden />
      </div>
    </div>
  );
}

function heroCopy({
  q,
  section,
  filter,
  count,
}: {
  q: string;
  section: string;
  filter: string;
  count: number;
}) {
  if (q) {
    return {
      eyebrow: "Search results",
      title: `Results for “${q}”`,
      lead: `${count} matching item${count === 1 ? "" : "s"} on the shelf. Add any line to your pick list when you need a floor pick.`,
      pills: ["Live stock", "Pick list", "Robot bring-to-you"],
    };
  }
  if (section) {
    return {
      eyebrow: "Warehouse section",
      title: section,
      lead: `${count} item${count === 1 ? "" : "s"} in this section. Queue what you need — no account required to browse.`,
      pills: ["Section filter", "Live locations", "Add to pick list"],
    };
  }
  if (filter === "recent") {
    return {
      eyebrow: "Recently added",
      title: "Newest on the shelf",
      lead: "Fresh lines from WarehouseDB — queue a pick before something runs out.",
      pills: ["New arrivals", "Live stock", "Pick list"],
    };
  }
  if (filter === "low-stock") {
    return {
      eyebrow: "Low stock",
      title: "Running low on the shelf",
      lead: `${count} item${count === 1 ? "" : "s"} with three or fewer units left. Request a pick while stock is still there.`,
      pills: ["Stock watch", "Priority picks", "Live counts"],
    };
  }
  if (filter === "well-stocked") {
    return {
      eyebrow: "Ready to pick",
      title: "Well-stocked shelves",
      lead: `${count} item${count === 1 ? "" : "s"} with plenty on hand — fast picks from the floor.`,
      pills: ["High availability", "Robot picks", "Live stock"],
    };
  }
  return {
    eyebrow: "Browse inventory",
    title: "Everything on the shelf",
    lead: "Browse your full warehouse catalog by section, search for a part, and add items to your pick list.",
    pills: ["Live stock", "By section", "Pick list"],
  };
}

function ProductGrid({ items }: { items: StoreProduct[] }) {
  return (
    <div className="product-grid product-grid--shop">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} showBadge />
      ))}
    </div>
  );
}

function CategorySection({ name, items }: { name: string; items: StoreProduct[] }) {
  return (
    <section className="store-row store-row--catalog" aria-labelledby={`shop-section-${name}`}>
      <div className="store-row-head">
        <div className="store-row-head-text">
          <h2 className="store-row-title" id={`shop-section-${name}`}>
            {name}
          </h2>
          <p className="store-row-sub">
            {items.length} item{items.length === 1 ? "" : "s"} in this section
          </p>
        </div>
      </div>
      <ProductGrid items={items} />
    </section>
  );
}

function ShopCatalog({
  products,
  filtered,
  grouped,
  showGrouped,
  categoryCount,
  error,
}: {
  products: StoreProduct[];
  filtered: StoreProduct[];
  grouped: ReturnType<typeof groupProductsBySection>;
  showGrouped: boolean;
  categoryCount: number;
  error: string | null;
}) {
  return (
    <>
      <ShopToolbar products={products} />

      {error ? (
        <section className="store-row store-row--catalog">
          <div className="store-alert">{error}</div>
        </section>
      ) : !filtered.length ? (
        <section className="store-row store-row--catalog">
          <div className="empty-state">No products match this browse view.</div>
        </section>
      ) : showGrouped ? (
        <>
          <p className="shop-section-summary">
            {filtered.length} item{filtered.length === 1 ? "" : "s"} across {categoryCount} warehouse section
            {categoryCount === 1 ? "" : "s"}
          </p>
          {grouped.map(({ name, items }) => (
            <CategorySection key={name} name={name} items={items} />
          ))}
        </>
      ) : (
        <section className="store-row store-row--catalog" aria-label="Product catalog">
          <div className="store-row-head">
            <div className="store-row-head-text">
              <h2 className="store-row-title">
                {filtered.length} item{filtered.length === 1 ? "" : "s"}
              </h2>
              <p className="store-row-sub">Tap a card for details or add straight to your pick list</p>
            </div>
          </div>
          <ProductGrid items={filtered} />
        </section>
      )}
    </>
  );
}

export function ShopClient() {
  const isMobile = useIsMobile();
  const { products, loading, error } = useCatalog();
  const searchParams = useSearchParams();
  const urlQ = (searchParams.get("q") || "").trim();
  const section = (searchParams.get("section") || searchParams.get("category") || "").trim();
  const filter = (searchParams.get("filter") || "").trim();

  const filtered = useMemo(() => {
    const q = urlQ.toLowerCase();
    let list = products;
    if (q) {
      list = list.filter((p) => {
        const hay = `${p.name} ${p.sku || ""} ${p.location?.section || ""} ${p.location?.shelf || ""}`.toLowerCase();
        return hay.includes(q);
      });
    }
    if (section) {
      list = list.filter((p) => p.location?.section === section);
    }
    if (filter === "recent") list = sortByNewest(list);
    if (filter === "low-stock") list = list.filter((p) => p.quantity <= 3);
    if (filter === "well-stocked") list = list.filter((p) => p.quantity > 3).sort((a, b) => b.quantity - a.quantity);
    return list;
  }, [products, urlQ, section, filter]);

  const grouped = useMemo(() => groupProductsBySection(filtered), [filtered]);
  const showGrouped = !section && !filter && !urlQ && grouped.length > 0;
  const hero = heroCopy({ q: urlQ, section, filter, count: filtered.length });
  const categoryCount = buildCategories(products).length;

  if (loading || isMobile === null) {
    return <ShopLoading mobile={isMobile ?? undefined} />;
  }

  if (isMobile) {
    return (
      <div className="store-shop store-shop--mobile">
        <MobileLabHero eyebrow={hero.eyebrow} title={hero.title} lead={hero.lead} />
        <div className="shop-m-body">
          <ShopCatalog
            products={products}
            filtered={filtered}
            grouped={grouped}
            showGrouped={showGrouped}
            categoryCount={categoryCount}
            error={error}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="store-shop">
      <section className="hero" aria-labelledby="shop-title">
        <div className="hero-inner">
          <p className="hero-eyebrow">{hero.eyebrow}</p>
          <h1 id="shop-title">{hero.title}</h1>
          <p className="hero-lead">{hero.lead}</p>
          <div className="hero-pills">
            {hero.pills.map((pill) => (
              <span key={pill} className="pill">
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="shop-section">
        <ShopCatalog
          products={products}
          filtered={filtered}
          grouped={grouped}
          showGrouped={showGrouped}
          categoryCount={categoryCount}
          error={error}
        />
      </div>
    </div>
  );
}

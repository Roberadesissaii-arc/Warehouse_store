"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { buildCategories } from "@/lib/products";
import type { StoreProduct } from "@/lib/api";

export function ShopToolbar({ products }: { products: StoreProduct[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = (searchParams.get("section") || searchParams.get("category") || "").trim();
  const activeFilter = (searchParams.get("filter") || "").trim();
  const urlQ = (searchParams.get("q") || "").trim();
  const categories = buildCategories(products);

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function pushShop(section: string) {
    const params = new URLSearchParams();
    if (urlQ) params.set("q", urlQ);
    if (section) params.set("section", section);
    if (activeFilter) params.set("filter", activeFilter);
    const qs = params.toString();
    router.push(qs ? `/shop?${qs}` : "/shop");
    setOpen(false);
  }

  if (!categories.length) return null;

  const browsingAll = !activeSection && !activeFilter;
  const sectionLabel = activeSection || "All sections";

  return (
    <section className="shop-toolbar" aria-label="Filter by section">
      <div className="shop-toolbar-filters">
        <span className="shop-toolbar-label">Browse by section</span>

        <div className="shop-toolbar-chips shop-toolbar-chips--desktop" role="list">
          <button
            type="button"
            role="listitem"
            className={`shop-chip${browsingAll ? " is-active" : ""}`}
            onClick={() => pushShop("")}
          >
            All sections
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              role="listitem"
              className={`shop-chip${activeSection === cat.name ? " is-active" : ""}`}
              onClick={() => pushShop(activeSection === cat.name ? "" : cat.name)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="shop-section-dropdown shop-toolbar-chips--mobile" ref={rootRef}>
          <button
            type="button"
            className="shop-section-dropdown-btn"
            aria-expanded={open}
            aria-haspopup="listbox"
            onClick={() => setOpen((value) => !value)}
          >
            <span>{sectionLabel}</span>
            <ChevronDown size={16} aria-hidden className={open ? "is-open" : undefined} />
          </button>
          {open ? (
            <ul className="shop-section-dropdown-panel" role="listbox" aria-label="Warehouse sections">
              <li role="option" aria-selected={browsingAll}>
                <button
                  type="button"
                  className={browsingAll ? "is-active" : undefined}
                  onClick={() => pushShop("")}
                >
                  All sections
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.name} role="option" aria-selected={activeSection === cat.name}>
                  <button
                    type="button"
                    className={activeSection === cat.name ? "is-active" : undefined}
                    onClick={() => pushShop(cat.name)}
                  >
                    {cat.name}
                    <span>{cat.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

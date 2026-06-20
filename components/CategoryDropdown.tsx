"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useCatalog } from "@/components/CatalogProvider";
import { buildCategories } from "@/lib/products";

export function CategoryDropdown() {
  const { products, loading } = useCatalog();
  const [open, setOpen] = useState(false);
  const [showMoreBelow, setShowMoreBelow] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const categories = buildCategories(products);

  const syncPanelScroll = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const overflow = panel.scrollHeight > panel.clientHeight + 2;
    const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2;
    setShowMoreBelow(overflow && !atBottom);
  }, []);

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

  useEffect(() => {
    if (!open) return;
    syncPanelScroll();
    const panel = panelRef.current;
    if (!panel) return;

    panel.addEventListener("scroll", syncPanelScroll, { passive: true });
    const ro = new ResizeObserver(syncPanelScroll);
    ro.observe(panel);

    return () => {
      panel.removeEventListener("scroll", syncPanelScroll);
      ro.disconnect();
    };
  }, [open, categories.length, loading, syncPanelScroll]);

  return (
    <div className="store-nav-dropdown" ref={rootRef}>
      <button
        type="button"
        className="store-nav-link store-nav-dropdown-btn"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        Categories
        <ChevronDown className="store-nav-caret" size={12} aria-hidden />
      </button>
      {open ? (
        <div className="store-nav-dropdown-panel-wrap">
          <div ref={panelRef} className="store-nav-dropdown-panel" role="menu">
            {loading ? (
              <p className="store-nav-dropdown-empty">Loading…</p>
            ) : categories.length ? (
              categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/shop?section=${encodeURIComponent(cat.name)}`}
                  className="store-nav-dropdown-item"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <span>{cat.name}</span>
                </Link>
              ))
            ) : (
              <p className="store-nav-dropdown-empty">No sections yet</p>
            )}
          </div>
          {showMoreBelow ? (
            <div className="store-nav-dropdown-more" aria-hidden>
              <ChevronDown size={16} strokeWidth={2.5} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

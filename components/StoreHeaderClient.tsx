"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { useCatalog } from "@/components/CatalogProvider";
import { locationLabel, productInitials, productPalette, searchProducts, stockLabel } from "@/lib/products";

export function StoreHeaderClient() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { products, loading } = useCatalog();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const suggestions = useMemo(() => searchProducts(products, q, 8), [products, q]);
  const trimmed = q.trim();
  const showDropdown = open && trimmed.length > 0;

  useEffect(() => {
    if (!showDropdown) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showDropdown]);

  function goToResults(query: string) {
    const next = query.trim();
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
    router.push(next ? `/shop?q=${encodeURIComponent(next)}` : "/shop");
  }

  function goToProduct(id: number) {
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
    router.push(`/product/${id}`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      goToProduct(suggestions[activeIndex].id);
      return;
    }
    goToResults(q);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) {
      if (event.key === "ArrowDown" && trimmed) setOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="store-search-wrap" ref={rootRef}>
      <div className={`store-search-shell${showDropdown ? " is-open" : ""}`}>
        <div className="store-search-shell__ring" aria-hidden />
        <form className="store-search store-search-shell__inner" onSubmit={onSubmit} role="search">
          <Search size={18} className="store-search-icon" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActiveIndex(-1);
              setOpen(true);
            }}
            onFocus={() => trimmed && setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search tools & parts"
            aria-label="Search catalog"
            aria-expanded={showDropdown}
            aria-controls="store-search-suggestions"
            aria-autocomplete="list"
            autoComplete="off"
            role="combobox"
          />
        </form>
      </div>

      {showDropdown ? (
        <div id="store-search-suggestions" className="store-search-dropdown" role="listbox">
          {loading ? (
            <p className="store-search-dropdown-empty">Loading warehouse catalog…</p>
          ) : suggestions.length ? (
            <>
              <p className="store-search-dropdown-label">Suggestions from your warehouse</p>
              <ul className="store-search-suggestions">
                {suggestions.map((product, index) => {
                  const [from, to] = productPalette(product.id);
                  const initials = productInitials(product.name);
                  const meta = [locationLabel(product), stockLabel(product.quantity)].filter(Boolean).join(" · ");

                  return (
                    <li key={product.id}>
                      <button
                        type="button"
                        className={`store-search-suggestion${index === activeIndex ? " is-active" : ""}`}
                        role="option"
                        aria-selected={index === activeIndex}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => goToProduct(product.id)}
                      >
                        <span
                          className="store-search-suggestion-thumb"
                          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                          aria-hidden
                        >
                          {initials}
                        </span>
                        <span className="store-search-suggestion-copy">
                          <strong>{product.name}</strong>
                          <small>{meta || (product.sku ? `SKU ${product.sku}` : "In your warehouse")}</small>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                className="store-search-dropdown-all"
                onClick={() => goToResults(q)}
              >
                <span>See all results for &ldquo;{trimmed}&rdquo;</span>
                <ArrowRight size={16} aria-hidden />
              </button>
            </>
          ) : (
            <>
              <p className="store-search-dropdown-empty">No matches in your warehouse for &ldquo;{trimmed}&rdquo;</p>
              <button type="button" className="store-search-dropdown-all" onClick={() => goToResults(q)}>
                <span>Search anyway</span>
                <ArrowRight size={16} aria-hidden />
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

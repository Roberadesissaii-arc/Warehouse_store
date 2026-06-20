"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo } from "react";
import { ArrowRight, Minus, Plus, Trash2, X } from "lucide-react";
import { useAccount } from "@/components/AccountProvider";
import { useBag } from "@/components/BagProvider";
import { useCatalog } from "@/components/CatalogProvider";
import { productInitials, productPalette } from "@/lib/products";
import { pickListCopy } from "@/lib/pickList";
import { storeImages } from "@/lib/images";

export function BagDrawer() {
  const { lines, count, drawerOpen, closeDrawer, setQty, remove } = useBag();
  const { products } = useCatalog();
  const { signedIn } = useAccount();

  const enriched = useMemo(
    () => lines.map((line) => ({ ...line, product: products.find((p) => p.id === line.item_id) })),
    [lines, products],
  );

  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, closeDrawer]);

  return (
    <>
      {drawerOpen ? (
        <button
          type="button"
          className="bag-drawer-backdrop"
          aria-label={pickListCopy.close}
          onClick={closeDrawer}
        />
      ) : null}
      <aside
      className={`bag-drawer${drawerOpen ? " is-open" : ""}`}
      aria-hidden={!drawerOpen}
      aria-label={pickListCopy.titleYour}
    >
        <div className="bag-drawer-head">
          <div>
            <h2>{pickListCopy.titleYour}</h2>
            <p className="bag-drawer-sub">{pickListCopy.itemCount(count)}</p>
          </div>
          <button type="button" className="bag-drawer-close" onClick={closeDrawer} aria-label={pickListCopy.close}>
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="bag-drawer-body">
          {!lines.length ? (
            <div className="bag-drawer-empty">
              <Image
                src={storeImages.pickList.emptyHero}
                alt=""
                width={200}
                height={160}
                className="bag-drawer-empty-art"
                style={{ width: "100%", maxWidth: 200, height: "auto" }}
              />
              <h3>{pickListCopy.empty}</h3>
              <p>{pickListCopy.emptyHint}</p>
              <Link href="/shop" className="btn-secondary bag-drawer-empty-btn" onClick={closeDrawer}>
                {pickListCopy.browseInventory}
              </Link>
            </div>
          ) : (
            enriched.map((line) => {
              const [from, to] = productPalette(line.item_id);
              const max = line.product?.quantity;
              return (
                <article key={line.item_id} className="bag-drawer-item">
                  <div
                    className="bag-drawer-item-thumb"
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                  >
                    <span>{productInitials(line.name || "?")}</span>
                  </div>
                  <div className="bag-drawer-item-body">
                    <h3>{line.name || `Item #${line.item_id}`}</h3>
                    {line.sku ? <p className="bag-drawer-item-sku">SKU {line.sku}</p> : null}
                    <div className="bag-drawer-item-actions">
                      <div className="qty-row qty-row--compact">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => setQty(line.item_id, line.quantity - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span>{line.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() =>
                            setQty(line.item_id, Math.min(line.quantity + 1, max || line.quantity + 1))
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="bag-drawer-item-remove"
                        onClick={() => remove(line.item_id)}
                        aria-label={`Remove ${line.name || "item"}`}
                      >
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {lines.length ? (
          <div className="bag-drawer-foot">
            <div className="bag-drawer-summary">
              <span>Total units</span>
              <strong>{count}</strong>
            </div>
            <Link href="/bag" className="btn-secondary bag-drawer-full-link" onClick={closeDrawer}>
              {pickListCopy.reviewFull}
            </Link>
            <Link href="/bag/review" className="btn-primary bag-drawer-request" onClick={closeDrawer}>
              <span>{pickListCopy.dispatch}</span>
              <ArrowRight size={18} aria-hidden />
            </Link>
            <p className="bag-drawer-footnote">
              {signedIn
                ? "Sends pick tasks to your warehouse robots — not a purchase."
                : "Sign in to send pick requests from your garage inventory."}
            </p>
          </div>
        ) : null}
    </aside>
    </>
  );
}

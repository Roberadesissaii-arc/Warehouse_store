"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CatalogResponse, StoreProduct } from "@/lib/api";

type CatalogContextValue = {
  products: StoreProduct[];
  loading: boolean;
  error: string | null;
  warehouseMessage: string | null;
  refresh: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warehouseMessage, setWarehouseMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setWarehouseMessage(null);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch("/api/catalog", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      const data = (await res.json()) as CatalogResponse;
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Could not load catalog");
      }
      setProducts(data.products || []);
      if (data.warehouse_connected === false) {
        setWarehouseMessage(data.message || "WarehouseDB is not connected yet.");
      }
    } catch (err) {
      setProducts([]);
      if (err instanceof Error && err.name === "AbortError") {
        setError("Catalog request timed out. Is the Store API running on port 5004?");
      } else {
        setError(err instanceof Error ? err.message : "Could not load catalog");
      }
    } finally {
      window.clearTimeout(timer);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
  }, [refresh]);

  const value = useMemo(
    () => ({ products, loading, error, warehouseMessage, refresh }),
    [products, loading, error, warehouseMessage, refresh],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}

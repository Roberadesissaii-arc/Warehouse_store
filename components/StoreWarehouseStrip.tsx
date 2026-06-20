"use client";

import { AlertTriangle } from "lucide-react";
import { useCatalog } from "@/components/CatalogProvider";
import { StoreIntroBanner } from "@/components/shared/StoreIntroBanner";

/** Offline notice pinned above the bottom nav — only when WarehouseDB is unreachable. */
export function StoreWarehouseStrip() {
  const { loading, error, warehouseMessage } = useCatalog();

  if (loading) return null;

  if (warehouseMessage || error) {
    return (
      <div className="store-warehouse-strip">
        <StoreIntroBanner
          tone="warn"
          icon={AlertTriangle}
          title="Warehouse not connected"
          message={warehouseMessage || error || "Start WarehouseDB on port 8000, then refresh."}
        />
      </div>
    );
  }

  return null;
}

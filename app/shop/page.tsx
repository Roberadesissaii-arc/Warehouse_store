import { Suspense } from "react";
import { StoreShell } from "@/components/StoreShell";
import { ShopClient } from "@/components/shop/ShopClient";

export default function ShopPage() {
  return (
    <StoreShell>
      <Suspense fallback={<div className="empty-state">Loading…</div>}>
        <ShopClient />
      </Suspense>
    </StoreShell>
  );
}

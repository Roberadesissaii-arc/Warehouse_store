"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CategoryDropdown } from "./CategoryDropdown";

export function StoreHeaderNav() {
  const pathname = usePathname();
  const shopActive = pathname === "/shop" || pathname.startsWith("/product");
  const ordersActive = pathname.startsWith("/account/orders");

  return (
    <nav className="store-header-nav" aria-label="Store navigation">
      <Link
        href="/shop"
        className={`store-nav-link${shopActive ? " active" : ""}`}
        aria-current={shopActive ? "page" : undefined}
      >
        Shop
      </Link>
      <Link
        href="/account/orders"
        className={`store-nav-link${ordersActive ? " active" : ""}`}
        aria-current={ordersActive ? "page" : undefined}
      >
        Your picks
      </Link>
      <CategoryDropdown />
    </nav>
  );
}

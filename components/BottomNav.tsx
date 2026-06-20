"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  GalleryVerticalEnd,
  LayoutGrid,
  Package,
  User,
} from "lucide-react";
import { useBag } from "./BagProvider";

const LINK_TABS: Array<{
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  badge?: boolean;
}> = [
  { href: "/", label: "Home", icon: LayoutGrid },
  { href: "/account/orders", label: "Picks", icon: ClipboardList },
  { href: "/shop", label: "Shop", icon: Package },
  { href: "/bag", label: "Pick list", icon: GalleryVerticalEnd, badge: true },
  { href: "/account", label: "Account", icon: User },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/shop") return pathname === "/shop" || pathname.startsWith("/product/");
  if (href === "/bag") return pathname === "/bag";
  if (href === "/account/orders") {
    return pathname === "/account/orders" || pathname.startsWith("/account/orders/");
  }
  if (href === "/account") {
    return (
      pathname === "/account" ||
      (pathname.startsWith("/account/") && !pathname.startsWith("/account/orders"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useBag();

  return (
    <div className="bottom-nav-wrap" aria-hidden={false}>
      <nav className="bottom-nav" aria-label="Main">
        {LINK_TABS.map(({ href, label, icon: Icon, badge }) => {
          const isShop = href === "/shop";
          const active = isNavActive(pathname, href);
          const showBadge = badge && count > 0;

          return (
            <Link
              key={href}
              href={href}
              className={[active && "active", isShop && "bottom-nav-shop"].filter(Boolean).join(" ") || undefined}
              aria-current={active ? "page" : undefined}
              aria-label={isShop ? "Shop" : undefined}
            >
              <span className="bottom-nav-icon" aria-hidden>
                <Icon strokeWidth={active || isShop ? 2.4 : 2} />
                {showBadge ? (
                  <span className="bottom-nav-badge">{count > 9 ? "9+" : count}</span>
                ) : null}
              </span>
              {!isShop ? <span className="bottom-nav-label">{label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

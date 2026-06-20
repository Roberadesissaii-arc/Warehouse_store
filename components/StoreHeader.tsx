import Link from "next/link";
import { HeaderBagButton } from "./HeaderBagButton";
import { HeaderNotifications } from "./HeaderNotifications";
import { ProfileDropdown } from "./ProfileDropdown";
import { StoreHeaderClient } from "./StoreHeaderClient";
import { StoreHeaderNav } from "./StoreHeaderNav";

export function StoreHeader() {
  return (
    <header className="store-header">
      <div className="store-header-inner">
        <Link href="/" className="store-logo">
          <span className="store-logo-mark" aria-hidden>
            WS
          </span>
          <span className="store-logo-text">
            Warehouse <em>Store</em>
          </span>
        </Link>
        <StoreHeaderNav />
        <StoreHeaderClient />
        <div className="store-header-actions">
          <div className="header-notifications-mobile">
            <HeaderNotifications />
          </div>
          <div className="header-notifications-desktop">
            <HeaderNotifications />
          </div>
          <div className="store-header-actions-desktop">
            <ProfileDropdown />
            <HeaderBagButton />
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  HelpCircle,
  GalleryVerticalEnd,
  LogOut,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import { useBag } from "@/components/BagProvider";
import { useStoreAccount } from "@/hooks/useStoreAccount";
import { pickListCopy } from "@/lib/pickList";
import { profileInitials, signOut } from "@/lib/store";

type MenuItem = {
  href?: string;
  label: string;
  description: string;
  icon: typeof UserRound;
  signedInOnly?: boolean;
  action?: "pickList";
};

const MENU_ITEMS: MenuItem[] = [
  {
    href: "/shop",
    label: "Browse inventory",
    description: "See everything on the shelf",
    icon: Search,
  },
  {
    label: pickListCopy.title,
    description: "Queue items for your pick list",
    icon: GalleryVerticalEnd,
    action: "pickList",
  },
  {
    href: "/account/help",
    label: "Help",
    description: "How picking works",
    icon: HelpCircle,
  },
  {
    href: "/account/orders",
    label: "Your picks",
    description: "View pick history",
    icon: ClipboardList,
    signedInOnly: true,
  },
  {
    href: "/account",
    label: "Settings",
    description: "Profile, password & preferences",
    icon: Settings,
    signedInOnly: true,
  },
];

export function ProfileDropdown() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const { openDrawer } = useBag();
  const [open, setOpen] = useState(false);
  const { account, signedIn } = useStoreAccount();

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

  const displayName = account?.name || account?.email || "Account";
  const label = signedIn ? (account?.name || account?.email || "Account").split(/\s+/)[0] : "Account";

  function closeAndNavigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onMenuItemClick(item: MenuItem) {
    if (item.action === "pickList") {
      setOpen(false);
      if (window.matchMedia("(max-width: 767px)").matches) {
        router.push("/bag");
      } else {
        openDrawer();
      }
      return;
    }
    if (item.href) closeAndNavigate(item.href);
  }

  function onSignOut() {
    void signOut().finally(() => {
      setOpen(false);
      router.push("/");
      router.refresh();
    });
  }

  const visibleItems = MENU_ITEMS.filter((item) => !item.signedInOnly || signedIn);

  return (
    <div className="profile-dropdown" ref={rootRef}>
      <button
        type="button"
        className="profile-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Your account"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="profile-avatar" aria-hidden>
          {profileInitials(displayName)}
        </span>
        <span className="profile-label">{label}</span>
        <ChevronDown className="profile-caret" size={14} aria-hidden />
      </button>

      {open ? (
        <div className="profile-menu" role="menu" aria-label="Account menu">
          {signedIn && account ? (
            <Link
              href="/account"
              className="profile-menu-user"
              role="presentation"
              onClick={() => setOpen(false)}
            >
              <span className="profile-avatar profile-avatar--lg" aria-hidden>
                {profileInitials(displayName)}
              </span>
              <span className="profile-menu-user-copy">
                <strong>{displayName}</strong>
                <small>{account.email}</small>
              </span>
              <ChevronRight size={16} className="profile-menu-chevron" aria-hidden />
            </Link>
          ) : (
            <div className="profile-menu-guest">
              <strong>Browsing as guest</strong>
              <p>
                No account needed to browse or build your pick list. Sign in only when you want to send a robot pick.
              </p>
            </div>
          )}

          <nav className="profile-menu-list">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const key = item.href || item.action || item.label;
              return (
                <button
                  key={key}
                  type="button"
                  className="profile-menu-item"
                  role="menuitem"
                  onClick={() => onMenuItemClick(item)}
                >
                  <span className="profile-menu-icon" aria-hidden>
                    <Icon size={18} />
                  </span>
                  <span className="profile-menu-item-copy">
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                  <ChevronRight size={16} className="profile-menu-chevron" aria-hidden />
                </button>
              );
            })}
          </nav>

          <div className="profile-menu-footer">
            {signedIn ? (
              <button type="button" className="profile-menu-item profile-menu-item--danger" onClick={onSignOut}>
                <span className="profile-menu-icon profile-menu-icon--muted" aria-hidden>
                  <LogOut size={18} />
                </span>
                <span className="profile-menu-item-copy">
                  <strong>Sign out</strong>
                  <small>End your session on this device</small>
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary profile-menu-sign-in"
                onClick={() => closeAndNavigate("/sign-in")}
              >
                Sign in to request picks
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

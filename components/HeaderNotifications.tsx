"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, ClipboardList, X } from "lucide-react";
import type { PickHistory } from "@/lib/api";
import { useAccount } from "@/components/AccountProvider";
import { formatPickRef, orderStatusLabel } from "@/lib/store";

function isPickUnread(pick: PickHistory) {
  return (pick.seen_status ?? null) !== (pick.status || "preparing");
}

function pickNotificationCopy(pick: PickHistory) {
  const status = pick.status || "preparing";
  const ref = formatPickRef(pick.order_ref);
  switch (status) {
    case "done":
      return { title: `Pick #${ref} is ready`, detail: "Your items are ready to collect from the floor." };
    case "picking":
      return { title: `Pick #${ref} — picking now`, detail: "A picker is working on your request." };
    case "delayed":
      return { title: `Pick #${ref} — confirmed`, detail: "Waiting for a picker to start." };
    case "placed":
      return { title: `Pick #${ref} was sent`, detail: "Your pick request reached the floor." };
    default:
      return {
        title: `Pick ${ref} — ${orderStatusLabel(status)}`,
        detail: "Status updated on your pick request.",
      };
  }
}

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function HeaderNotifications({ variant = "header" }: { variant?: "header" | "bottomNav" }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { account, signedIn, ready, markNotificationsSeen, clearNotifications } = useAccount();

  const orders = useMemo(() => account?.orders ?? [], [account?.orders]);
  const visibleOrders = useMemo(
    () => orders.filter((pick) => !pick.notification_hidden),
    [orders],
  );
  const unreadCount = useMemo(() => {
    if (!signedIn || !orders.length) return 0;
    return orders.filter((pick) => !pick.notification_hidden && isPickUnread(pick)).length;
  }, [orders, signedIn]);
  const hasUnread = visibleOrders.some(isPickUnread);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleMarkAllRead() {
    if (!hasUnread || busy) return;
    setBusy(true);
    try {
      await markNotificationsSeen();
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    if (!visibleOrders.length || busy) return;
    setBusy(true);
    try {
      await clearNotifications();
    } finally {
      setBusy(false);
    }
  }

  const panel = open ? (
    <div className="store-notify-layer" aria-hidden={false}>
      <div
        ref={panelRef}
        className={
          variant === "bottomNav"
            ? "store-notify-panel store-notify-panel--bottom-nav"
            : "store-notify-panel"
        }
        role="dialog"
        aria-label="Pick notifications"
      >
        <div className="store-notify-panel-head">
          <div>
            <h2>Notifications</h2>
            <p>Pick status updates</p>
          </div>
          <button
            type="button"
            className="store-notify-close"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {signedIn && visibleOrders.length ? (
          <div className="store-notify-actions">
            <button
              type="button"
              className="store-notify-action"
              disabled={!hasUnread || busy}
              onClick={() => void handleMarkAllRead()}
            >
              Mark all read
            </button>
            <button
              type="button"
              className="store-notify-action store-notify-action--clear"
              disabled={!visibleOrders.length || busy}
              onClick={() => void handleClear()}
            >
              Clear
            </button>
          </div>
        ) : null}

        <div className="store-notify-list">
          {!ready ? (
            <p className="store-notify-empty">Loading…</p>
          ) : !signedIn ? (
            <div className="store-notify-guest">
              <p>Sign in to get updates when your picks are processed or ready.</p>
              <Link href="/sign-in?next=/account/orders" className="btn-primary" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            </div>
          ) : !visibleOrders.length ? (
            <p className="store-notify-empty">
              {orders.length
                ? "No notifications right now. New pick updates will appear here."
                : "No picks yet. Send a pick from your pick list to track it here."}
            </p>
          ) : (
            visibleOrders.slice(0, 12).map((pick) => {
              const copy = pickNotificationCopy(pick);
              const isUnread = isPickUnread(pick);

              return (
                <Link
                  key={pick.order_ref}
                  href={`/account/orders/${encodeURIComponent(pick.order_ref)}`}
                  className={`store-notify-item${isUnread ? " store-notify-item--unread" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="store-notify-item-icon" aria-hidden>
                    <ClipboardList size={17} />
                  </span>
                  <span className="store-notify-item-copy">
                    <strong>{copy.title}</strong>
                    <span>{copy.detail}</span>
                    <em>{formatWhen(pick.placed_at)}</em>
                  </span>
                </Link>
              );
            })
          )}
        </div>

        {signedIn && visibleOrders.length ? (
          <Link href="/account/orders" className="store-notify-footer" onClick={() => setOpen(false)}>
            View all picks
          </Link>
        ) : null}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        className={variant === "bottomNav" ? "header-notifications header-notifications--bottom-nav" : "header-notifications"}
        ref={rootRef}
      >
        <button
          ref={triggerRef}
          type="button"
          className={
            variant === "bottomNav"
              ? open
                ? "bottom-nav-notifications active"
                : "bottom-nav-notifications"
              : "header-notifications-trigger"
          }
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={unreadCount ? `${unreadCount} pick updates` : "Pick notifications"}
          onClick={() => setOpen((value) => !value)}
        >
          {variant === "bottomNav" ? (
            <>
              <span className="bottom-nav-icon" aria-hidden>
                <Bell strokeWidth={open ? 2.4 : 2} />
                {unreadCount > 0 ? (
                  <span className="bottom-nav-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                ) : null}
              </span>
              <span className="bottom-nav-label">Alerts</span>
            </>
          ) : (
            <>
              <Bell size={20} strokeWidth={2} aria-hidden />
              {unreadCount > 0 ? (
                <span className="header-notifications-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
              ) : null}
            </>
          )}
        </button>
      </div>
      {panel}
    </>
  );
}

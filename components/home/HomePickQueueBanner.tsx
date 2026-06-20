"use client";

import Link from "next/link";
import { ChevronRight, ClipboardList } from "lucide-react";
import { useStoreAccount } from "@/hooks/useStoreAccount";

export function HomePickQueueBanner() {
  const { account, signedIn } = useStoreAccount({ pollOrders: true });

  const openPicks =
    account?.orders.filter((order) => order.status && order.status !== "done").length ?? 0;
  const hasOpenPicks = openPicks > 0;
  const href = signedIn ? "/account/orders" : "/bag";

  return (
    <Link href={href} className="store-floor-queue-banner">
      <div className="store-floor-queue-banner__inner">
        <ClipboardList
          aria-hidden
          className="store-floor-queue-banner__watermark"
          strokeWidth={1.6}
        />

        <div className="store-floor-queue-banner__row">
          <div className="store-floor-queue-banner__copy">
            <p className="store-floor-queue-banner__eyebrow">Pick queue</p>
            <p className="store-floor-queue-banner__title">
              {signedIn
                ? hasOpenPicks
                  ? `${openPicks} active pick${openPicks === 1 ? "" : "s"} in progress`
                  : "No picks in progress"
                : "Build your pick list"}
            </p>
            <p className="store-floor-queue-banner__text">
              {signedIn
                ? hasOpenPicks
                  ? "Tap to track status and see when your items are ready."
                  : "Queue items from the shelf, then send a pick to the floor."
                : "Browse inventory, queue what you need, then send a robot pick."}
            </p>
          </div>
          <ChevronRight size={20} className="store-floor-queue-banner__chevron" aria-hidden />
        </div>
      </div>
    </Link>
  );
}

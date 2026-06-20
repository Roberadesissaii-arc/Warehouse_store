"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Package, Zap } from "lucide-react";
import type { PickHistory } from "@/lib/api";
import { pickListCopy } from "@/lib/pickList";
import { storeImages } from "@/lib/images";
import { formatPickPlacedAt, formatPickRef, orderStatusKey, orderStatusLabel } from "@/lib/store";
import { MobileLabHero } from "@/components/mobile/MobileLabHero";
import { useStoreAccount } from "@/hooks/useStoreAccount";
import { useIsMobile } from "@/hooks/useIsMobile";
import { AccountSubpageFrame } from "./AccountSubpageFrame";

function formatPlacedAt(iso: string) {
  return formatPickPlacedAt(iso);
}

function PicksEmptyCard({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="picks-empty-card">
      <div className="picks-empty-art" aria-hidden>
        <Image
          src={storeImages.pickList.emptyHero}
          alt=""
          width={200}
          height={160}
          className="picks-empty-art-img"
          style={{ width: "100%", maxWidth: 180, height: "auto" }}
        />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="picks-empty-actions">
        <Link href={primaryHref} className="m-btn m-btn--primary">
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link href={secondaryHref} className="m-btn">
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function PickHistoryList({ orders }: { orders: PickHistory[] }) {
  return (
    <div className="pick-history">
      {orders.map((pick) => {
        const pickLines = pick.lines ?? [];
        const units = pickLines.reduce((sum, line) => sum + line.quantity, 0);
        const preview = pickLines
          .slice(0, 2)
          .map((line) => line.name)
          .join(", ");
        const more = pickLines.length > 2 ? ` +${pickLines.length - 2} more` : "";
        const statusKey = orderStatusKey(pick.status);
        const statusLabel = orderStatusLabel(pick.status);
        const detailParts = [
          `${pickLines.length} line${pickLines.length === 1 ? "" : "s"}`,
          `${units} unit${units === 1 ? "" : "s"}`,
        ];
        if (preview) detailParts.push(`${preview}${more}`);

        return (
          <Link
            key={pick.order_ref}
            href={`/account/orders/${encodeURIComponent(pick.order_ref)}`}
            className="pick-history-card"
          >
            <div className="pick-history-card-top">
              <span className="pick-history-row-icon" aria-hidden>
                <Package size={18} />
              </span>
              <div className="pick-history-row-copy">
                <strong>Pick #{formatPickRef(pick.order_ref)}</strong>
                <small>{formatPlacedAt(pick.placed_at)}</small>
              </div>
              {pick.priority === "rush" ? (
                <span className="pick-history-rush pick-history-rush--inline">
                  <Zap size={12} aria-hidden />
                </span>
              ) : null}
              <ChevronRight size={16} className="pick-history-chevron" aria-hidden />
            </div>
            <div className="pick-history-card-meta">
              <span className={`pick-status pick-status--${statusKey}`}>{statusLabel}</span>
              <span className="pick-history-card-detail">{detailParts.join(" · ")}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function PicksMobilePage({
  guest,
  orders,
}: {
  guest: boolean;
  orders: PickHistory[];
}) {
  const orderCount = orders.length;

  return (
    <div className="picks-page picks-page--mobile">
      <MobileLabHero
        eyebrow="Your picks"
        title={guest ? "Sign in to see your history" : orderCount ? "Pick history" : "No picks yet"}
        lead={
          guest
            ? "Pick requests you send from your pick list are saved to your account on this server."
            : orderCount
              ? `${orderCount} pick request${orderCount === 1 ? "" : "s"} on this device`
              : "Add items to your pick list and send a floor pick — status updates will show here."
        }
      />

      <div className="picks-m-body">
        <div className="picks-m-card">
          {guest ? (
            <PicksEmptyCard
              title="Nothing saved yet"
              description="Browse inventory and build your pick list anytime. Sign in when you want to send picks and track them here."
              primaryHref="/sign-in?next=/account/orders"
              primaryLabel="Sign in"
              secondaryHref="/bag"
              secondaryLabel={`Open ${pickListCopy.title.toLowerCase()}`}
            />
          ) : orderCount ? (
            <PickHistoryList orders={orders} />
          ) : (
            <PicksEmptyCard
              title="No picks yet"
              description="Your in-progress and completed picks will show up here after you send a request from your pick list."
              primaryHref="/bag"
              primaryLabel="Open pick list"
              secondaryHref="/shop"
              secondaryLabel="Browse inventory"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function PicksClient() {
  const isMobile = useIsMobile();
  const { account, signedIn } = useStoreAccount({ pollOrders: true });

  if (isMobile === null) {
    return <div className="empty-state">Loading…</div>;
  }

  if (isMobile) {
    return <PicksMobilePage guest={!signedIn || !account} orders={account?.orders ?? []} />;
  }

  if (!signedIn || !account) {
    return (
      <AccountSubpageFrame
        eyebrow="Your picks"
        title="Sign in to see your history"
        lead="Pick requests you send from your pick list are saved to your account on this server."
        pills={["Pick history", "Status tracking", "This device"]}
      >
        <section className="store-row account-panel">
          <PicksEmptyCard
            title="Nothing saved yet"
            description="Browse inventory and build your pick list anytime. Sign in when you want to send picks and track them here."
            primaryHref="/sign-in?next=/account/orders"
            primaryLabel="Sign in to request picks"
            secondaryHref="/bag"
            secondaryLabel={`Open ${pickListCopy.title.toLowerCase()}`}
          />
        </section>
      </AccountSubpageFrame>
    );
  }

  const orderCount = account.orders.length;

  return (
    <AccountSubpageFrame
      eyebrow="Your picks"
      title="Pick history"
      lead={
        orderCount
          ? `${orderCount} pick request${orderCount === 1 ? "" : "s"} on this device`
          : "No picks yet — add items to your pick list and request a floor pick."
      }
      pills={["Live status", "Standard & rush", "Saved on server"]}
    >
      <section className="store-row account-panel">
        {orderCount ? (
          <PickHistoryList orders={account.orders} />
        ) : (
          <PicksEmptyCard
            title="No picks yet"
            description="Your completed and in-progress picks will show up here after you send a request from your pick list."
            primaryHref="/bag"
            primaryLabel="Open pick list"
            secondaryHref="/shop"
            secondaryLabel="Browse inventory"
          />
        )}
      </section>
    </AccountSubpageFrame>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Layers,
  Package,
  PauseCircle,
  Zap,
} from "lucide-react";
import { MobileLabHero } from "@/components/mobile/MobileLabHero";
import { useCatalog } from "@/components/CatalogProvider";
import { useStoreAccount } from "@/hooks/useStoreAccount";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { PickHistoryLine } from "@/lib/api";
import { productInitials, productPalette } from "@/lib/products";
import {
  formatPickPlacedAt,
  formatPickRef,
  orderStatusKey,
  orderStatusLabel,
} from "@/lib/store";
import { AccountSubpageFrame } from "./AccountSubpageFrame";

function statusHint(statusKey: string) {
  if (statusKey === "unknown") {
    return "Your pick is on the floor queue. A robot will be assigned when one is available.";
  }
  if (statusKey === "delayed") {
    return "The warehouse received your pick but is waiting to assign a robot.";
  }
  if (statusKey === "preparing") {
    return "Floor tasks are being prepared for your items.";
  }
  if (statusKey === "picking") {
    return "Your items are being picked from the shelf.";
  }
  if (statusKey === "done") {
    return "Your items have been picked and are ready at your bench.";
  }
  return "Track status here as the floor works your request.";
}

function StatusDecoIcon({ statusKey }: { statusKey: string }) {
  const iconProps = {
    className: "pick-detail-status-deco",
    strokeWidth: 1.6,
    "aria-hidden": true as const,
  };

  if (statusKey === "picking") return <Layers size={96} {...iconProps} />;
  if (statusKey === "done") return <CheckCircle2 size={96} {...iconProps} />;
  if (statusKey === "delayed" || statusKey === "unknown") {
    return <PauseCircle size={96} {...iconProps} />;
  }
  return <Clock3 size={96} {...iconProps} />;
}

function PickLineCard({
  line,
  productId,
  section,
  shelf,
}: {
  line: PickHistoryLine;
  productId?: number;
  section?: string;
  shelf?: string;
}) {
  const id = productId ?? line.item_id ?? 0;
  const [from, to] = productPalette(id || 1);
  const name = line.name?.trim() || (line.sku ? `SKU ${line.sku}` : "Unnamed item");

  return (
    <li className="pick-detail-line">
      <div className="pick-detail-line-thumb" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
        <span>{productInitials(name)}</span>
      </div>
      <div className="pick-detail-line-copy">
        <strong>{name}</strong>
        <div className="pick-detail-line-meta">
          <span className="pick-detail-line-qty">{line.quantity}×</span>
          {line.sku ? (
            <span className="pick-detail-line-chip">
              <em>SKU</em>
              {line.sku}
            </span>
          ) : null}
          {section ? (
            <span className="pick-detail-line-chip pick-detail-line-chip--loc">
              <em>Section</em>
              {section}
            </span>
          ) : null}
          {shelf ? (
            <span className="pick-detail-line-chip pick-detail-line-chip--loc">
              <em>Shelf</em>
              {shelf}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function PickDetailHeroMeta({
  statusKey,
  statusLabel,
  placedAt,
  orderRef,
}: {
  statusKey: string;
  statusLabel: string;
  placedAt: string;
  orderRef: string;
}) {
  const when = formatPickPlacedAt(placedAt, orderRef);
  return (
    <div className="pick-detail-hero-meta">
      <span className={`pick-detail-hero-status pick-detail-hero-status--${statusKey}`}>
        {statusLabel}
      </span>
      {when ? <time className="pick-detail-hero-date">{when}</time> : null}
    </div>
  );
}

function PickDetailBody({ orderRef }: { orderRef: string }) {
  const { account, signedIn } = useStoreAccount({ pollOrders: true });
  const { products } = useCatalog();
  const pick = account?.orders.find((item) => item.order_ref === orderRef);
  const pickLines = pick?.lines ?? [];

  if (!signedIn || !account) {
    return (
      <div className="picks-empty-card">
        <h2>Sign in to view this pick</h2>
        <p>Pick details are saved to your account on this server.</p>
        <div className="picks-empty-actions">
          <Link href={`/sign-in?next=/account/orders/${encodeURIComponent(orderRef)}`} className="m-btn m-btn--primary">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (!pick) {
    return (
      <div className="picks-empty-card">
        <h2>Pick not found</h2>
        <p>We could not find this pick on your account. It may have been removed or belongs to another session.</p>
        <div className="picks-empty-actions">
          <Link href="/account/orders" className="m-btn m-btn--primary">
            Back to pick history
          </Link>
        </div>
      </div>
    );
  }

  const units = pickLines.reduce((sum, line) => sum + line.quantity, 0);
  const statusKey = orderStatusKey(pick.status);
  const statusLabel = orderStatusLabel(pick.status);

  function resolveProduct(line: PickHistoryLine) {
    if (line.item_id) return products.find((p) => p.id === line.item_id);
    if (line.sku) return products.find((p) => p.sku === line.sku);
    return products.find((p) => p.name === line.name);
  }

  const zones = [...new Set(
    pickLines
      .map((line) => {
        const product = resolveProduct(line);
        return product?.location?.section;
      })
      .filter(Boolean),
  )] as string[];

  return (
    <div className="pick-detail-body">
      <div className={`pick-detail-status pick-detail-status--${statusKey}`}>
        <StatusDecoIcon statusKey={statusKey} />
        <div className="pick-detail-status-copy">
          <div className="pick-detail-status-top">
            <strong className="pick-detail-status-label">{statusLabel}</strong>
            {pick.priority === "rush" ? (
              <span className="pick-detail-rush-badge">
                <Zap size={12} aria-hidden />
                Rush
              </span>
            ) : null}
          </div>
          <p className="pick-detail-status-hint">{statusHint(statusKey)}</p>
        </div>
      </div>

      <dl className="pick-detail-stats">
        <div className="pick-detail-stat-card">
          <dt>Lines</dt>
          <dd>{pickLines.length}</dd>
        </div>
        <div className="pick-detail-stat-card">
          <dt>Units</dt>
          <dd>{units}</dd>
        </div>
        {zones.length ? (
          <div className="pick-detail-stat-card pick-detail-stat-card--wide">
            <dt>Zones</dt>
            <dd className="pick-detail-zone-list">
              {zones.map((zone) => (
                <span key={zone} className="pick-detail-zone-chip">
                  {zone}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>

      {pick.note?.trim() ? (
        <div className="pick-detail-note-block">
          <p className="pick-detail-note-label">Floor note</p>
          <p className="pick-detail-note">{pick.note.trim()}</p>
        </div>
      ) : null}

      <div className="pick-detail-items-shell">
        <div className="pick-detail-items-head">
          <h2>Items in this pick</h2>
          <span className="pick-detail-items-count">
            {pickLines.length} line{pickLines.length === 1 ? "" : "s"}
          </span>
        </div>

        {pickLines.length ? (
          <ul className="pick-detail-lines">
            {pickLines.map((line, index) => {
              const product = resolveProduct(line);
              return (
                <PickLineCard
                  key={`${line.item_id || line.sku || line.name}-${index}`}
                  line={line}
                  productId={product?.id}
                  section={product?.location?.section}
                  shelf={product?.location?.shelf}
                />
              );
            })}
          </ul>
        ) : (
          <div className="pick-detail-empty-lines">
            <Package size={22} strokeWidth={1.75} aria-hidden />
            <p>No line items were saved for this pick.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function PickDetailClient() {
  const params = useParams<{ ref: string }>();
  const isMobile = useIsMobile();
  const { account } = useStoreAccount({ pollOrders: true });
  const orderRef = decodeURIComponent(params.ref || "");
  const pick = account?.orders.find((item) => item.order_ref === orderRef);
  const pickId = formatPickRef(orderRef);
  const title = (
    <>
      Pick <span className="pick-detail-id">#{pickId}</span>
    </>
  );
  const heroLead = pick ? (
    <PickDetailHeroMeta
      statusKey={orderStatusKey(pick.status)}
      statusLabel={orderStatusLabel(pick.status)}
      placedAt={pick.placed_at}
      orderRef={orderRef}
    />
  ) : (
    "Status, items, and floor notes for this request."
  );

  if (isMobile === null) {
    return <div className="empty-state">Loading…</div>;
  }

  if (isMobile) {
    return (
      <div className="picks-page picks-page--mobile pick-detail-page--mobile">
        <MobileLabHero eyebrow="Pick detail" title={title} lead={heroLead} />

        <div className="picks-m-body">
          <div className="picks-m-card">
            <Link href="/account/orders" className="pick-detail-back">
              <ArrowLeft size={16} aria-hidden />
              Pick history
            </Link>
            <PickDetailBody orderRef={orderRef} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AccountSubpageFrame
      eyebrow="Pick detail"
      title={title}
      lead={heroLead}
      pills={["Live status", "Line items", "Floor notes"]}
    >
      <section className="store-row account-panel picks-detail-panel">
        <Link href="/account/orders" className="pick-detail-back pick-detail-back--desktop">
          <ArrowLeft size={16} aria-hidden />
          Back to pick history
        </Link>
        <PickDetailBody orderRef={orderRef} />
      </section>
    </AccountSubpageFrame>
  );
}

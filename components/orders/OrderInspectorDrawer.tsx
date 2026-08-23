"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  X,
} from "lucide-react";

import {
  HOLD_REASON_LABELS,
  isAwbVisible,
  primaryShipment,
  type ClaimType,
  type HoldReason,
  type Order,
  type OrderDocumentType,
} from "@/lib/orders";

import {
  acceptActionLabel,
  canCancel,
  formatDateTime,
  formatMoney,
  hasOpenClaim,
  hasRtoShipment,
  isMarketplaceFulfillment,
  isSelfFulfillment,
  marketplaceLogoSrc,
  nextActions,
  opsChip,
  opsSecondaryBadges,
  requiresMarketplaceAccept,
  requiresOrderConfirm,
  SELF_SHIP_COURIERS,
  shipmentEventLabel,
  shippingModeActions,
  shippingModeLabel,
  type ShippingUiAction,
} from "./order-ops";

type DrawerTab =
  | "summary"
  | "shipments"
  | "timeline"
  | "documents"
  | "claims"
  | "returns"
  | "settlement"
  | "audit";

const PRIMARY_TABS: Array<[DrawerTab, string]> = [
  ["summary", "Summary"],
  ["shipments", "Shipments"],
  ["timeline", "Timeline"],
  ["documents", "Documents"],
  ["claims", "Claims"],
];

const MORE_TABS: Array<[DrawerTab, string]> = [
  ["returns", "Returns"],
  ["settlement", "Settlement"],
  ["audit", "Audit"],
];

const CLAIM_TYPES: ClaimType[] = [
  "empty_box",
  "wrong_item",
  "courier_damage",
  "lost_shipment",
  "damaged",
  "missing_item",
];

function warehouseLabel(id?: string) {
  if (!id) return "—";
  if (id === "wh-default") return "BLR-01 Bangalore";
  if (id === "wh-mumbai") return "BOM-01 Mumbai";
  return id;
}

function paymentLabel(order: Order) {
  if (order.tags?.includes("COD") || order.tags?.includes("Cod")) return "COD";
  if (order.paymentStatus === "paid") return "Prepaid";
  if (order.paymentStatus === "pending") return "Pending";
  if (order.paymentStatus === "failed") return "Failed";
  return "—";
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {action}
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

interface OrderInspectorDrawerProps {
  order: Order;
  submitting?: boolean;
  onClose(): void;
  onRunAction(
    order: Order,
    action: { label: string; path: string; body?: object },
  ): void;
  onLabelAction(
    order: Order,
    action: ShippingUiAction,
    options?: { courier?: string },
  ): void;
  onCancel(order: Order): void;
  onAddNote(order: Order, body: string): void;
  onAddClaim(order: Order, type: ClaimType, note?: string): void;
  onGenerateDocument(order: Order, type: OrderDocumentType): void;
  onDisposeReturn(
    order: Order,
    disposition: "restock" | "refurbish" | "scrap",
  ): void;
  onCreateShipment?(order: Order, body?: object): void;
}

export default function OrderInspectorDrawer({
  order,
  submitting,
  onClose,
  onRunAction,
  onLabelAction,
  onCancel,
  onAddNote,
  onAddClaim,
  onGenerateDocument,
  onDisposeReturn,
  onCreateShipment,
}: OrderInspectorDrawerProps) {
  const chip = opsChip(order);
  const secondaryBadges = opsSecondaryBadges(order);
  const [tab, setTab] = useState<DrawerTab>("summary");
  const [moreOpen, setMoreOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState("");
  const [claimType, setClaimType] = useState<ClaimType>("empty_box");
  const [claimNote, setClaimNote] = useState("");
  const [courier, setCourier] = useState(
    primaryShipment(order)?.courier ?? SELF_SHIP_COURIERS[0],
  );
  const [shipQty, setShipQty] = useState<Record<string, number>>({});

  const lineCount = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  const primaryLine = order.lines[0];
  const actions = nextActions(order);
  const labelActions = shippingModeActions(order);
  const selfShip = isSelfFulfillment(order.shippingMode);
  const marketplaceShip = isMarketplaceFulfillment(order.shippingMode);
  const showAwb = isAwbVisible(order.shippingMode);
  const shipment = primaryShipment(order);
  const shipments = order.shipments ?? [];
  const notes = order.internalNotes ?? [];
  const claims = order.claims ?? [];
  const generateAwb = labelActions.find(
    (a) => a.kind === "ensure_label" && a.label.toLowerCase().includes("awb"),
  );
  const generateLabel = labelActions.find(
    (a) =>
      a.kind === "download_label" &&
      (a.label.toLowerCase().includes("generate") ||
        a.label.toLowerCase().includes("marketplace")),
  );
  const printAction = labelActions.find((a) => a.kind === "print_label");
  const shipAction = actions.find((a) => a.path === "ship");
  const acceptAction = actions.find((a) => a.path === "confirm");
  const lifecycleActions = actions.filter(
    (a) => a.path !== "ship" && a.path !== "confirm",
  );
  const showReturns = Boolean(order.returnCase) || hasRtoShipment(order);
  const needsAccept = requiresOrderConfirm(order);
  const openClaim = hasOpenClaim(order);
  const actionsTitle =
    needsAccept ||
    order.status === "Confirmed" ||
    order.status === "Reserved" ||
    order.status === "Allocated"
      ? "Order Actions"
      : selfShip
        ? "Shipment Actions"
        : "Fulfillment Actions";

  const remainingByLine = Object.fromEntries(
    order.lines.map((line) => {
      const shippedQty = shipments.reduce((sum, item) => {
        const match = item.lines.find((entry) => entry.lineId === line.id);
        return sum + (match?.quantity ?? 0);
      }, 0);
      return [line.id, Math.max(0, line.quantity - shippedQty)] as const;
    }),
  );
  const hasRemainingToShip = Object.values(remainingByLine).some((qty) => qty > 0);
  const canCreateShipment =
    (order.status === "Packed" || order.status === "Shipped") &&
    hasRemainingToShip;

  // Mock upcoming settlement preview when not settled yet
  const settlementPreview = order.settlement ?? {
    marketplaceFees: Math.round(order.totals.subtotal * 0.08),
    commission: Math.round(order.totals.subtotal * 0.1),
    shippingCharges: Math.round(order.totals.subtotal * 0.035),
    reverseShipping: 0,
    tcs: Math.round(order.totals.subtotal * 0.01),
    tds: 0,
    netSettlement: Math.round(order.totals.subtotal * 0.775),
    settlementDate: new Date(
      new Date(order.createdAt).getTime() + 5 * 86_400_000,
    )
      .toISOString()
      .slice(0, 10),
    settlementStatus: "expected" as const,
  };

  useEffect(() => {
    setCourier(primaryShipment(order)?.courier ?? SELF_SHIP_COURIERS[0]);
    setTab("summary");
    setMoreOpen(false);
    setShipQty(
      Object.fromEntries(
        order.lines.map((line) => {
          const shippedQty = (order.shipments ?? []).reduce((sum, item) => {
            const match = item.lines.find((entry) => entry.lineId === line.id);
            return sum + (match?.quantity ?? 0);
          }, 0);
          return [line.id, Math.max(0, line.quantity - shippedQty)];
        }),
      ),
    );
  }, [order.id, order.shipments?.length, order.lines]);

  const copyAwb = async () => {
    const awb = shipment?.awb;
    if (!awb || !showAwb) return;
    try {
      await navigator.clipboard.writeText(awb);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const orderTitle = order.orderNumber.startsWith("#")
    ? order.orderNumber
    : order.orderNumber.startsWith("ORD-")
      ? `COS-${order.orderNumber}`
      : `#${order.orderNumber}`;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/30"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-full w-full max-w-3xl flex-col border-l border-slate-200 bg-slate-50 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${orderTitle}`}
      >
        {/* Header */}
        <div className="border-b border-slate-200 bg-white px-5 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2">
              <button
                type="button"
                onClick={onClose}
                className="mt-0.5 shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Back to orders"
                title="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 font-mono">
                  <h2 className="text-xl font-black tracking-tight text-slate-900">
                    {orderTitle}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${chip.className}`}
                  >
                    {chip.label}
                  </span>
                  {secondaryBadges.map((badge) => (
                    <span
                      key={badge.label}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                    <img
                      src={marketplaceLogoSrc(order.channel)}
                      alt=""
                      className="h-4 w-4 object-contain"
                    />
                    {order.channel}
                  </span>
                  <span className="mx-1.5 text-slate-300">|</span>
                  {shippingModeLabel(order.shippingMode)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Order Date: {formatDateTime(order.createdAt)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="relative mt-4 flex items-center gap-1 overflow-x-auto">
            {PRIMARY_TABS.map(([id, label]) => {
              const count =
                id === "shipments"
                  ? shipments.length
                  : id === "claims"
                    ? claims.length
                    : 0;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTab(id);
                    setMoreOpen(false);
                  }}
                  className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                    tab === id
                      ? "border-blue-600 text-blue-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                  {count > 0 ? (
                    <span className="ml-1 text-xs font-medium text-slate-400">
                      ({count})
                    </span>
                  ) : null}
                </button>
              );
            })}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className={`inline-flex items-center gap-1 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                  MORE_TABS.some(([id]) => id === tab)
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                More
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {moreOpen ? (
                <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  {MORE_TABS.map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setTab(id);
                        setMoreOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      {label}
                    </button>
                  ))}
                  {canCancel(order) ? (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setMoreOpen(false);
                        onCancel(order);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                    >
                      Cancel order
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "summary" ? (
            <div className="space-y-3">
              {order.activeHold ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  On hold:{" "}
                  {HOLD_REASON_LABELS[order.activeHold.reason as HoldReason] ??
                    order.activeHold.reason}
                  {order.activeHold.note ? ` — ${order.activeHold.note}` : ""}
                </div>
              ) : null}

              <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
                {/* Left column */}
                <div className="space-y-3">
                  <Section
                    title="Order Summary"
                    action={
                      <span className="text-xs font-semibold text-blue-600">
                        Edit
                      </span>
                    }
                  >
                    {primaryLine ? (
                      <div className="mb-3 flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <img
                            src={marketplaceLogoSrc(order.channel)}
                            alt=""
                            className="h-8 w-8 object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {primaryLine.productName}
                            {order.lines.length > 1
                              ? ` +${order.lines.length - 1}`
                              : ""}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            SKU {primaryLine.sku}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <dl className="space-y-2 text-sm">
                      {(
                        [
                          ["Quantity", String(lineCount)],
                          [
                            "Order Value",
                            formatMoney(
                              order.totals?.subtotal ??
                                (order as unknown as { subtotal?: number }).subtotal ??
                                0,
                            ),
                          ],
                          ["Received Date", formatDateTime(order.createdAt)],
                          ["Warehouse", warehouseLabel(order.warehouseId)],
                          [
                            "Shipping Mode",
                            shippingModeLabel(order.shippingMode),
                          ],
                          ["Payment Method", paymentLabel(order)],
                          [
                            "Channel Order ID",
                            order.externalOrderId ?? "—",
                          ],
                          [
                            "Tags",
                            order.tags?.length ? order.tags.join(", ") : "—",
                          ],
                        ] as const
                      ).map(([label, value]) => (
                        <div
                          key={label}
                          className="flex justify-between gap-4 border-b border-slate-50 pb-2 last:border-0 last:pb-0"
                        >
                          <dt className="text-slate-500">{label}</dt>
                          <dd className="max-w-[55%] text-right font-medium text-slate-800">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </Section>

                  <Section title="Shipment Details">
                    <dl className="space-y-2.5 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-slate-500">AWB No.</dt>
                        <dd className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                          {!showAwb ? (
                            <span className="text-slate-400">—</span>
                          ) : shipment?.awb ? (
                            <>
                              {shipment.awb}
                              <button
                                type="button"
                                onClick={() => void copyAwb()}
                                className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                aria-label="Copy AWB"
                              >
                                {copied ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Courier</dt>
                        <dd className="font-medium text-slate-800">
                          {marketplaceShip
                            ? "Marketplace managed"
                            : (shipment?.courier ?? "—")}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Tracking URL</dt>
                        <dd className="max-w-[60%] truncate text-right">
                          {shipment?.trackingUrl ? (
                            <a
                              href={shipment.trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                            >
                              Track
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Last Scan</dt>
                        <dd className="max-w-[60%] text-right font-medium text-slate-800">
                          {shipment
                            ? `${shipmentEventLabel(shipment.event)}, ${formatDateTime(shipment.updatedAt)}`
                            : "—"}
                        </dd>
                      </div>
                    </dl>
                  </Section>
                </div>

                {/* Right column */}
                <div className="space-y-3">
                  <Section title={actionsTitle}>
                    <div className="space-y-2">
                      {needsAccept && acceptAction ? (
                        <>
                          <p className="text-xs leading-relaxed text-slate-500">
                            {requiresMarketplaceAccept(order)
                              ? `${order.channel} requires seller acceptance before fulfilment.`
                              : "Confirm this imported order to start fulfilment."}
                          </p>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => onRunAction(order, acceptAction)}
                            className="h-10 w-full rounded-lg border border-blue-600 bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
                          >
                            {acceptActionLabel(order)}
                          </button>
                          {lifecycleActions.map((action) => (
                            <button
                              key={action.path + action.label}
                              type="button"
                              disabled={submitting}
                              onClick={() => onRunAction(order, action)}
                              className="h-10 w-full rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
                            >
                              {action.label}
                            </button>
                          ))}
                        </>
                      ) : null}

                      {openClaim ? (
                        <button
                          type="button"
                          onClick={() => setTab("claims")}
                          className="h-10 w-full rounded-lg border border-amber-300 bg-amber-50 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                        >
                          View Claims ({claims.length})
                        </button>
                      ) : null}

                      {!needsAccept && lifecycleActions.length > 0 ? (
                        <>
                          {lifecycleActions.map((action) => (
                            <button
                              key={action.path + action.label}
                              type="button"
                              disabled={submitting}
                              onClick={() => onRunAction(order, action)}
                              className="h-10 w-full rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
                            >
                              {action.label}
                            </button>
                          ))}
                        </>
                      ) : null}

                      {marketplaceShip && !needsAccept ? (
                        <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                          Courier and AWB are managed by{" "}
                          <span className="font-semibold text-slate-800">
                            {order.channel}
                          </span>{" "}
                          ({shippingModeLabel(order.shippingMode)}). Seller
                          shipping actions are not required.
                        </p>
                      ) : null}

                      {selfShip && !needsAccept ? (
                        <>
                          <div className="relative">
                            <div className="pointer-events-none flex h-10 w-full items-center justify-center rounded-lg border border-blue-600 bg-blue-600 text-sm font-semibold text-white">
                              Select Courier
                            </div>
                            <select
                              value={courier}
                              onChange={(event) =>
                                setCourier(event.target.value)
                              }
                              disabled={Boolean(shipment?.shippedAt)}
                              className="absolute inset-0 h-10 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                              aria-label="Select courier"
                            >
                              {SELF_SHIP_COURIERS.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                            <p className="mt-1 text-center text-[11px] font-medium text-slate-500">
                              {courier}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={submitting || Boolean(shipment?.awb)}
                            onClick={() =>
                              onLabelAction(
                                order,
                                generateAwb ?? {
                                  kind: "ensure_label",
                                  label: "Generate AWB",
                                  download: false,
                                },
                                { courier },
                              )
                            }
                            className="h-10 w-full rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Generate AWB
                          </button>
                        </>
                      ) : null}

                      {!needsAccept && (selfShip || marketplaceShip) ? (
                        <>
                          <button
                            type="button"
                            disabled={submitting || !generateLabel}
                            onClick={() => {
                              if (!generateLabel) return;
                              onLabelAction(
                                order,
                                generateLabel,
                                selfShip ? { courier } : undefined,
                              );
                            }}
                            className="h-10 w-full rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {marketplaceShip
                              ? "Generate Marketplace Label"
                              : "Generate Label"}
                          </button>

                          <button
                            type="button"
                            disabled={submitting || !printAction}
                            onClick={() => {
                              if (!printAction) return;
                              onLabelAction(
                                order,
                                printAction,
                                selfShip ? { courier } : undefined,
                              );
                            }}
                            className="h-10 w-full rounded-lg text-sm font-semibold text-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-slate-300"
                          >
                            Print Label
                          </button>

                          <button
                            type="button"
                            disabled={submitting || !shipAction}
                            onClick={() => {
                              if (!shipAction) return;
                              onRunAction(
                                order,
                                selfShip
                                  ? {
                                      ...shipAction,
                                      body: {
                                        ...shipAction.body,
                                        courier,
                                      },
                                    }
                                  : shipAction,
                              );
                            }}
                            className="h-10 w-full rounded-lg bg-[#1e293b] text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Mark as Shipped
                          </button>
                        </>
                      ) : null}

                      {!needsAccept &&
                      !selfShip &&
                      !marketplaceShip &&
                      lifecycleActions.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No actions available for this status.
                        </p>
                      ) : null}
                    </div>
                  </Section>

                  <Section title="Settlement (Upcoming)">
                    <dl className="space-y-2 text-sm">
                      {(
                        [
                          ["Marketplace Fees", settlementPreview.marketplaceFees],
                          ["Shipping Charges", settlementPreview.shippingCharges],
                          ["Commission", settlementPreview.commission],
                          ["TCS", settlementPreview.tcs],
                        ] as const
                      ).map(([label, value]) => (
                        <div
                          key={label}
                          className="flex justify-between gap-3 text-slate-600"
                        >
                          <dt>{label}</dt>
                          <dd>{formatMoney(value)}</dd>
                        </div>
                      ))}
                      <div className="flex justify-between gap-3 border-t border-slate-100 pt-2">
                        <dt className="font-semibold text-slate-900">
                          Net Settlement
                        </dt>
                        <dd className="font-bold text-slate-900">
                          {formatMoney(settlementPreview.netSettlement)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 text-xs text-slate-500">
                        <dt>Expected Date</dt>
                        <dd>
                          {settlementPreview.settlementDate
                            ? new Date(
                                settlementPreview.settlementDate,
                              ).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </dd>
                      </div>
                    </dl>
                  </Section>
                </div>
              </div>

              {/* Bottom cards */}
              <div className="grid gap-3 sm:grid-cols-3">
                <section className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Notes ({notes.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setTab("audit")}
                      className="text-xs font-semibold text-blue-600"
                    >
                      View All
                    </button>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-slate-600">
                    {notes[0]?.body ?? "No notes yet."}
                  </p>
                  {notes[0] ? (
                    <p className="mt-1 text-[10px] text-slate-400">
                      — {notes[0].user}
                    </p>
                  ) : null}
                  <div className="mt-2 flex gap-1.5">
                    <input
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Add note"
                      className="h-8 min-w-0 flex-1 rounded-md border border-slate-200 px-2 text-xs"
                    />
                    <button
                      type="button"
                      disabled={!note.trim() || submitting}
                      onClick={() => {
                        onAddNote(order, note);
                        setNote("");
                      }}
                      className="rounded-md bg-blue-600 px-2 text-[10px] font-semibold text-white disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
                  <h4 className="text-sm font-semibold text-slate-900">Return</h4>
                  <p className="mt-2 text-xs text-slate-600">
                    {order.returnCase
                      ? `${order.returnCase.kind} · ${order.returnCase.status}`
                      : "No return initiated."}
                  </p>
                  <button
                    type="button"
                    disabled={submitting || Boolean(order.returnCase)}
                    onClick={() =>
                      onRunAction(order, {
                        label: "Initiate Return",
                        path: "returns",
                        body: {
                          kind: "return",
                          reason: "Customer requested return",
                        },
                      })
                    }
                    className="mt-2 text-xs font-semibold text-blue-600 hover:underline disabled:opacity-40"
                  >
                    Initiate Return
                  </button>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Claims ({claims.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setTab("claims")}
                      className="text-xs font-semibold text-blue-600"
                    >
                      View All
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    {claims[0]
                      ? `${claims[0].type.replace(/_/g, " ")} · ${formatDateTime(claims[0].openedAt)}`
                      : "No claims raised."}
                  </p>
                </section>
              </div>
            </div>
          ) : null}

          {tab === "shipments" ? (
            <div className="space-y-3">
              {shipments.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {shipmentEventLabel(item.event)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {showAwb && item.awb ? item.awb : "AWB hidden / N/A"}
                    {item.courier ? ` · ${item.courier}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Lines:{" "}
                    {item.lines
                      .map((entry) => {
                        const line = order.lines.find(
                          (candidate) => candidate.id === entry.lineId,
                        );
                        return `${line?.sku ?? entry.lineId} × ${entry.quantity}`;
                      })
                      .join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {warehouseLabel(item.warehouseId)} ·{" "}
                    {formatDateTime(item.updatedAt)}
                  </p>
                </div>
              ))}

              {canCreateShipment ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {shipments.length === 0
                      ? "Create shipment"
                      : "Create partial shipment"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Set quantities to ship now. Remaining units can ship later.
                  </p>
                  <div className="mt-3 space-y-2">
                    {order.lines.map((line) => {
                      const remaining = remainingByLine[line.id] ?? 0;
                      if (remaining <= 0) return null;
                      return (
                        <label
                          key={line.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="min-w-0 truncate text-slate-700">
                            {line.sku}{" "}
                            <span className="text-xs text-slate-400">
                              (remaining {remaining})
                            </span>
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={remaining}
                            value={shipQty[line.id] ?? 0}
                            onChange={(event) => {
                              const next = Math.min(
                                remaining,
                                Math.max(0, Number(event.target.value) || 0),
                              );
                              setShipQty((current) => ({
                                ...current,
                                [line.id]: next,
                              }));
                            }}
                            className="h-8 w-20 rounded-md border border-slate-200 px-2 text-right text-sm"
                          />
                        </label>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    disabled={
                      submitting ||
                      !order.lines.some(
                        (line) => (shipQty[line.id] ?? 0) > 0,
                      )
                    }
                    onClick={() => {
                      const body = {
                        lines: order.lines
                          .map((line) => ({
                            lineId: line.id,
                            quantity: shipQty[line.id] ?? 0,
                          }))
                          .filter((line) => line.quantity > 0),
                        warehouseId: order.warehouseId,
                        courier: selfShip ? courier : undefined,
                      };
                      if (onCreateShipment) onCreateShipment(order, body);
                      else
                        onRunAction(order, {
                          label: "Create shipment",
                          path: "shipments",
                          body,
                        });
                    }}
                    className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Create shipment
                  </button>
                </div>
              ) : shipments.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                  No shipments yet. Pack the order to create one.
                </p>
              ) : null}
            </div>
          ) : null}

          {tab === "timeline" ? (
            <ol className="space-y-2">
              {(order.timeline ?? []).map((entry, index) => (
                <li
                  key={`${entry.status}-${entry.at}-${index}`}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <div className="font-medium text-slate-900">{entry.status}</div>
                  <div className="text-xs text-slate-500">
                    {formatDateTime(entry.at)}
                    {entry.note ? ` · ${entry.note}` : ""}
                  </div>
                </li>
              ))}
            </ol>
          ) : null}

          {tab === "documents" ? (
            <div className="grid grid-cols-2 gap-2">
              {(order.documents ?? []).map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3"
                >
                  <Download className="h-4 w-4 text-slate-400" />
                  <p className="mt-2 text-xs font-semibold capitalize text-slate-700">
                    {doc.type.replace(/_/g, " ")}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {doc.status === "available" ? "Available" : "Not Generated"}
                  </p>
                  {doc.status !== "available" ? (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => onGenerateDocument(order, doc.type)}
                      className="mt-2 text-[10px] font-semibold text-blue-600"
                    >
                      Generate
                    </button>
                  ) : (
                    <a
                      href={
                        doc.type === "shipping_label"
                          ? `/api/v1/orders/${order.id}/label`
                          : `/api/v1/orders/${order.id}/documents/${doc.type}`
                      }
                      className="mt-2 inline-block text-[10px] font-semibold text-blue-600"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : null}

          {tab === "claims" ? (
            <div className="space-y-4">
              {claims.length === 0 ? (
                <p className="text-sm text-slate-500">No claims.</p>
              ) : (
                <ul className="space-y-2">
                  {claims.map((claim) => (
                    <li
                      key={claim.id}
                      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm"
                    >
                      <div className="font-medium capitalize text-amber-950">
                        {claim.type.replace(/_/g, " ")} · {claim.status}
                      </div>
                      <p className="mt-1 text-xs text-amber-900/70">
                        Raised {formatDateTime(claim.openedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                <p className="mb-2 text-xs font-semibold text-slate-700">
                  Raise claim
                </p>
                <div className="space-y-2">
                  <select
                    value={claimType}
                    onChange={(event) =>
                      setClaimType(event.target.value as ClaimType)
                    }
                    className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm"
                  >
                    {CLAIM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  <input
                    value={claimNote}
                    onChange={(event) => setClaimNote(event.target.value)}
                    placeholder="Optional note"
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  />
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      onAddClaim(order, claimType, claimNote || undefined);
                      setClaimNote("");
                    }}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Submit claim
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "returns" ? (
            <div className="space-y-3">
              {!showReturns ? (
                <p className="text-sm text-slate-500">
                  No return or RTO case on this order.
                </p>
              ) : null}
              {order.returnCase ? (
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                  <p className="text-sm font-semibold capitalize text-violet-900">
                    {order.returnCase.kind} · {order.returnCase.status}
                  </p>
                  <p className="mt-1 text-sm text-violet-800/80">
                    {order.returnCase.reason}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {order.returnCase.kind === "return" &&
                    order.returnCase.status === "requested" ? (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() =>
                          onRunAction(order, {
                            label: "Approve return",
                            path: "returns/approve",
                          })
                        }
                        className="rounded-lg border border-violet-300 bg-white px-2.5 py-1 text-xs font-semibold text-violet-800"
                      >
                        Approve
                      </button>
                    ) : null}
                    {order.returnCase.kind === "return" &&
                    order.returnCase.status === "approved" ? (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() =>
                          onRunAction(order, {
                            label: "Mark in transit",
                            path: "returns/in-transit",
                          })
                        }
                        className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-800"
                      >
                        Mark in transit
                      </button>
                    ) : null}
                    {order.returnCase.status === "in_transit" ? (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() =>
                          onRunAction(order, {
                            label: "Receive at WH",
                            path: "returns/receive",
                          })
                        }
                        className="rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-xs font-semibold text-sky-800"
                      >
                        Receive at WH
                      </button>
                    ) : null}
                    {order.returnCase.status === "received"
                      ? (["restock", "refurbish", "scrap"] as const).map(
                          (d) => (
                            <button
                              key={d}
                              type="button"
                              disabled={submitting}
                              onClick={() => onDisposeReturn(order, d)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold capitalize text-slate-700"
                            >
                              {d}
                            </button>
                          ),
                        )
                      : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "settlement" ? (
            <dl className="space-y-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              {(
                [
                  ["Marketplace fees", settlementPreview.marketplaceFees],
                  ["Commission", settlementPreview.commission],
                  ["Shipping charges", settlementPreview.shippingCharges],
                  ["Reverse shipping", settlementPreview.reverseShipping],
                  ["TCS", settlementPreview.tcs],
                  ["TDS", settlementPreview.tds],
                  ["Net settlement", settlementPreview.netSettlement],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-medium">{formatMoney(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {tab === "audit" ? (
            <ol className="space-y-2">
              {(order.activity ?? []).map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <div className="font-medium text-slate-900">{entry.action}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {formatDateTime(entry.at)} · {entry.user}
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { isAwbVisible, primaryShipment, type Order } from "@/lib/orders";

import {
  canCancel,
  formatDateTime,
  formatMoney,
  marketplaceLogoSrc,
  nextActions,
  opsChip,
  opsSecondaryBadges,
  orderDetailTag,
  shippingModeActions,
  shippingModeLabel,
  type ShippingUiAction,
} from "./order-ops";

interface OrdersDataTableProps {
  orders: Order[];
  selectedIds: Set<string>;
  activeId?: string | null;
  submitting?: boolean;
  onToggle(id: string): void;
  onToggleAll(ids: string[]): void;
  onOpen(order: Order): void;
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
}

export default function OrdersDataTable({
  orders,
  selectedIds,
  activeId,
  submitting,
  onToggle,
  onToggleAll,
  onOpen,
  onRunAction,
  onLabelAction,
  onCancel,
}: OrdersDataTableProps) {
  const [menuId, setMenuId] = useState<string | null>(null);
  const allSelected =
    orders.length > 0 && orders.every((o) => selectedIds.has(o.id));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => onToggleAll(orders.map((o) => o.id))}
                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3">Order Details</th>
              <th className="px-4 py-3">Marketplace</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Shipping Mode</th>
              <th className="px-4 py-3">AWB</th>
              <th className="px-4 py-3">Order Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  No orders match these filters.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const chip = opsChip(order);
                const secondary = opsSecondaryBadges(order);
                const tag = orderDetailTag(order);
                const line = order.lines[0];
                const selected =
                  selectedIds.has(order.id) || activeId === order.id;
                  const labelActions = shippingModeActions(order);
                  const showAwb = isAwbVisible(order.shippingMode);
                  const shipment = primaryShipment(order);
                  const awb = shipment?.awb;
                  return (
                    <tr
                      key={order.id}
                      onClick={() => onOpen(order)}
                      className={`cursor-pointer transition hover:bg-slate-50 ${
                        selected ? "bg-violet-50/80" : ""
                      }`}
                    >
                      <td
                        className="px-4 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(order.id)}
                          onChange={() => onToggle(order.id)}
                          className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5 font-mono">
                          <span className="font-black text-slate-900">
                            {order.orderNumber.startsWith("#")
                              ? order.orderNumber
                              : `#${order.orderNumber}`}
                          </span>
                          {tag ? (
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${tag.className}`}
                            >
                              {tag.label}
                            </span>
                          ) : null}
                        </div>
                        {line ? (
                          <>
                            <div className="mt-0.5 text-xs font-mono font-medium text-slate-600">
                              {line.sku}
                              {order.lines.length > 1
                                ? ` +${order.lines.length - 1} more`
                                : ""}
                            </div>
                            <div className="text-xs font-mono font-bold text-slate-900">
                              Qty {line.quantity} ·{" "}
                              {formatMoney(
                                order.totals?.subtotal ??
                                  (order as unknown as { subtotal?: number }).subtotal ??
                                  0,
                              )}
                            </div>
                          </>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <img
                              src={marketplaceLogoSrc(order.channel)}
                              alt={order.channel}
                              className="h-6 w-6 object-contain"
                            />
                          </span>
                          <div>
                            <div className="font-medium text-slate-800">
                              {order.channel}
                            </div>
                            <div className="text-xs text-slate-500">
                              {shippingModeLabel(order.shippingMode)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${chip.className}`}
                          >
                            {chip.label}
                          </span>
                          {secondary.map((badge) => (
                            <span
                              key={badge.label}
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {shippingModeLabel(order.shippingMode)}
                      </td>
                      <td className="px-4 py-3">
                        {!showAwb ? (
                          <span
                            className="text-slate-400"
                            title="AWB is only available inside the marketplace label"
                          >
                            —
                          </span>
                        ) : awb ? (
                          <span className="font-medium text-slate-800">
                            {awb}
                          </span>
                        ) : order.status === "Packed" ? (
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={(event) => {
                              event.stopPropagation();
                              onLabelAction(order, {
                                kind: "ensure_label",
                                label: "Generate AWB",
                                download: false,
                              });
                            }}
                            className="font-semibold text-violet-600 hover:underline disabled:opacity-50"
                          >
                            Generate AWB
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td
                      className="relative px-4 py-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                        onClick={() =>
                          setMenuId(menuId === order.id ? null : order.id)
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {menuId === order.id ? (
                        <div className="absolute right-4 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                          {labelActions.map((action) => (
                            <button
                              key={`${action.kind}-${action.label}`}
                              type="button"
                              disabled={submitting}
                              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                              onClick={() => {
                                setMenuId(null);
                                onLabelAction(order, action);
                              }}
                            >
                              {action.label}
                            </button>
                          ))}
                          {nextActions(order).map((action) => (
                            <button
                              key={action.label}
                              type="button"
                              disabled={submitting}
                              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                              onClick={() => {
                                setMenuId(null);
                                onRunAction(order, action);
                              }}
                            >
                              {action.label}
                            </button>
                          ))}
                          {canCancel(order) ? (
                            <button
                              type="button"
                              disabled={submitting}
                              className="block w-full px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                              onClick={() => {
                                setMenuId(null);
                                onCancel(order);
                              }}
                            >
                              Cancel order
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

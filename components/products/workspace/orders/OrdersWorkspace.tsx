"use client";

import { safeResponseJson } from "@/lib/api/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";

import type { Order } from "@/lib/orders";
import type { Product } from "@/lib/types/product";
import {
  MetricTile,
  WorkspacePanel,
} from "../shared/WorkspacePanel";

interface OrdersWorkspaceProps {
  product: Product;
}

function formatPlacedAt(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 24) {
    return hours <= 1 ? "Today • 1 hour ago" : `Today • ${hours} hours ago`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function OrdersWorkspace({
  product,
}: OrdersWorkspaceProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/orders?productId=${encodeURIComponent(product.id)}`,
      );
      const payload = await safeResponseJson(response);
      setOrders(payload.data as Order[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [product.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const total30d = product.listings.reduce(
    (sum, listing) => sum + listing.orders30Days,
    0,
  );

  const openCount = orders.filter(
    (order) =>
      order.status !== "Closed" &&
      order.status !== "Cancelled" &&
      order.status !== "Settled",
  ).length;

  const rows = useMemo(() => {
    return orders.map((order) => {
      const lineQty = order.lines
        .filter((line) => line.productId === product.id)
        .reduce((sum, line) => sum + line.quantity, 0);
      return {
        id: order.id,
        orderId: order.externalOrderId ?? order.orderNumber,
        marketplace: order.channel,
        status: order.status,
        qty:
          lineQty ||
          order.lines.reduce((sum, line) => sum + line.quantity, 0),
        amount: order.totals.subtotal,
        placedAt: formatPlacedAt(order.createdAt),
        tracking: order.shipping?.trackingNumber,
        returnKind: order.returnCase?.kind,
        returnStatus: order.returnCase?.status,
      };
    });
  }, [orders, product.id]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile
          label="Orders Today"
          value={product.performance.ordersToday}
          tone="blue"
        />
        <MetricTile
          label="Orders 30D"
          value={total30d}
          tone="emerald"
        />
        <MetricTile
          label="Open in OMS"
          value={openCount}
          tone="violet"
        />
      </div>

      <WorkspacePanel
        title="Recent Orders"
        description="Product-scoped OMS statuses from receive through settle/close."
      >
        {loading ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Loading orders…
          </p>
        ) : error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-10 text-center text-sm text-rose-700">
            {error}
          </p>
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No recent orders for this product.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-semibold">Order</th>
                  <th className="px-3 py-2 font-semibold">Channel</th>
                  <th className="px-3 py-2 font-semibold">Qty</th>
                  <th className="px-3 py-2 font-semibold">Amount</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Return</th>
                  <th className="px-3 py-2 font-semibold">Tracking</th>
                  <th className="px-3 py-2 font-semibold">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((order) => (
                  <tr key={order.id}>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 font-semibold text-slate-900">
                        <ShoppingCart className="h-4 w-4 text-slate-400" />
                        #{order.orderId}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {order.marketplace}
                    </td>
                    <td className="px-3 py-3">{order.qty}</td>
                    <td className="px-3 py-3 font-medium">
                      ₹{order.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {order.returnKind ? (
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            order.returnKind === "return"
                              ? "bg-violet-100 text-violet-800"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {order.returnKind === "return" ? "Return" : "RTO"} ·{" "}
                          {order.returnStatus}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-500">
                      {order.tracking ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-500">
                      {order.placedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WorkspacePanel>
    </div>
  );
}

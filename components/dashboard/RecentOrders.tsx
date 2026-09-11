"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";

interface RecentOrdersProps {
  orders?: Array<{
    id: string;
    customer: string;
    product: string;
    marketplace: string;
    amount: number | string;
    status: string;
  }>;
}

export default function RecentOrders({ orders = [] }: RecentOrdersProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-extrabold tracking-tight text-slate-900">
            Recent Orders
          </h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Latest customer purchases
          </p>
        </div>

        <Link
          href="/orders"
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 shadow-2xs"
        >
          View All
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-slate-700">No orders recorded yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
            Customer orders from connected channels will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="pb-2.5">Order</th>
                <th className="pb-2.5">Customer</th>
                <th className="pb-2.5">Product</th>
                <th className="pb-2.5">Marketplace</th>
                <th className="pb-2.5">Amount</th>
                <th className="pb-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b last:border-0 transition-colors duration-200 hover:bg-slate-50"
                >
                  <td className="py-3 text-xs font-semibold text-blue-600">
                    {order.id}
                  </td>
                  <td className="text-xs text-slate-700">{order.customer}</td>
                  <td className="text-xs text-slate-700">{order.product}</td>
                  <td className="text-xs">
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {order.marketplace}
                    </span>
                  </td>
                  <td className="text-xs font-mono font-bold text-slate-900">
                    {typeof order.amount === "number" ? `₹${order.amount.toFixed(2)}` : order.amount}
                  </td>
                  <td className="text-xs">
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
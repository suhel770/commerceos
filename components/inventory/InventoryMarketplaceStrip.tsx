"use client";

import type { MarketplaceChannelHealth } from "./inventory-command";

const STATUS: Record<MarketplaceChannelHealth["status"], string> = {
  Healthy: "bg-emerald-50 text-emerald-800",
  "Low Stock": "bg-amber-50 text-amber-900",
  "Out of Stock": "bg-rose-50 text-rose-800",
  Watch: "bg-orange-50 text-orange-900",
};

type Props = {
  channels: MarketplaceChannelHealth[];
};

export default function InventoryMarketplaceStrip({ channels }: Props) {
  if (channels.length === 0) return null;

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h2 className="text-sm font-semibold text-slate-900">
          Marketplace Inventory
        </h2>
        <p className="text-[11px] text-slate-500">
          Visualization only — core stock is never duplicated.
        </p>
      </div>
      <div className="mt-2 grid flex-1 grid-cols-2 content-start gap-1.5">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1.5"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900">
                {ch.channel}
              </p>
              <p className="truncate text-[10px] text-slate-500">{ch.detail}</p>
            </div>
            <span
              className={`shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${STATUS[ch.status]}`}
            >
              {ch.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

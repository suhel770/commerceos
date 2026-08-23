"use client";

import type { InventoryForecastCard } from "./inventory-command";

const SEVERITY: Record<InventoryForecastCard["severity"], string> = {
  ok: "border-emerald-100",
  watch: "border-amber-100",
  risk: "border-rose-100",
  opportunity: "border-orange-100",
};

type Props = {
  cards: InventoryForecastCard[];
};

export default function InventoryForecastStrip({ cards }: Props) {
  if (cards.length === 0) return null;

  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Inventory Forecast
        </h2>
        <p className="text-xs text-slate-500">
          Rule-based from planning — optional; stock engine works without it.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`rounded-xl border bg-white px-3 py-2.5 shadow-sm ${SEVERITY[card.severity]}`}
          >
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {card.title}
            </p>
            <p className="mt-1 truncate text-sm font-bold text-slate-900">
              {card.value}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-500">
              {card.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

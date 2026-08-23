"use client";

import type { InventorySmartRec } from "./inventory-command";

type Props = {
  items: InventorySmartRec[];
  onAct(item: InventorySmartRec): void;
};

export default function InventorySmartRecs({ items, onAct }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Smart Recommendations
      </h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Contextual actions with why — never automated.
      </p>
      <ul className="mt-3 grid gap-2 md:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900">
                {item.title}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Why: {item.why}</p>
            </div>
            <button
              type="button"
              onClick={() => onAct(item)}
              className="shrink-0 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
            >
              Review
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

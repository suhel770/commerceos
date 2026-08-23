"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";

export type AiRec = {
  id: string;
  title: string;
  why: string;
};

type PurchaseAiRecsProps = {
  enabled: boolean;
  items: AiRec[];
};

export default function PurchaseAiRecs({ enabled, items }: PurchaseAiRecsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!enabled) return null;

  const visible = items.filter((item) => !dismissed.has(item.id));
  if (visible.length === 0) return null;

  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50/60 px-3 py-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-700">
        <Sparkles size={13} />
        Optional AI recommendations
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {visible.map((item) => (
          <div
            key={item.id}
            className="relative rounded-lg border border-violet-100 bg-white px-3 py-2.5 shadow-sm"
          >
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() =>
                setDismissed((prev) => new Set(prev).add(item.id))
              }
              className="absolute right-1.5 top-1.5 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={12} />
            </button>
            <p className="pr-5 text-xs font-semibold text-slate-900">
              {item.title}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">{item.why}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

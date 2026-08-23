"use client";

import { ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";

import type { InventoryFocusItem } from "./inventory-command";

type Props = {
  focusItems: InventoryFocusItem[];
  loading?: boolean;
  primaryLabel: string;
  onPrimaryAction(): void;
  onFocusNavigate(key: InventoryFocusItem["onNavigateKey"]): void;
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function isClear(item: InventoryFocusItem) {
  return item.tone === "slate" || item.id === "clear";
}

export default function InventoryMorningSummary({
  focusItems,
  loading,
  primaryLabel,
  onPrimaryAction,
  onFocusNavigate,
}: Props) {
  const attentionItems = focusItems.filter((item) => !isClear(item));
  const attentionCount = attentionItems.length;
  const clear = attentionCount === 0;

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Today&apos;s Inventory
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {greeting()}, Amir — what needs action
          </p>
        </div>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            clear ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"
          }`}
        >
          {clear ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
        </span>
      </div>

      {loading ? (
        <div className="mt-3 h-24 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <>
          <div className="mt-3 flex items-end gap-1.5">
            <p
              className={`text-3xl font-bold leading-none tracking-tight ${
                clear ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {attentionCount}
            </p>
            <p className="mb-0.5 text-xs font-semibold text-slate-600">
              {clear ? "All clear" : "Need attention"}
            </p>
          </div>

          <ul className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-hidden">
            {(clear ? focusItems.slice(0, 1) : attentionItems.slice(0, 4)).map(
              (item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onFocusNavigate(item.onNavigateKey)}
                    className="group flex w-full items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-1.5 text-left transition hover:border-sky-200 hover:bg-sky-50/50"
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        item.tone === "rose"
                          ? "bg-rose-500"
                          : item.tone === "amber"
                            ? "bg-amber-500"
                            : item.tone === "orange"
                              ? "bg-orange-500"
                              : item.tone === "violet"
                                ? "bg-violet-500"
                                : "bg-emerald-500"
                      }`}
                    />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 group-hover:text-slate-900">
                      {item.label}
                    </span>
                    <ArrowRight
                      size={12}
                      className="shrink-0 text-slate-300 group-hover:text-sky-600"
                    />
                  </button>
                </li>
              ),
            )}
          </ul>
        </>
      )}

      <button
        type="button"
        onClick={onPrimaryAction}
        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-sky-700 px-3 text-xs font-semibold text-white transition hover:bg-sky-800"
      >
        {primaryLabel}
        <ArrowRight size={13} />
      </button>
    </section>
  );
}

"use client";

import { ArrowRight } from "lucide-react";

import type { TodayFocusItem } from "./purchase-ops";

type PurchaseMorningSummaryProps = {
  focusItems: TodayFocusItem[];
  loading?: boolean;
  onPrimaryAction(): void;
  primaryLabel: string;
  onFocusNavigate(key: TodayFocusItem["onNavigateKey"]): void;
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const DOT: Record<TodayFocusItem["tone"], string> = {
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  violet: "bg-violet-500",
  slate: "bg-slate-400",
};

export default function PurchaseMorningSummary({
  focusItems,
  loading,
  onPrimaryAction,
  primaryLabel,
  onFocusNavigate,
}: PurchaseMorningSummaryProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-gradient-to-br from-white via-violet-50/30 to-white px-3.5 py-3 shadow-sm">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600">
              Today&apos;s procurement
            </p>
            <h2 className="text-base font-bold tracking-tight text-slate-950">
              {greeting()}, Amir
            </h2>
            <p className="text-xs text-slate-500">— today&apos;s focus</p>
          </div>
          {loading ? (
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {Array.from({ length: 3 }).map((_, index) => (
                <li
                  key={index}
                  className="h-4 w-40 animate-pulse rounded bg-slate-100"
                />
              ))}
            </ul>
          ) : focusItems.length === 0 ? (
            <p className="mt-1.5 text-xs text-emerald-700">
              No urgent procurement work — you are clear for now.
            </p>
          ) : (
            <ul className="mt-1.5 grid gap-0.5 text-xs sm:grid-cols-2">
              {focusItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onFocusNavigate(item.onNavigateKey)}
                    className="flex w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-slate-700 hover:bg-white/80 hover:text-violet-800"
                  >
                    <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                      {item.tone !== "slate" ? (
                        <>
                          <span
                            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 duration-1000 ${DOT[item.tone]}`}
                          />
                          <span
                            className={`relative inline-flex h-1.5 w-1.5 rounded-full animate-pulse ${DOT[item.tone]}`}
                          />
                        </>
                      ) : (
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[item.tone]}`}
                        />
                      )}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2.5 rounded-lg border border-violet-200 bg-white px-3 py-2 shadow-sm">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Next action
            </p>
            <p className="max-w-[200px] truncate text-xs font-medium text-slate-800">
              {primaryLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onPrimaryAction}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-violet-600 px-2.5 text-[11px] font-semibold text-white hover:bg-violet-700"
          >
            Take action
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </section>
  );
}

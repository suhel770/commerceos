"use client";

import { Activity, Check, X } from "lucide-react";

import type { InventoryHealthScore } from "./inventory-command";

type Props = {
  health: InventoryHealthScore;
  loading?: boolean;
};

export default function InventoryHealthCard({ health, loading }: Props) {
  const tone =
    health.score >= 85
      ? {
          score: "text-emerald-600",
          badge: "bg-emerald-50 text-emerald-700",
          icon: "bg-emerald-50 text-emerald-600",
        }
      : health.score >= 65
        ? {
            score: "text-amber-600",
            badge: "bg-amber-50 text-amber-800",
            icon: "bg-amber-50 text-amber-700",
          }
        : {
            score: "text-rose-600",
            badge: "bg-rose-50 text-rose-700",
            icon: "bg-rose-50 text-rose-600",
          };

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Inventory Health
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Overall stock posture with reasons
          </p>
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}
        >
          <Activity size={18} />
        </span>
      </div>

      {loading ? (
        <div className="mt-5 h-28 animate-pulse rounded-xl bg-slate-100" />
      ) : (
        <>
          <div className="mt-4 flex items-end gap-3">
            <p className={`text-4xl font-bold tracking-tight ${tone.score}`}>
              {health.score}%
            </p>
            <span
              className={`mb-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.badge}`}
            >
              {health.label}
            </span>
          </div>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Why
          </p>
          <ul className="mt-2 space-y-2">
            {health.reasons.map((reason) => (
              <li
                key={reason.id}
                className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm text-slate-700"
              >
                {reason.ok ? (
                  <Check
                    size={14}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                ) : (
                  <X size={14} className="mt-0.5 shrink-0 text-rose-500" />
                )}
                <span className="min-w-0 leading-snug">{reason.label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

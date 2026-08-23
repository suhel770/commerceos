"use client";

import type { ReactNode } from "react";

export function WorkspacePanel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function MetricTile({
  label,
  value,
  hint,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "slate" | "blue" | "emerald" | "amber" | "rose" | "violet";
}) {
  const tones = {
    slate: "bg-slate-50 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    violet: "bg-violet-50 text-violet-700",
  } as const;

  return (
    <div className={`rounded-xl px-4 py-3 ${tones[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

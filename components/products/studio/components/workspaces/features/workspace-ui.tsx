"use client";

import type { ReactNode } from "react";

export function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
      <h3 className="text-xs font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-0.5 text-[11px] text-slate-400 font-medium leading-normal">
        {description}
      </p>

      <div className="mt-3">
        {children}
      </div>
    </section>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="space-y-1 block">
      <span className="block text-[11px] font-bold text-slate-700">
        {label}
      </span>

      {children}

      {hint && (
        <span className="block text-[10px] text-slate-400 font-medium">
          {hint}
        </span>
      )}
    </label>
  );
}

export function EmptyState({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-xs text-slate-500 font-medium">
      {children}
    </div>
  );
}

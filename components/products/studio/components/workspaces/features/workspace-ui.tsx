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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-lg font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-5">
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
    <label className="space-y-2">
      <span className="block text-sm font-medium text-slate-700">
        {label}
      </span>

      {children}

      {hint && (
        <span className="block text-xs text-slate-500">
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
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

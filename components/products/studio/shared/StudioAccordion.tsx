"use client";

import { ArrowLeft } from "lucide-react";

import { useStudio } from "../context/StudioContext";

interface StudioAccordionProps {
  title: string;
  description?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export default function StudioAccordion({
  title,
  description,
  badge,
  children,
  rightSlot,
}: StudioAccordionProps) {
  const { setActiveWorkspace } = useStudio();

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

        <button
          type="button"
          onClick={() => setActiveWorkspace("overview")}
          aria-label="Back to product overview"
          className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              {title}
            </h2>

            {badge && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {badge}
              </span>
            )}
          </div>

          {description && (
            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          )}
        </div>

        {rightSlot && (
          <div className="ml-6 shrink-0">
            {rightSlot}
          </div>
        )}
      </div>

      <div className="bg-slate-50/40 p-6">{children}</div>
    </section>
  );
}

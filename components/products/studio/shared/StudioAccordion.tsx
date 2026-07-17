"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

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
  defaultOpen = false,
  children,
  rightSlot,
}: StudioAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-transparent px-6 py-5">

        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="flex flex-1 items-center gap-4 text-left"
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
              open
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {open ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </div>

          <div>
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
        </button>

        {rightSlot && (
          <div className="ml-6 shrink-0">
            {rightSlot}
          </div>
        )}
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-slate-50/40 p-6">
          {children}
        </div>
      )}
    </section>
  );
}
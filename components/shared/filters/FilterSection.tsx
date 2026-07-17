"use client";

import { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface FilterSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function FilterSection({
  title,
  children,
  defaultOpen = true,
}: FilterSectionProps) {
  return (
    <section className="border-b border-slate-200 py-5 last:border-none">

      <button
        type="button"
        className="
          flex
          w-full
          items-center
          justify-between
          pb-3
        "
      >
        <h3 className="text-sm font-semibold text-slate-900">
          {title}
        </h3>

        <ChevronDown
          size={18}
          className={`transition-transform ${
            defaultOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {defaultOpen && (
        <div className="space-y-3">
          {children}
        </div>
      )}

    </section>
  );
}
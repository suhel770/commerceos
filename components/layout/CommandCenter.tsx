"use client";

import { useCommandCenter } from "@/hooks/useCommandCenter";

export default function CommandCenter() {
  const { open, closeCommandCenter } = useCommandCenter();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-6 backdrop-blur-sm"
      onClick={closeCommandCenter}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-20 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Search */}

        <div className="border-b border-slate-200 p-4">
          <input
            autoFocus
            placeholder="Search products, listings, orders..."
            className="w-full border-0 bg-transparent text-lg outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Placeholder */}

        <div className="p-10 text-center">

          <h3 className="text-lg font-semibold text-slate-800">
            CommerceOS Command Center
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Global search will be connected in the next step.
          </p>

        </div>
      </div>
    </div>
  );
}
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function ProductPagination() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">

      {/* Left */}

      <div className="text-sm text-slate-500">

        Showing

        <span className="mx-2 font-semibold text-slate-900">
          1–25
        </span>

        of

        <span className="mx-2 font-semibold text-slate-900">
          12,846
        </span>

        products

      </div>

      {/* Center */}

      <div className="flex items-center gap-3">

        <span className="text-sm text-slate-500">
          Rows
        </span>

        <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">

          <option>25</option>

          <option>50</option>

          <option>100</option>

          <option>250</option>

        </select>

      </div>

      {/* Right */}

      <div className="flex items-center gap-2">

        <button className="rounded-xl border border-slate-200 p-2 transition hover:bg-slate-100">

          <ChevronLeft size={18} />

        </button>

        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white">
          1
        </button>

        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-100">
          2
        </button>

        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-100">
          3
        </button>

        <button className="rounded-xl border border-slate-200 p-2 transition hover:bg-slate-100">

          <ChevronRight size={18} />

        </button>

      </div>

    </div>
  );
}
import {
  Plus,
  Upload,
  Download,
} from "lucide-react";

export default function ProductControlHeader() {
  return (
    <div className="flex flex-col gap-6">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Product Control Center
          </h1>

          <p className="mt-2 text-slate-500">
            Manage and optimize products across all marketplaces.
          </p>

        </div>

        <div className="flex items-center gap-3">

          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-medium transition hover:bg-slate-50">

            <Upload size={18} />

            Import Products

          </button>

          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-medium transition hover:bg-slate-50">

            <Download size={18} />

            Export

          </button>

          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700">

            <Plus size={18} />

            Add Product

          </button>

        </div>

      </div>

    </div>
  );
}
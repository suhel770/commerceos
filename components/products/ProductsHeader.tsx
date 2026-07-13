import { Plus, Upload, Download } from "lucide-react";

export default function ProductsHeader() {
  return (
    <div className="flex items-center justify-between">

      <div>

        <h1 className="text-3xl font-bold text-slate-900">
          Products
        </h1>

        <p className="mt-1 text-slate-500">
          Manage products across all marketplaces.
        </p>

      </div>

      <div className="flex gap-3">

        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium hover:bg-slate-50">

          <Upload size={18} />

          Import

        </button>

        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium hover:bg-slate-50">

          <Download size={18} />

          Export

        </button>

        <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">

          <Plus size={18} />

          Add Product

        </button>

      </div>

    </div>
  );
}
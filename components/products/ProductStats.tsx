export default function ProductStats() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Total Products</p>

        <h2 className="mt-2 text-2xl font-bold">
          248
        </h2>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Active</p>

        <h2 className="mt-2 text-2xl font-bold text-green-600">
          216
        </h2>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Low Stock</p>

        <h2 className="mt-2 text-2xl font-bold text-amber-500">
          18
        </h2>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Out of Stock</p>

        <h2 className="mt-2 text-2xl font-bold text-red-500">
          14
        </h2>
      </div>
    </div>
  );
}
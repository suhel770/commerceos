export default function SalesOverview() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">
        Sales Overview
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        This Month
      </p>

      <div className="mt-8 space-y-6">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span>Orders</span>
            <span>78%</span>
          </div>

          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 w-[78%] rounded-full bg-blue-600"></div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span>Revenue</span>
            <span>64%</span>
          </div>

          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 w-[64%] rounded-full bg-emerald-500"></div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span>Customers</span>
            <span>91%</span>
          </div>

          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 w-[91%] rounded-full bg-violet-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
import DashboardCard from "./DashboardCard";
import { HeartPulse, ArrowRight } from "lucide-react";

export default function BusinessHealth() {
  const score = 0;

  return (
    <DashboardCard
      title="Business Health"
      subtitle="Overall Business Performance"
      action={
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
          View Report
        </button>
      }
    >
      <div className="space-y-6">

        <div className="flex items-center justify-center">

          <div className="flex h-28 w-28 items-center justify-center rounded-full border-8 border-slate-200 bg-slate-50">

            <div className="text-center">

              <h2 className="text-4xl font-black tracking-tight text-slate-900 font-mono">
                {score}
              </h2>

              <p className="text-xs font-mono font-medium text-slate-400">
                /100
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">

          <div className="flex items-center gap-2">

            <HeartPulse
              size={18}
              className="text-slate-400"
            />

            <span className="text-xs font-extrabold text-slate-900">
              No data yet
            </span>

          </div>

          <p className="mt-1 text-xs text-slate-500 font-medium">
            Sync channels and add products to calculate business health.
          </p>

        </div>

        <div className="space-y-2.5">

          <div className="flex items-center justify-between text-xs">

            <span className="font-semibold text-slate-600">
              Revenue Growth
            </span>

            <span className="font-mono font-bold text-slate-400">
              —
            </span>

          </div>

          <div className="flex items-center justify-between text-xs">

            <span className="font-semibold text-slate-600">
              Inventory
            </span>

            <span className="font-mono font-bold text-slate-400">
              —
            </span>

          </div>

          <div className="flex items-center justify-between text-xs">

            <span className="font-semibold text-slate-600">
              Order Fulfilment
            </span>

            <span className="font-mono font-bold text-slate-400">
              —
            </span>

          </div>

        </div>

        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-extrabold text-white transition hover:bg-slate-800 shadow-sm cursor-pointer">

          Full Business Report

          <ArrowRight size={16} />

        </button>

      </div>
    </DashboardCard>
  );
}
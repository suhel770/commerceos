import DashboardCard from "./DashboardCard";
import { HeartPulse, ArrowRight } from "lucide-react";

export default function BusinessHealth() {
  const score = 94;

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

          <div className="flex h-28 w-28 items-center justify-center rounded-full border-8 border-emerald-500 bg-emerald-50">

            <div className="text-center">

              <h2 className="text-4xl font-bold text-slate-900">
                {score}
              </h2>

              <p className="text-xs text-slate-500">
                /100
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-2xl bg-emerald-50 p-4">

          <div className="flex items-center gap-2">

            <HeartPulse
              size={20}
              className="text-emerald-600"
            />

            <span className="font-semibold text-emerald-700">
              Excellent
            </span>

          </div>

          <p className="mt-2 text-sm text-slate-600">
            Revenue, inventory and order fulfilment are all
            performing above target.
          </p>

        </div>

        <div className="space-y-3">

          <div className="flex items-center justify-between">

            <span className="text-sm text-slate-600">
              Revenue Growth
            </span>

            <span className="font-semibold text-emerald-600">
              Healthy
            </span>

          </div>

          <div className="flex items-center justify-between">

            <span className="text-sm text-slate-600">
              Inventory
            </span>

            <span className="font-semibold text-emerald-600">
              Stable
            </span>

          </div>

          <div className="flex items-center justify-between">

            <span className="text-sm text-slate-600">
              Order Fulfilment
            </span>

            <span className="font-semibold text-emerald-600">
              On Time
            </span>

          </div>

        </div>

        <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800">

          Full Business Report

          <ArrowRight size={18} />

        </button>

      </div>
    </DashboardCard>
  );
}
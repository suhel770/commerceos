import { TrendingUp } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  growth: string;
}

export default function KPICard({
  title,
  value,
  growth,
}: KPICardProps) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2 className="mt-4 text-4xl font-bold text-slate-900">
            {value}
          </h2>

        </div>

        <div className="rounded-2xl bg-blue-50 p-3">
          <TrendingUp
            className="text-blue-600"
            size={28}
          />
        </div>

      </div>

      <div className="mt-6 flex items-center justify-between">

        <p className="font-semibold text-green-600">
          ↑ {growth}
        </p>

        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">

          <div className="h-full w-3/4 rounded-full bg-blue-600"></div>

        </div>

      </div>

    </div>
  );
}
import { LucideIcon, TrendingUp } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export default function KPICard({
  title,
  value,
  change,
  description,
  icon: Icon,
  color,
  bg,
}: KPICardProps) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </h2>

        </div>

        <div className={`rounded-2xl p-3 ${bg}`}>
          <Icon
            size={26}
            className={color}
          />
        </div>

      </div>

      <div className="mt-6 flex items-center justify-between">

        <div>

          <div className="flex items-center gap-2">

            <TrendingUp
              size={16}
              className="text-emerald-600"
            />

            <span className="font-semibold text-emerald-600">
              {change}
            </span>

          </div>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>

        </div>

        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">

          <div className="h-full w-3/4 rounded-full bg-emerald-500"></div>

        </div>

      </div>

    </div>
  );
}
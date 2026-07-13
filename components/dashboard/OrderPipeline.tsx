import DashboardCard from "./DashboardCard";
import {
  Clock3,
  PackageCheck,
  Truck,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

const pipeline = [
  {
    title: "Pending",
    value: 28,
    icon: Clock3,
    color: "bg-amber-100 text-amber-600",
  },
  {
    title: "Packed",
    value: 16,
    icon: PackageCheck,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Shipped",
    value: 42,
    icon: Truck,
    color: "bg-violet-100 text-violet-600",
  },
  {
    title: "Delivered",
    value: 612,
    icon: CheckCircle2,
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    title: "Returned",
    value: 8,
    icon: RotateCcw,
    color: "bg-red-100 text-red-600",
  },
];

export default function OrderPipeline() {
  return (
    <DashboardCard
      title="Order Pipeline"
      subtitle="Today's Order Status"
    >
      <div className="space-y-5">
        {pipeline.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-3 ${item.color}`}>
                  <Icon size={18} />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    {item.title}
                  </p>

                  <p className="text-sm text-slate-500">
                    {item.value} Orders
                  </p>
                </div>
              </div>

              <span className="text-xl font-bold text-slate-900">
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
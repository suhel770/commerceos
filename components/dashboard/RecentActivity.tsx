import DashboardCard from "./DashboardCard";
import {
  Package,
  Truck,
  RefreshCw,
  IndianRupee,
  ArrowRight,
} from "lucide-react";

const activities = [
  {
    id: 1,
    time: "2 min ago",
    title: "Inventory Synced",
    description: "Amazon inventory synchronized successfully.",
    icon: RefreshCw,
    bg: "bg-blue-100",
    color: "text-blue-600",
  },
  {
    id: 2,
    time: "12 min ago",
    title: "Order Dispatched",
    description: "Order #12831 shipped via Delhivery.",
    icon: Truck,
    bg: "bg-emerald-100",
    color: "text-emerald-600",
  },
  {
    id: 3,
    time: "26 min ago",
    title: "Price Updated",
    description: "LW-001 price updated to ₹719.",
    icon: IndianRupee,
    bg: "bg-violet-100",
    color: "text-violet-600",
  },
  {
    id: 4,
    time: "1 hour ago",
    title: "Purchase Order Created",
    description: "250 units ordered from supplier.",
    icon: Package,
    bg: "bg-amber-100",
    color: "text-amber-600",
  },
];

export default function RecentActivity() {
  return (
    <DashboardCard
      title="Recent Activity"
      subtitle="Everything happening in your business"
      action={
        <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
          View All
          <ArrowRight size={16} />
        </button>
      }
    >
      <div className="space-y-5">

        {activities.map((activity) => {

          const Icon = activity.icon;

          return (
            <div
              key={activity.id}
              className="flex gap-4"
            >

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${activity.bg}`}
              >
                <Icon
                  size={20}
                  className={activity.color}
                />
              </div>

              <div className="flex-1 border-b border-slate-100 pb-4 last:border-0">

                <div className="flex items-center justify-between">

                  <h4 className="font-semibold text-slate-900">
                    {activity.title}
                  </h4>

                  <span className="text-xs text-slate-400">
                    {activity.time}
                  </span>

                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {activity.description}
                </p>

              </div>

            </div>
          );

        })}

      </div>
    </DashboardCard>
  );
}
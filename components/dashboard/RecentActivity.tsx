import { ArrowRight, Inbox } from "lucide-react";
import DashboardCard from "./DashboardCard";

export default function RecentActivity() {
  return (
    <DashboardCard
      contentClassName="p-4"
      title="Recent Activity"
      action={
        <button className="text-xs font-semibold text-blue-600">
          View All <ArrowRight className="ml-1 inline h-3 w-3" />
        </button>
      }
    >
      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
        <Inbox className="h-4 w-4 text-slate-400" />
        <p className="text-sm text-slate-500">
          No recent activity yet — orders, price changes, and syncs will show
          here.
        </p>
      </div>
    </DashboardCard>
  );
}

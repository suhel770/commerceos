import { Inbox } from "lucide-react";
import DashboardCard from "./DashboardCard";

export default function AlertsTasks() {
  return (
    <DashboardCard
      className="h-full w-full"
      title="Alerts & Tasks"
      action={
        <button className="text-xs font-semibold text-blue-600">View All</button>
      }
    >
      <div className="flex h-full min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
        <Inbox className="h-5 w-5 text-slate-400" />
        <p className="mt-2 text-sm font-semibold text-slate-700">
          No alerts right now
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Stock, GST, and sync alerts will appear here.
        </p>
      </div>
    </DashboardCard>
  );
}

import { ArrowRight, Megaphone, RefreshCw, RotateCcw, Tag } from "lucide-react";
import DashboardCard from "./DashboardCard";

const activities = [["New Amazon Order", "#408-1234567-890", "10 mins ago", "a", "bg-amber-100 text-amber-700"], ["Price Updated", "LilWalk Clogs (LW-001)", "25 mins ago", Tag, "bg-emerald-100 text-emerald-600"], ["Inventory Synced", "All marketplaces", "1 hour ago", RefreshCw, "bg-blue-100 text-blue-600"], ["Return Approved", "Order #12345", "2 hours ago", RotateCcw, "bg-violet-100 text-violet-600"], ["Ad Campaign Started", "Summer Sale Campaign", "3 hours ago", Megaphone, "bg-sky-100 text-sky-600"]] as const;

export default function RecentActivity() {
  return <DashboardCard contentClassName="p-3" title="Recent Activity" action={<button className="text-xs font-semibold text-blue-600">View All <ArrowRight className="ml-1 inline h-3 w-3" /></button>}>
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">{activities.map(([title, detail, time, Icon, color]) => <div key={title} className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-50 p-2"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg font-bold ${color}`}>{typeof Icon === "string" ? Icon : <Icon className="h-4 w-4" />}</span><div className="min-w-0"><p className="truncate text-[11px] font-semibold">{title}</p><p className="truncate text-[10px] text-slate-500">{detail}</p><p className="mt-0.5 text-[9px] text-slate-400">{time}</p></div></div>)}</div>
  </DashboardCard>;
}

import { ArrowRight, CheckCircle2, Clock3, PackageCheck, RotateCcw, Truck } from "lucide-react";
import DashboardCard from "./DashboardCard";

const rows = [["New Orders", "132", "₹1,24,560", Clock3, "text-blue-600 bg-blue-100"], ["Packed", "86", "₹86,230", PackageCheck, "text-amber-600 bg-amber-100"], ["Shipped", "198", "₹1,98,450", Truck, "text-violet-600 bg-violet-100"], ["Delivered", "754", "₹7,64,880", CheckCircle2, "text-emerald-600 bg-emerald-100"], ["Returns / RTO", "73", "₹68,110", RotateCcw, "text-rose-600 bg-rose-100"]] as const;

export default function OrderPipeline() {
  return <DashboardCard className="h-full w-full" contentClassName="space-y-1.5 p-3" title="Orders Pipeline" action={<button className="text-xs font-semibold text-blue-600">View All <ArrowRight className="ml-1 inline h-3 w-3" /></button>}>
    {rows.map(([label, count, total, Icon, color]) => <button key={label} className="flex w-full items-center gap-2 rounded-lg bg-slate-50 px-2 py-2 text-left hover:bg-slate-100"><span className={`rounded-md p-1.5 ${color}`}><Icon className="h-3 w-3" /></span><span className="flex-1 text-xs font-semibold text-slate-800">{label}</span><span className="text-sm font-bold">{count}</span><span className="w-16 text-right text-[10px] font-medium text-slate-500">{total}</span><ArrowRight className="h-3 w-3 text-slate-400" /></button>)}
  </DashboardCard>;
}

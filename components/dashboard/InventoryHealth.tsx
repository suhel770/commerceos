import { ArrowRight, ShoppingCart } from "lucide-react";
import DashboardCard from "./DashboardCard";
import DonutChart from "./DonutChart";

const inventory = [["Healthy", "842 (67%)", "bg-emerald-500"], ["Low Stock", "231 (18%)", "bg-amber-500"], ["Out of Stock", "57 (5%)", "bg-rose-500"], ["Dead Stock", "126 (10%)", "bg-slate-400"]];

export default function InventoryHealth() {
  return <DashboardCard className="h-full w-full" contentClassName="p-3" title="Inventory Health" action={<button className="text-xs font-semibold text-blue-600">View All <ArrowRight className="ml-1 inline h-3 w-3" /></button>}>
    <div className="flex items-center gap-3"><DonutChart value="1,256" label="Total SKUs" segments={[{ color: "#10b981", value: 67 }, { color: "#f59e0b", value: 18 }, { color: "#f43f5e", value: 5 }, { color: "#94a3b8", value: 10 }]} /><div className="min-w-0 flex-1 space-y-2">{inventory.map(([label, value, color]) => <div key={label} className="flex items-center justify-between gap-1 text-[11px]"><span className="flex items-center gap-1.5 text-slate-600"><span className={`h-2 w-2 rounded-sm ${color}`} />{label}</span><span className="font-semibold text-slate-700">{value}</span></div>)}</div></div>
    <div className="mt-3 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2"><div><p className="text-[10px] font-semibold text-slate-700">Reorder Suggestions</p><p className="mt-1 text-xs font-semibold text-blue-700">23 SKUs need attention <ArrowRight className="inline h-3 w-3" /></p></div><ShoppingCart className="h-4 w-4 text-blue-600" /></div>
  </DashboardCard>;
}

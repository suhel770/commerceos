import DashboardCard from "./DashboardCard";
import DonutChart from "./DonutChart";

const lines = [
  ["Revenue", "₹12,48,230", "bg-blue-500"],
  ["COGS", "₹6,24,110", "bg-violet-500"],
  ["Fees & Charges", "₹1,82,340", "bg-amber-500"],
  ["Shipping", "₹68,220", "bg-emerald-500"],
  ["Ads", "₹91,110", "bg-red-500"],
];

export default function ProfitBreakdown() {
  return (
    <DashboardCard className="h-full w-full" title="Profit Breakdown" action={<button className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium">This Month</button>}>
      <div className="flex items-center gap-4">
        <DonutChart value="₹3,82,450" label="Net Profit" segments={[{ color: "#3b82f6", value: 50 }, { color: "#8b5cf6", value: 24 }, { color: "#f59e0b", value: 14 }, { color: "#10b981", value: 5 }, { color: "#f43f5e", value: 7 }]} />
        <div className="min-w-0 flex-1 space-y-2">
          {lines.map(([label, value, color]) => <div className="flex items-center justify-between gap-2 text-xs" key={label}><span className="flex items-center gap-1.5 text-slate-600"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span><span className="font-semibold text-slate-900">{value}</span></div>)}
          <div className="border-t pt-2 text-right text-sm font-bold text-emerald-600">Net Profit ₹3,82,450</div>
        </div>
      </div>
    </DashboardCard>
  );
}

import DashboardCard from "./DashboardCard";
import DonutChart from "./DonutChart";

const lines = [
  ["Revenue", "₹0", "bg-blue-500"],
  ["COGS", "₹0", "bg-violet-500"],
  ["Fees & Charges", "₹0", "bg-amber-500"],
  ["Shipping", "₹0", "bg-emerald-500"],
  ["Ads", "₹0", "bg-red-500"],
];

export default function ProfitBreakdown() {
  return (
    <DashboardCard
      className="h-full w-full"
      title="Profit Breakdown"
      action={
        <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium">
          This Month
        </button>
      }
    >
      <div className="flex items-center gap-4">
        <DonutChart
          value="₹0"
          label="Net Profit"
          segments={[{ color: "#e2e8f0", value: 100 }]}
        />
        <div className="min-w-0 flex-1 space-y-2">
          {lines.map(([label, value, color]) => (
            <div
              className="flex items-center justify-between gap-2 text-xs"
              key={label}
            >
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className={`h-2 w-2 rounded-full ${color}`} />
                {label}
              </span>
              <span className="font-semibold text-slate-900">{value}</span>
            </div>
          ))}
          <div className="border-t pt-2 text-right text-sm font-bold text-slate-500">
            Net Profit ₹0
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

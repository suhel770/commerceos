import KPICard from "./KPICard";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Wallet,
  RotateCcw,
} from "lucide-react";

const kpis = [
  {
    title: "Revenue",
    value: "₹2,48,760",
    change: "+18.6%",
    description: "vs yesterday",
    icon: DollarSign,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Orders",
    value: "748",
    change: "+12.4%",
    description: "vs yesterday",
    icon: ShoppingCart,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Profit",
    value: "₹2,31,540",
    change: "+20.4%",
    description: "vs yesterday",
    icon: TrendingUp,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    title: "Expenses",
    value: "₹42,300",
    change: "-4.2%",
    description: "vs yesterday",
    icon: Wallet,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    title: "Returns",
    value: "16",
    change: "-1.2%",
    description: "vs yesterday",
    icon: RotateCcw,
    color: "text-red-600",
    bg: "bg-red-50",
  },
];

export default function KPIGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
      {kpis.map((kpi) => (
        <KPICard
          key={kpi.title}
          title={kpi.title}
          value={kpi.value}
          change={kpi.change}
          description={kpi.description}
          icon={kpi.icon}
          color={kpi.color}
          bg={kpi.bg}
        />
      ))}
    </div>
  );
}
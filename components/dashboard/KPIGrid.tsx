import {
  DollarSign,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

import type { DashboardData } from "@/lib/dashboard/dashboard-data";
import KPICard from "./KPICard";

const visuals = {
  revenue: { icon: DollarSign, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  profit: { icon: TrendingUp, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  orders: { icon: ShoppingCart, iconBg: "bg-orange-100", iconColor: "text-orange-600" },
  inventory: { icon: Wallet, iconBg: "bg-violet-100", iconColor: "text-violet-600" },
};

interface KPIGridProps {
  kpis: DashboardData["kpis"];
  healthScore: number;
}

export default function KPIGrid({ kpis, healthScore }: KPIGridProps) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {kpis.map((item) => (
        <KPICard
          key={item.id}
          title={item.label}
          value={item.value}
          change={Number(item.change.replace(/[^0-9.]/g, ""))}
          description="vs yesterday"
          {...visuals[item.id]}
        />
      ))}
      <KPICard
        title="Health Score"
        value={`${healthScore}/100`}
        change={0}
        description="Excellent"
        icon={Sparkles}
        iconBg="bg-violet-100"
        iconColor="text-violet-600"
        aiCard
        aiScore={healthScore}
      />
    </section>
  );
}

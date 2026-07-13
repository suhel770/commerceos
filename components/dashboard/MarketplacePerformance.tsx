import DashboardCard from "./DashboardCard";
import {
  Store,
  Globe,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";

const marketplaces = [
  {
    name: "Amazon",
    revenue: "₹82,400",
    growth: "+12.4%",
    width: "w-full",
    color: "bg-emerald-500",
    icon: ShoppingCart,
  },
  {
    name: "Flipkart",
    revenue: "₹46,800",
    growth: "+8.2%",
    width: "w-3/4",
    color: "bg-blue-500",
    icon: Store,
  },
  {
    name: "Meesho",
    revenue: "₹31,500",
    growth: "-2.1%",
    width: "w-1/2",
    color: "bg-pink-500",
    icon: ShoppingBag,
  },
  {
    name: "Website",
    revenue: "₹18,900",
    growth: "+14.6%",
    width: "w-1/3",
    color: "bg-violet-500",
    icon: Globe,
  },
];

export default function MarketplacePerformance() {
  return (
    <DashboardCard
      title="Marketplace Performance"
      subtitle="Revenue by Channel"
    >
      <div className="space-y-6">

        {marketplaces.map((marketplace) => {

          const Icon = marketplace.icon;

          return (
            <div key={marketplace.name}>

              <div className="mb-2 flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="rounded-xl bg-slate-100 p-2">
                    <Icon
                      size={18}
                      className="text-slate-700"
                    />
                  </div>

                  <div>

                    <p className="font-semibold text-slate-900">
                      {marketplace.name}
                    </p>

                    <p className="text-sm text-slate-500">
                      {marketplace.revenue}
                    </p>

                  </div>

                </div>

                <span
                  className={`font-semibold ${
                    marketplace.growth.startsWith("+")
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {marketplace.growth}
                </span>

              </div>

              <div className="h-2 rounded-full bg-slate-100">

                <div
                  className={`h-full rounded-full ${marketplace.color} ${marketplace.width}`}
                />

              </div>

            </div>
          );

        })}

      </div>
    </DashboardCard>
  );
}
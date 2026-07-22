import {
  Boxes,
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

const stats = [
  {
    title: "Products",
    value: "12,846",
    change: "+8.4%",
    subtitle: "Last 7 days",
    icon: Boxes,
    color: "text-blue-600",
  },
  {
    title: "Orders",
    value: "418",
    change: "+15.6%",
    subtitle: "Today",
    icon: ShoppingCart,
    color: "text-green-600",
  },
  {
    title: "Revenue",
    value: "₹8.24L",
    change: "+12.3%",
    subtitle: "Today",
    icon: IndianRupee,
    color: "text-violet-600",
  },
  {
    title: "Profit",
    value: "₹2.48L",
    change: "+14.8%",
    subtitle: "Today",
    icon: TrendingUp,
    color: "text-emerald-600",
  },
  {
    title: "Low Stock",
    value: "42",
    change: "",
    subtitle: "Attention",
    icon: AlertTriangle,
    color: "text-orange-500",
  },
  {
    title: "AI Alerts",
    value: "18",
    change: "",
    subtitle: "Open",
    icon: Sparkles,
    color: "text-purple-600",
  },
];

export default function ProductKPIStrip() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">

              <div>

                <p className="text-xs font-medium text-slate-500">
                  {item.title}
                </p>

                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {item.value}
                </h2>

                {item.change ? (
                  <div className="mt-2 flex items-center gap-1">

                    <span className="text-xs font-semibold text-green-600">
                      ↑ {item.change}
                    </span>

                    <span className="text-xs text-slate-400">
                      {item.subtitle}
                    </span>

                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">
                    {item.subtitle}
                  </p>
                )}

              </div>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 ${item.color}`}
              >
                <Icon size={20} />
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}
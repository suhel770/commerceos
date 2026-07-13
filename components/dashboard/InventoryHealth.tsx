import DashboardCard from "./DashboardCard";
import {
  Package,
  AlertTriangle,
  XCircle,
  TrendingUp,
} from "lucide-react";

const stats = [
  {
    title: "Healthy",
    value: 348,
    icon: Package,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  {
    title: "Low Stock",
    value: 12,
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-100",
  },
  {
    title: "Out of Stock",
    value: 3,
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-100",
  },
  {
    title: "Fast Moving",
    value: 18,
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
];

const reorderProducts = [
  {
    sku: "LW-001",
    name: "Dino Clogs Blue",
    stock: 8,
  },
  {
    sku: "LW-008",
    name: "Rainbow Clogs",
    stock: 5,
  },
  {
    sku: "LW-014",
    name: "Shark Clogs",
    stock: 2,
  },
];

export default function InventoryHealth() {
  return (
    <DashboardCard
      title="Inventory Health"
      subtitle="Current Stock Status"
    >
      <div className="space-y-6">

        {/* Top Stats */}

        <div className="grid grid-cols-2 gap-4">

          {stats.map((item) => {

            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 p-4 transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-slate-500">
                      {item.title}
                    </p>

                    <h3 className="mt-2 text-2xl font-bold">
                      {item.value}
                    </h3>

                  </div>

                  <div
                    className={`rounded-xl p-3 ${item.bg}`}
                  >
                    <Icon
                      size={20}
                      className={item.color}
                    />
                  </div>

                </div>
              </div>
            );

          })}

        </div>

        {/* Divider */}

        <div className="border-t border-slate-200 pt-5">

          <div className="flex items-center justify-between">

            <h3 className="font-semibold text-slate-900">
              Reorder Required
            </h3>

            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
              3 Products
            </span>

          </div>

          <div className="mt-4 space-y-3">

            {reorderProducts.map((product) => (

              <div
                key={product.sku}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
              >

                <div>

                  <p className="font-medium text-slate-900">
                    {product.name}
                  </p>

                  <p className="text-sm text-slate-500">
                    {product.sku}
                  </p>

                </div>

                <span className="font-semibold text-red-600">
                  {product.stock} left
                </span>

              </div>

            ))}

          </div>

        </div>

        {/* Bottom Summary */}

        <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-5">

          <div>

            <p className="text-sm text-slate-500">
              Inventory Value
            </p>

            <h3 className="mt-1 text-2xl font-bold">
              ₹18.4L
            </h3>

          </div>

          <div>

            <p className="text-sm text-slate-500">
              Total SKUs
            </p>

            <h3 className="mt-1 text-2xl font-bold">
              348
            </h3>

          </div>

        </div>

      </div>
    </DashboardCard>
  );
}
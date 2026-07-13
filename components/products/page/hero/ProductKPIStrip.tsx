"use client";

import {
  IndianRupee,
  Boxes,
  ShoppingCart,
  RotateCcw,
  TrendingUp,
} from "lucide-react";

import { Product } from "@/lib/types/product";

interface ProductKPIStripProps {
  product: Product;
}

export default function ProductKPIStrip({
  product,
}: ProductKPIStripProps) {
  const marginPositive =
    product.pricing.margin >= 0;

  return (
    <div className="border-t border-slate-200 bg-slate-50">

      <div className="grid grid-cols-6">

        <KPICard
          icon={<IndianRupee size={14} />}
          title="Selling Price"
          value={`₹${product.pricing.sellingPrice}`}
        />

        <KPICard
          icon={<IndianRupee size={14} />}
          title="Cost Price"
          value={`₹${product.pricing.costPrice}`}
        />

        <KPICard
          icon={<TrendingUp size={14} />}
          title="Margin"
          value={`${product.pricing.margin}%`}
          valueClass={
            marginPositive
              ? "text-emerald-600"
              : "text-red-600"
          }
        />

        <KPICard
          icon={<Boxes size={14} />}
          title="Available"
          value={`${product.inventory.available}`}
        />

        <KPICard
          icon={<ShoppingCart size={14} />}
          title="Orders"
          value={`${product.performance.ordersToday}`}
        />

        <KPICard
          icon={<RotateCcw size={14} />}
          title="Returns"
          value={`${product.performance.returnsPercentage}%`}
          valueClass="text-orange-500"
        />

      </div>

    </div>
  );
}

interface KPICardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  valueClass?: string;
}

function KPICard({
  icon,
  title,
  value,
  valueClass,
}: KPICardProps) {
  return (
    <div
      className="
        flex
        h-16
        flex-col
        justify-center
        border-r
        border-slate-200
        px-4
        last:border-r-0
      "
    >

      <div className="mb-1 flex items-center gap-1.5">

        <span className="text-slate-400">
          {icon}
        </span>

        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {title}
        </span>

      </div>

      <div
        className={`text-2xl font-bold ${
          valueClass ?? "text-slate-900"
        }`}
      >
        {value}
      </div>

    </div>
  );
}
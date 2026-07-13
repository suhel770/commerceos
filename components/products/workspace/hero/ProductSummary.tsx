"use client";

import Image from "next/image";
import {
  BadgeCheck,
  Barcode,
  Package,
  Tag,
} from "lucide-react";

import type { Product } from "@/lib/types/product";

interface ProductSummaryProps {
  product: Product;
}

const marketplaces = [
  {
    name: "Amazon",
    logo: "/marketplaces/amazon.png",
  },
  {
    name: "Flipkart",
    logo: "/marketplaces/flipkart.png",
  },
  {
    name: "Meesho",
    logo: "/marketplaces/meesho.png",
  },
  {
    name: "Shopify",
    logo: "/marketplaces/shopify.png",
  },
];

export default function ProductSummary({
  product,
}: ProductSummaryProps) {
  return (
    <div className="flex h-full flex-col">

      {/* Product Status */}

      <div className="flex items-center gap-2">

        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">

          <BadgeCheck size={14} />

          {product.status}

        </span>

      </div>

      {/* Product Name */}

      <h1 className="mt-0.5 text-2xl font-bold leading-tight text-slate-900">

        {product.name}

      </h1>



      {/* Marketplace Badges */}

      <div className="mt-2 flex items-center gap-1">

        {marketplaces.map((marketplace) => (

          <div
            key={marketplace.name}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              border
              border-slate-200
              bg-white
            "
          >

            <Image
              src={marketplace.logo}
              alt={marketplace.name}
              width={16}
              height={16}
            />

          </div>

        ))}

        <span className="text-xs font-medium text-slate-500">

          Connected to 4 marketplaces

        </span>

      </div>
      {/* Pricing Strip */}

      <div className="mt-1.5 border-t border-b border-slate-200">

        <div className="grid grid-cols-3 divide-x divide-slate-200">

          {/* Selling Price */}

          <SummaryMetric
            label="Selling Price"
            value={`₹${product.pricing.sellingPrice}`}
          />

          {/* Cost Price */}

          <SummaryMetric
            label="Cost Price"
            value={`₹${product.pricing.costPrice}`}
          />

          {/* Margin */}

          <div className="px-5 py-4">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Gross Profit
            </p>

            <div className="mt-1.5 flex items-end gap-2">

              <span
                className={`text-2xl font-bold ${
                  product.pricing.margin >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {product.pricing.margin}%
              </span>

              <span className="pb-1 text-slate-300">
                •
              </span>

              <span
                className={`pb-1 text-base font-semibold ${
                  product.pricing.profit >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                ₹{product.pricing.profit}
              </span>

            </div>

          </div>

        </div>

      </div>
      {/* Inventory Strip */}

      <div className="border-b border-slate-200">

        <div className="grid grid-cols-4 divide-x divide-slate-200">

          <InventoryMetric
            label="Available"
            value={String(product.inventory.available)}
            subValue="Ready to Sell"
            valueColor="text-emerald-600"
          />

          <InventoryMetric
            label="Today"
            value={String(product.inventory.reserved)}
            subValue="Orders"
            valueColor="text-orange-500"
          />

          <InventoryMetric
            label="Orders (30D)"
            value={String(product.performance.ordersToday * 30)}
            subValue="+18%"
            valueColor="text-slate-900"
            subColor="text-emerald-600"
          />

          <InventoryMetric
            label="Returns"
            value={String(
              Math.round(
                (product.performance.ordersToday *
                  30 *
                  product.performance.returnsPercentage) /
                  100
              )
            )}
            subValue={`${product.performance.returnsPercentage}%`}
            valueColor="text-orange-500"
            subColor="text-orange-500"
          />

        </div>

      </div>

      {/* AI Insight */}

      <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">

        <div className="flex items-center gap-2">

          <span className="text-sm font-semibold text-violet-700">
            CommerceOS AI
          </span>

        </div>

        <p className="mt-1 text-sm text-violet-700">

          {product.aiRecommendations[0]?.message ??
            "Everything looks healthy."}

        </p>

      </div>
      {/* Footer */}

      <div className="mt-3 border-t border-slate-200 pt-4">

        <div className="grid grid-cols-4 gap-4">

          <FooterMetric
            label="Last Sync"
            value="2 min ago"
            valueColor="text-emerald-600"
          />

          <FooterMetric
            label="Created"
            value={product.createdAt}
          />

          <FooterMetric
            label="Updated"
            value={product.updatedAt}
          />

          <FooterMetric
            label="Health Score"
            value={`${product.performance.healthScore}%`}
            valueColor={
              product.performance.healthScore >= 80
                ? "text-emerald-600"
                : product.performance.healthScore >= 60
                ? "text-orange-500"
                : "text-red-600"
            }
          />

        </div>

      </div>

    </div>
  );
}
interface SummaryMetricProps {
  label: string;
  value: string;
}

function SummaryMetric({
  label,
  value,
}: SummaryMetricProps) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <h3 className="mt-1 text-xl font-bold text-slate-900">
        {value}
      </h3>
    </div>
  );
}
interface InventoryMetricProps {
  label: string;
  value: string;
  subValue: string;
  valueColor?: string;
  subColor?: string;
}

function InventoryMetric({
  label,
  value,
  subValue,
  valueColor = "text-slate-900",
  subColor = "text-slate-500",
}: InventoryMetricProps) {
  return (
    <div className="px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className={`mt-1 text-xl font-bold ${valueColor}`}>
        {value}
      </p>

      <p className={`mt-1 text-xs font-medium ${subColor}`}>
        {subValue}
      </p>
    </div>
  );
}
interface FooterMetricProps {
  label: string;
  value: string;
  valueColor?: string;
}

function FooterMetric({
  label,
  value,
  valueColor = "text-slate-900",
}: FooterMetricProps) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className={`mt-1 text-xs font-semibold ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}
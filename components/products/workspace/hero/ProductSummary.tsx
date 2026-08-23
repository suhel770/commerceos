"use client";

import Image from "next/image";
import {
  BadgeCheck,
  Boxes,
  FileCheck2,
  Images,
  Layers3,
  ListTree,
  Tags,
} from "lucide-react";

import type { Product } from "@/lib/types/product";
import {
  deriveProductLifecycle,
  lifecycleBadgeClasses,
} from "@/lib/products/product-lifecycle";
import type { ProductWorkspaceNavigate } from "../types";

interface ProductSummaryProps {
  product: Product;
  onNavigate: ProductWorkspaceNavigate;
}

export default function ProductSummary({
  product,
  onNavigate,
}: ProductSummaryProps) {
  const lifecycle = deriveProductLifecycle(product);
  const connectedCount = product.listings.length;
  const mediaCount =
    (product.gallery?.length ?? 0) + (product.image ? 1 : 0);
  const orders30d = product.listings.reduce(
    (sum, listing) => sum + listing.orders30Days,
    0,
  );
  const returnsCount = Math.round(
    (orders30d * product.performance.returnsPercentage) / 100,
  );

  const marketplaceLogos = product.listings
    .slice(0, 4)
    .map((listing) => ({
      name: listing.marketplace,
      logo: `/marketplaces/${listing.marketplace
        .toLowerCase()
        .replace(/\s+/g, "-")}.png`,
    }));

  return (
    <div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${lifecycleBadgeClasses(lifecycle)}`}
        >
          <BadgeCheck size={14} />
          {lifecycle}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Lifecycle
        </span>
      </div>

      <h1 className="mt-0.5 text-2xl font-bold leading-tight text-slate-900">
        {product.name}
      </h1>

      <div className="mt-2 flex items-center gap-1">
        {marketplaceLogos.map((marketplace) => (
          <div
            key={marketplace.name}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white"
          >
            <Image
              src={marketplace.logo}
              alt={marketplace.name}
              width={16}
              height={16}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => onNavigate("listings")}
          className="ml-1 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Connected to {connectedCount} marketplace
          {connectedCount === 1 ? "" : "s"}
        </button>
      </div>

      {/* Master Product children — Bible Master Product */}
      <div className="mt-3 flex flex-wrap gap-2">
        <MasterChip
          icon={<Images size={12} />}
          label="Media"
          value={String(mediaCount)}
          onClick={() => onNavigate("listings")}
        />
        <MasterChip
          icon={<ListTree size={12} />}
          label="Listings"
          value={String(connectedCount)}
          onClick={() => onNavigate("listings")}
        />
        <MasterChip
          icon={<Boxes size={12} />}
          label="Inventory"
          value={String(product.inventory.available)}
          onClick={() => onNavigate("inventory")}
        />
        <MasterChip
          icon={<FileCheck2 size={12} />}
          label="Compliance"
          value={product.hsn ? "HSN" : "Gap"}
          onClick={() => onNavigate("overview")}
        />
        <MasterChip
          icon={<Layers3 size={12} />}
          label="Variants"
          value="0"
        />
        <MasterChip
          icon={<Tags size={12} />}
          label="Attrs"
          value={String(product.tags?.length ?? 0)}
        />
      </div>

      <div className="mt-1.5 border-t border-b border-slate-200">
        <div className="grid grid-cols-3 divide-x divide-slate-200">
          <SummaryMetric
            label="Selling Price"
            value={`₹${product.pricing.sellingPrice}`}
          />
          <SummaryMetric
            label="Cost Price"
            value={`₹${product.pricing.costPrice}`}
          />
          <div className="px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Gross Profit
            </p>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span
                className={`text-lg font-bold ${
                  product.pricing.margin >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {product.pricing.margin}%
              </span>
              <span className="text-slate-300">•</span>
              <span
                className={`text-sm font-semibold ${
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
            value={String(product.performance.ordersToday)}
            subValue="Orders"
            valueColor="text-orange-500"
          />
          <InventoryMetric
            label="Orders (30D)"
            value={String(orders30d)}
            subValue={`${product.listings.length} channels`}
            valueColor="text-slate-900"
            subColor="text-slate-500"
          />
          <InventoryMetric
            label="Returns"
            value={String(returnsCount)}
            subValue={`${product.performance.returnsPercentage}%`}
            valueColor="text-orange-500"
            subColor="text-orange-500"
          />
        </div>
      </div>

      {product.aiRecommendations[0] ? (
        <button
          type="button"
          onClick={() => onNavigate("ai")}
          className="mt-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-left transition hover:border-violet-300"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-violet-700">
              CommerceOS AI
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-500">
              Optional
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-snug text-violet-700">
            {product.aiRecommendations[0].message}
          </p>
        </button>
      ) : null}

      <div className="mt-2 border-t border-slate-200 pt-2.5">
        <div className="grid grid-cols-4 gap-3">
          <FooterMetric
            label="Last Sync"
            value={
              product.listings[0]?.lastSync ?? "—"
            }
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

function MasterChip({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}) {
  const className =
    "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} transition hover:border-blue-300 hover:bg-blue-50`}>
        {icon}
        {label}
        <span className="text-slate-500">{value}</span>
      </button>
    );
  }

  return (
    <span className={className}>
      {icon}
      {label}
      <span className="text-slate-500">{value}</span>
    </span>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <h3 className="mt-0.5 text-lg font-bold leading-tight text-slate-900">
        {value}
      </h3>
    </div>
  );
}

function InventoryMetric({
  label,
  value,
  subValue,
  valueColor = "text-slate-900",
  subColor = "text-slate-500",
}: {
  label: string;
  value: string;
  subValue: string;
  valueColor?: string;
  subColor?: string;
}) {
  return (
    <div className="px-2.5 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-0.5 text-lg font-bold leading-tight ${valueColor}`}>
        {value}
      </p>
      <p className={`text-[11px] font-medium leading-tight ${subColor}`}>
        {subValue}
      </p>
    </div>
  );
}

function FooterMetric({
  label,
  value,
  valueColor = "text-slate-900",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-0.5 text-xs font-semibold ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}

"use client";

import {
  BadgeCheck,
  Building2,
  Package,
  Barcode,
  Tag,
  Store,
} from "lucide-react";

import { Product } from "@/lib/types/product";

interface ProductSummaryProps {
  product: Product;
}

export default function ProductSummary({
  product,
}: ProductSummaryProps) {
  return (
    <div className="flex h-full flex-col justify-between">

      {/* Top */}

      <div className="space-y-3">

        {/* Status */}

        <div className="flex items-center gap-2">

          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">

            <BadgeCheck size={14} />

            Active

          </span>

          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">

            {product.category}

          </span>

        </div>

        {/* Product Name */}

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">

          {product.name}

        </h1>

        {/* Marketplaces */}

        <div>

          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">

            Published On

          </p>

          <div className="flex flex-wrap gap-2">

            {product.listings.map((listing) => (

              <div
                key={listing.id}
                className="
                  flex
                  h-10
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3
                "
              >

                <Store
                  size={14}
                  className="text-slate-500"
                />

                <span className="text-sm">

                  {listing.marketplace}

                </span>

                <span className="h-2 w-2 rounded-full bg-emerald-500" />

              </div>

            ))}

          </div>

        </div>

      </div>

      {/* Bottom */}

      <div className="mt-4 grid grid-cols-4 gap-3">

        <InfoCard
          icon={<Building2 size={15} />}
          title="Brand"
          value="LilWalk"
        />

        <InfoCard
          icon={<Package size={15} />}
          title="SKU"
          value={product.sku}
        />

        <InfoCard
          icon={<Barcode size={15} />}
          title="Barcode"
          value="8901234567890"
        />

        <InfoCard
          icon={<Tag size={15} />}
          title="Category"
          value={product.category}
        />

      </div>

    </div>
  );
}

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
}

function InfoCard({
  icon,
  title,
  value,
}: InfoCardProps) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-slate-50
        p-3
      "
    >

      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">

        {icon}

        {title}

      </div>

      <div className="truncate text-lg font-bold text-slate-900">

        {value}

      </div>

    </div>
  );
}
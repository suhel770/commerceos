"use client";

import {
  Barcode,
  Calendar,
  Package,
  Tag,
} from "lucide-react";

import type { Product } from "@/lib/types/product";

interface Props {
  product: Product;
}

export default function TopMetadataStrip({
  product,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">

      <div className="flex items-center justify-between px-8 py-5">

        {/* Breadcrumb */}

        <div className="flex items-center gap-3">

          <span className="text-slate-500">
            Products
          </span>

          <span className="text-slate-300">
            ›
          </span>

          <span className="font-semibold text-slate-900">
            {product.name}
          </span>

        </div>

        {/* Metadata */}

        <div className="flex items-center gap-12">

          <MetaItem
            icon={<Package size={16} />}
            title="SKU"
            value={product.sku}
          />

          <MetaItem
            icon={<Barcode size={16} />}
            title="Barcode"
            value="8901234567890"
          />

          <MetaItem
            icon={<Tag size={16} />}
            title="Category"
            value={product.category}
          />

          <MetaItem
            icon={<Package size={16} />}
            title="Brand"
            value={product.brand}
          />

          <MetaItem
            icon={<Calendar size={16} />}
            title="Created"
            value={product.createdAt}
          />

          <MetaItem
            icon={<Calendar size={16} />}
            title="Updated"
            value={product.updatedAt}
          />

        </div>

      </div>

    </div>
  );
}

interface MetaItemProps {
  icon: React.ReactNode;
  title: string;
  value: string;
}

function MetaItem({
  icon,
  title,
  value,
}: MetaItemProps) {
  return (
    <div className="flex items-start gap-3">

      <div className="mt-1 text-slate-400">
        {icon}
      </div>

      <div>

        <p className="text-xs uppercase tracking-wide text-slate-400">
          {title}
        </p>

        <p className="font-semibold text-slate-900">
          {value}
        </p>

      </div>

    </div>
  );
}
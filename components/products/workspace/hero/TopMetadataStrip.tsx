"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Barcode,
  FileText,
  Package,
  Percent,
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

      <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">

        <div className="flex min-w-0 items-center gap-2.5">

          <Link
            href="/products"
            aria-label="Back to products"
            className="inline-flex shrink-0 items-center justify-center text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex min-w-0 items-center gap-2 text-sm">

            <Link
              href="/products"
              className="shrink-0 text-slate-500 transition-colors hover:text-slate-900"
            >
              Products
            </Link>

            <span className="shrink-0 text-slate-300">›</span>

            <span className="truncate font-semibold text-slate-900">
              {product.name}
            </span>

          </div>

        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3 lg:justify-end">

          <MetaItem
            icon={<Package size={15} />}
            iconClassName="bg-blue-50 text-blue-600"
            title="SKU"
            value={product.sku}
          />

          <Divider />

          <MetaItem
            icon={<Barcode size={15} />}
            iconClassName="bg-violet-50 text-violet-600"
            title="Barcode"
            value="—"
          />

          <Divider />

          <MetaItem
            icon={<Tag size={15} />}
            iconClassName="bg-amber-50 text-amber-600"
            title="Category"
            value={product.category}
          />

          <Divider />

          <MetaItem
            icon={<Package size={15} />}
            iconClassName="bg-emerald-50 text-emerald-600"
            title="Brand"
            value={product.brand}
          />

          <Divider />

          <MetaItem
            icon={<FileText size={15} />}
            iconClassName="bg-sky-50 text-sky-600"
            title="HSN"
            value={product.hsn ?? "—"}
          />

          <Divider />

          <MetaItem
            icon={<Percent size={15} />}
            iconClassName="bg-rose-50 text-rose-600"
            title="GST"
            value={
              product.gstRate !== undefined
                ? `${product.gstRate}%`
                : "—"
            }
          />

        </div>

      </div>

    </div>
  );
}

function Divider() {
  return (
    <div
      aria-hidden="true"
      className="hidden h-8 w-px bg-slate-200 sm:block"
    />
  );
}

interface MetaItemProps {
  icon: React.ReactNode;
  iconClassName: string;
  title: string;
  value: string;
}

function MetaItem({
  icon,
  iconClassName,
  title,
  value,
}: MetaItemProps) {
  return (
    <div className="flex items-start gap-2">

      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
      >
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-[10px] uppercase tracking-wide text-slate-400">
          {title}
        </p>

        <p className="truncate text-sm font-semibold text-slate-900">
          {value}
        </p>

      </div>

    </div>
  );
}

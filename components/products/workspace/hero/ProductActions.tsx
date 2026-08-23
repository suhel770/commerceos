"use client";

import { useRouter } from "next/navigation";

import {
  Archive,
  Copy,
  Download,
  Pencil,
  ShieldAlert,
} from "lucide-react";

import type { Product } from "@/lib/types/product";
import type { ProductWorkspaceNavigate } from "../types";

interface ProductActionsProps {
  product: Product;
  onNavigate: ProductWorkspaceNavigate;
}

/** Verb-only rail — views live in workspace tabs / master chips. */
export default function ProductActions({
  product,
  onNavigate,
}: ProductActionsProps) {
  const router = useRouter();

  const exportProduct = () => {
    const blob = new Blob(
      [JSON.stringify(product, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${product.sku}-master-product.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Actions</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Commands for this product
        </p>
      </div>

      <div className="mt-4 space-y-1.5">
        <ActionButton
          primary
          icon={<Pencil size={16} />}
          title="Edit Product"
          subtitle="Open Product Studio"
          onClick={() => router.push(`/products/${product.slug}/edit`)}
        />

        <ActionButton
          amber
          icon={<Copy size={16} />}
          title="Duplicate"
          subtitle="Create a copy"
          onClick={() =>
            router.push(
              `/products?duplicate=${encodeURIComponent(product.slug)}`,
            )
          }
        />

        <ActionButton
          blue
          icon={<Download size={16} />}
          title="Export"
          subtitle="Download master JSON"
          onClick={exportProduct}
        />

        <ActionButton
          orange
          icon={<ShieldAlert size={16} />}
          title="Wrong Return"
          subtitle="File a claim"
          onClick={() => onNavigate("returns")}
        />

        <ActionButton
          danger
          icon={<Archive size={16} />}
          title="Archive"
          subtitle="Move to Archived"
          onClick={() => onNavigate("activity")}
        />
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  title,
  subtitle,
  onClick,
  primary,
  blue,
  amber,
  orange,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  primary?: boolean;
  blue?: boolean;
  amber?: boolean;
  orange?: boolean;
  danger?: boolean;
}) {
  let button =
    "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm";
  let iconBg = "bg-slate-100 text-slate-600";
  let titleColor = "text-slate-900";
  let subtitleColor = "text-slate-500";

  if (primary) {
    button =
      "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/15 hover:bg-blue-700";
    iconBg = "bg-white/20 text-white";
    titleColor = "text-white";
    subtitleColor = "text-blue-100";
  }

  if (blue) iconBg = "bg-sky-100 text-sky-600";
  if (amber) iconBg = "bg-amber-100 text-amber-600";
  if (orange) iconBg = "bg-orange-100 text-orange-600";

  if (danger) {
    button = "border-red-200 bg-red-50 hover:bg-red-100";
    iconBg = "bg-red-100 text-red-600";
    titleColor = "text-red-600";
    subtitleColor = "text-red-400";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${button}`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-semibold leading-tight ${titleColor}`}>
          {title}
        </p>
        <p className={`mt-0.5 text-[11px] leading-tight ${subtitleColor}`}>
          {subtitle}
        </p>
      </div>
    </button>
  );
}

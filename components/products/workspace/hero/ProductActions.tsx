"use client";

import {
  Archive,
  Copy,
  ImageIcon,
  Pencil,
  ShieldAlert,
} from "lucide-react";

import type { Product } from "@/lib/types/product";

interface ProductActionsProps {
  product: Product;
}

export default function ProductActions({
  product,
}: ProductActionsProps) {
  return (
    <div className="flex h-full flex-col">

      {/* Header */}

      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Actions
        </h2>

        <p className="mt-0.5 text-xs text-slate-500">
          Manage this product
        </p>
      </div>

      {/* Actions */}

      <div className="mt-4 space-y-1">

        <ActionButton
          primary
          icon={<Pencil size={16} />}
          title="Edit Product"
          subtitle="Open product editor"
        />

        <ActionButton
          purple
          icon={<ImageIcon size={16} />}
          title="AI Studio"
          subtitle="Generate content & images"
        />

        <ActionButton
          blue
          icon={<ImageIcon size={16} />}
          title="Media Library"
          subtitle="View all product media"
        />

        <ActionButton
          amber
          icon={<Copy size={16} />}
          title="Duplicate Product"
          subtitle="Create a copy"
        />

        <ActionButton
          orange
          icon={<ShieldAlert size={16} />}
          title="Raise Wrong Return"
          subtitle="Report incorrect return"
        />

        <ActionButton
          danger
          icon={<Archive size={16} />}
          title="Archive Product"
          subtitle="Archive this product"
        />

      </div>

    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  primary?: boolean;
  purple?: boolean;
  blue?: boolean;
  amber?: boolean;
  orange?: boolean;
  danger?: boolean;
}

function ActionButton({
  icon,
  title,
  subtitle,
  primary,
  purple,
  blue,
  amber,
  orange,
  danger,
}: ActionButtonProps) {

  let button =
    "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm";

  let iconBg =
    "bg-slate-100 text-slate-600";

  let titleColor =
    "text-slate-900";

  let subtitleColor =
    "text-slate-500";

  if (primary) {
    button =
      "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/15 hover:bg-blue-700";

    iconBg =
      "bg-white/20 text-white";

    titleColor =
      "text-white";

    subtitleColor =
      "text-blue-100";
  }

  if (purple) iconBg = "bg-violet-100 text-violet-600";

  if (blue) iconBg = "bg-sky-100 text-sky-600";

  if (amber) iconBg = "bg-amber-100 text-amber-600";

  if (orange) iconBg = "bg-orange-100 text-orange-600";

  if (danger) {
    button =
      "border-red-200 bg-red-50 hover:bg-red-100";

    iconBg =
      "bg-red-100 text-red-600";

    titleColor =
      "text-red-600";

    subtitleColor =
      "text-red-400";
  }

  return (
    <button
      className={`
        flex
        w-full
        items-center
        gap-3
        rounded-xl
        border
        px-4
        py-2.5
        text-left
        transition-all
        duration-200
        ${button}
      `}
    >

      <div
        className={`
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-lg
          ${iconBg}
        `}
      >
        {icon}
      </div>

      <div className="min-w-0">

        <p
          className={`text-[15px] font-semibold leading-tight ${titleColor}`}
        >
          {title}
        </p>

        <p
          className={`mt-0.5 text-xs leading-tight ${subtitleColor}`}
        >
          {subtitle}
        </p>

      </div>

    </button>
  );
}
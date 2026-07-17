"use client";

import {
  Boxes,
  Palette,
  Ruler,
  Sparkles,
  Plus,
} from "lucide-react";

import StudioAccordion from "../../shared/StudioAccordion";

export default function VariantsSection() {
  return (
    <StudioAccordion
      title="Variants"
      description="Manage parent products, colors, sizes and variant combinations."
      badge="8 Variants"
      rightSlot={
        <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          <Plus size={16} />
          Add Variant
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-4">

        <VariantStat
          icon={<Boxes size={18} />}
          title="Total Variants"
          value="8"
          color="emerald"
        />

        <VariantStat
          icon={<Palette size={18} />}
          title="Colors"
          value="4"
          color="blue"
        />

        <VariantStat
          icon={<Ruler size={18} />}
          title="Sizes"
          value="2"
          color="violet"
        />

        <VariantStat
          icon={<Sparkles size={18} />}
          title="AI Score"
          value="94%"
          color="emerald"
        />

      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">

        <VariantRow
          sku="LW-001-BL-8"
          title="Blue • Size 8"
          stock="26"
          status="Active"
        />

        <VariantRow
          sku="LW-001-BL-9"
          title="Blue • Size 9"
          stock="18"
          status="Active"
        />

        <VariantRow
          sku="LW-001-GR-8"
          title="Green • Size 8"
          stock="31"
          status="Active"
        />

        <VariantRow
          sku="LW-001-GR-9"
          title="Green • Size 9"
          stock="22"
          status="Active"
        />

      </div>

      <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">

        <div className="flex items-center gap-3">

          <Sparkles
            size={18}
            className="text-violet-600"
          />

          <h3 className="font-semibold text-violet-700">

            AI Variant Advisor

          </h3>

        </div>

        <p className="mt-3 text-sm leading-7 text-violet-700">

          Customers frequently purchase
          <strong> Yellow </strong>
          and
          <strong> Red </strong>
          variants in this category.

          Estimated revenue increase:
          <strong> +14%</strong>.

        </p>

        <div className="mt-5 flex flex-wrap gap-3">

          <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white">

            Generate Variants

          </button>

          <button className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700">

            Analyze Demand

          </button>

        </div>

      </div>

    </StudioAccordion>
  );
}

interface VariantStatProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: "emerald" | "blue" | "violet";
}

function VariantStat({
  icon,
  title,
  value,
  color,
}: VariantStatProps) {
  const styles = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue:
      "border-sky-200 bg-sky-50 text-sky-700",
    violet:
      "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    <div
      className={`rounded-2xl border p-5 ${styles[color]}`}
    >
      <div className="flex items-center justify-between">
        {icon}
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wider opacity-70">
        {title}
      </p>

      <h3 className="mt-2 text-2xl font-bold">
        {value}
      </h3>
    </div>
  );
}

interface VariantRowProps {
  sku: string;
  title: string;
  stock: string;
  status: string;
}

function VariantRow({
  sku,
  title,
  stock,
  status,
}: VariantRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 last:border-0">

      <div>

        <p className="font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {sku}
        </p>

      </div>

      <div className="text-right">

        <p className="font-semibold text-slate-900">
          {stock} Units
        </p>

        <p className="mt-1 text-sm text-emerald-600">
          {status}
        </p>

      </div>

    </div>
  );
}
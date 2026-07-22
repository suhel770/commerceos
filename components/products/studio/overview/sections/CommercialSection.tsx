"use client";

import {
  BadgeIndianRupee,
  Percent,
  Receipt,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import type { Product } from "@/lib/types/product";

import { useStudio } from "../../context/StudioContext";
import StudioAccordion from "../../shared/StudioAccordion";

interface CommercialSectionProps {
  product: Product;
}

export default function CommercialSection({
  product,
}: CommercialSectionProps) {
  const {
    updateDraft,
    openFieldEditor,
  } = useStudio();

  const editPricing = (
    key: keyof Product["pricing"],
    title: string
  ) => {
    openFieldEditor({
      title,
      value: String(product.pricing[key]),
      inputType: "number",
      marketplace:
        "Pricing & marketplace fees",
      description:
        "This updates the commercial product master used for marketplace price, fee and margin checks.",
      onSave: (value) =>
        updateDraft({
          pricing: {
            ...product.pricing,
            [key]: Number(value),
          },
        }),
    });
  };

  const editGst = () => {
    openFieldEditor({
      title: "GST Rate",
      value: String(product.gstRate ?? ""),
      inputType: "number",
      marketplace: "GST and tax",
      description:
        "Used for GST reports, HSN validation and marketplace tax fields.",
      onSave: (value) =>
        updateDraft({
          gstRate: Number(value),
        }),
    });
  };

  return (
    <StudioAccordion
      title="Pricing & Commercials"
      description="Manage selling price, cost, taxes and profitability."
      badge="Healthy"
      rightSlot={
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Margin {product.pricing.margin}%
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={
            <BadgeIndianRupee size={18} />
          }
          title="Selling Price"
          value={`₹${product.pricing.sellingPrice}`}
          color="emerald"
          onEdit={() =>
            editPricing(
              "sellingPrice",
              "Selling Price"
            )
          }
        />

        <MetricCard
          icon={<Receipt size={18} />}
          title="Cost Price"
          value={`₹${product.pricing.costPrice}`}
          color="blue"
          onEdit={() =>
            editPricing(
              "costPrice",
              "Cost Price"
            )
          }
        />

        <MetricCard
          icon={<Percent size={18} />}
          title="Profit"
          value={`₹${product.pricing.profit}`}
          color="violet"
          onEdit={() =>
            editPricing("profit", "Profit")
          }
        />

        <MetricCard
          icon={<TrendingUp size={18} />}
          title="Margin"
          value={`${product.pricing.margin}%`}
          color="emerald"
          onEdit={() =>
            editPricing("margin", "Margin")
          }
        />
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
        <Row
          label="MRP"
          value={`₹${product.pricing.mrp}`}
          onEdit={() =>
            editPricing("mrp", "MRP")
          }
        />

        <Row
          label="Selling Price"
          value={`₹${product.pricing.sellingPrice}`}
          onEdit={() =>
            editPricing(
              "sellingPrice",
              "Selling Price"
            )
          }
        />

        <Row
          label="Cost Price"
          value={`₹${product.pricing.costPrice}`}
          onEdit={() =>
            editPricing(
              "costPrice",
              "Cost Price"
            )
          }
        />

        <Row
          label="GST"
          value={`${product.gstRate ?? 0}%`}
          onEdit={editGst}
        />

        <Row
          label="Estimated Profit"
          value={`₹${product.pricing.profit}`}
          onEdit={() =>
            editPricing("profit", "Profit")
          }
        />
      </div>

      <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">
        <div className="flex items-center gap-3">
          <Sparkles
            size={18}
            className="text-violet-600"
          />

          <h3 className="font-semibold text-violet-700">
            AI Pricing Intelligence
          </h3>
        </div>

        <p className="mt-3 text-sm leading-7 text-violet-700">
          Competitor analysis suggests reducing the selling
          price by <strong>₹20</strong> may increase
          conversions while maintaining a healthy profit
          margin.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">
            Apply Recommendation
          </button>

          <button className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100">
            View Competitors
          </button>
        </div>
      </div>
    </StudioAccordion>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: "emerald" | "blue" | "violet";
  onEdit: () => void;
}

function MetricCard({
  icon,
  title,
  value,
  color,
  onEdit,
}: MetricCardProps) {
  const colors = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue:
      "border-sky-200 bg-sky-50 text-sky-700",
    violet:
      "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    <button
      type="button"
      onClick={onEdit}
      className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${colors[color]}`}
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
    </button>
  );
}

interface RowProps {
  label: string;
  value: string;
  onEdit: () => void;
}

function Row({
  label,
  value,
  onEdit,
}: RowProps) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full items-center justify-between border-b border-slate-200 px-6 py-4 text-left transition last:border-0 hover:bg-slate-50"
    >
      <span className="font-medium text-slate-600">
        {label}
      </span>

      <span className="font-semibold text-slate-900">
        {value}
      </span>
    </button>
  );
}

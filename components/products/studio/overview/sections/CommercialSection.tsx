"use client";

import {
  BadgeIndianRupee,
  TrendingUp,
  Percent,
  Receipt,
  Sparkles,
} from "lucide-react";

import StudioAccordion from "../../shared/StudioAccordion";

export default function CommercialSection() {
  return (
    <StudioAccordion
      title="Pricing & Commercials"
      description="Manage selling price, cost, taxes and profitability."
      badge="Healthy"
      rightSlot={
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Margin 49%
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-4">

        <MetricCard
          icon={<BadgeIndianRupee size={18} />}
          title="Selling Price"
          value="₹699"
          color="emerald"
        />

        <MetricCard
          icon={<Receipt size={18} />}
          title="Cost Price"
          value="₹350"
          color="blue"
        />

        <MetricCard
          icon={<Percent size={18} />}
          title="Profit"
          value="₹349"
          color="violet"
        />

        <MetricCard
          icon={<TrendingUp size={18} />}
          title="Margin"
          value="49%"
          color="emerald"
        />

      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">

        <Row
          label="MRP"
          value="₹999"
        />

        <Row
          label="Selling Price"
          value="₹699"
        />

        <Row
          label="Cost Price"
          value="₹350"
        />

        <Row
          label="GST"
          value="18%"
        />

        <Row
          label="Estimated Profit"
          value="₹349"
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
}

function MetricCard({
  icon,
  title,
  value,
  color,
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
    <div
      className={`rounded-2xl border p-5 ${colors[color]}`}
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

interface RowProps {
  label: string;
  value: string;
}

function Row({
  label,
  value,
}: RowProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 last:border-0">

      <span className="font-medium text-slate-600">
        {label}
      </span>

      <span className="font-semibold text-slate-900">
        {value}
      </span>

    </div>
  );
}
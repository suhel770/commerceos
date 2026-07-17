"use client";

import {
  TrendingUp,
  Search,
  Target,
  LineChart,
  Sparkles,
} from "lucide-react";

import StudioAccordion from "../../shared/StudioAccordion";

export default function GrowthSection() {
  return (
    <StudioAccordion
      title="Growth & Discoverability"
      description="Optimize visibility, SEO and marketplace performance."
      badge="91%"
      rightSlot={
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Excellent
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-4">

        <GrowthCard
          icon={<Search size={18} />}
          title="SEO Score"
          value="91%"
          color="emerald"
        />

        <GrowthCard
          icon={<Target size={18} />}
          title="CTR"
          value="+11%"
          color="blue"
        />

        <GrowthCard
          icon={<TrendingUp size={18} />}
          title="Conversion"
          value="+8%"
          color="violet"
        />

        <GrowthCard
          icon={<LineChart size={18} />}
          title="Ranking"
          value="#24"
          color="emerald"
        />

      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">

        <GrowthRow
          title="Product Title"
          status="Optimized"
        />

        <GrowthRow
          title="Description"
          status="Needs Improvement"
        />

        <GrowthRow
          title="Search Keywords"
          status="Missing 6 Keywords"
        />

        <GrowthRow
          title="Bullet Points"
          status="Good"
        />

        <GrowthRow
          title="Backend Search Terms"
          status="Not Added"
        />

      </div>

      <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">

        <div className="flex items-center gap-3">

          <Sparkles
            size={18}
            className="text-violet-600"
          />

          <h3 className="font-semibold text-violet-700">
            AI Growth Advisor
          </h3>

        </div>

        <p className="mt-3 text-sm leading-7 text-violet-700">

          Adding six high-volume keywords and improving the
          product description is expected to increase organic
          impressions by approximately <strong>18%</strong>.

        </p>

        <div className="mt-5 flex flex-wrap gap-3">

          <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white">

            Optimize SEO

          </button>

          <button className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700">

            Generate Keywords

          </button>

        </div>

      </div>

    </StudioAccordion>
  );
}

interface GrowthCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: "emerald" | "blue" | "violet";
}

function GrowthCard({
  icon,
  title,
  value,
  color,
}: GrowthCardProps) {
  const styles = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue:
      "border-sky-200 bg-sky-50 text-sky-700",
    violet:
      "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    <div className={`rounded-2xl border p-5 ${styles[color]}`}>

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

function GrowthRow({
  title,
  status,
}: {
  title: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 last:border-0">

      <span className="font-medium text-slate-900">
        {title}
      </span>

      <span className="text-sm font-semibold text-slate-600">
        {status}
      </span>

    </div>
  );
}
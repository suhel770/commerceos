"use client";

import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  UploadCloud,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

import StudioAccordion from "../../shared/StudioAccordion";

export default function PublishingSection() {
  return (
    <StudioAccordion
      title="Publishing"
      description="Validate, publish and monitor marketplace sync."
      badge="Ready to Publish"
      rightSlot={
        <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Publish Product
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-4">

        <PublishCard
          icon={<UploadCloud size={18} />}
          title="Ready"
          value="4"
          color="emerald"
        />

        <PublishCard
          icon={<Clock3 size={18} />}
          title="Pending"
          value="1"
          color="amber"
        />

        <PublishCard
          icon={<RefreshCw size={18} />}
          title="Sync Status"
          value="Healthy"
          color="blue"
        />

        <PublishCard
          icon={<CheckCircle2 size={18} />}
          title="Validation"
          value="96%"
          color="violet"
        />

      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">

        <MarketplaceRow
          marketplace="Amazon"
          status="Ready"
          issues="0"
        />

        <MarketplaceRow
          marketplace="Flipkart"
          status="Ready"
          issues="0"
        />

        <MarketplaceRow
          marketplace="Meesho"
          status="Pending"
          issues="1"
        />

        <MarketplaceRow
          marketplace="AJIO"
          status="Blocked"
          issues="3"
        />

        <MarketplaceRow
          marketplace="Shopify"
          status="Ready"
          issues="0"
        />

      </div>

      <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">

        <div className="flex items-center gap-3">

          <Sparkles
            size={18}
            className="text-violet-600"
          />

          <h3 className="font-semibold text-violet-700">

            AI Publishing Advisor

          </h3>

        </div>

        <p className="mt-3 text-sm leading-7 text-violet-700">

          Amazon, Flipkart and Shopify are ready for
          publishing.

          AJIO requires category mapping and three mandatory
          attributes before publishing.

        </p>

        <div className="mt-5 flex flex-wrap gap-3">

          <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white">

            Fix All Issues

          </button>

          <button className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700">

            Validate Again

          </button>

        </div>

      </div>

    </StudioAccordion>
  );
}

interface PublishCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color:
    | "emerald"
    | "amber"
    | "blue"
    | "violet";
}

function PublishCard({
  icon,
  title,
  value,
  color,
}: PublishCardProps) {

  const styles = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    amber:
      "border-amber-200 bg-amber-50 text-amber-700",

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

function MarketplaceRow({
  marketplace,
  status,
  issues,
}: {
  marketplace: string;
  status: string;
  issues: string;
}) {
  const blocked = status === "Blocked";

  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 last:border-0">

      <div>

        <p className="font-semibold text-slate-900">

          {marketplace}

        </p>

        <p className="mt-1 text-sm text-slate-500">

          {issues} Validation Issue(s)

        </p>

      </div>

      <div
        className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
          blocked
            ? "bg-red-100 text-red-700"
            : status === "Pending"
            ? "bg-amber-100 text-amber-700"
            : "bg-emerald-100 text-emerald-700"
        }`}
      >

        {blocked ? (
          <AlertTriangle size={14} />
        ) : (
          <CheckCircle2 size={14} />
        )}

        {status}

      </div>

    </div>
  );
}
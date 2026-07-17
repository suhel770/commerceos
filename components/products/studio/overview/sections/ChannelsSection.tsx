"use client";

import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Store,
  Sparkles,
} from "lucide-react";

import StudioAccordion from "../../shared/StudioAccordion";

export default function ChannelsSection() {
  return (
    <StudioAccordion
      title="Sales Channels"
      description="Manage marketplace connections, sync health and publishing status."
      badge="5 Connected"
      rightSlot={
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          All Connected
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-4">

        <Metric
          title="Connected"
          value="5"
          icon={<Store size={18} />}
          color="emerald"
        />

        <Metric
          title="Live Listings"
          value="5"
          icon={<CheckCircle2 size={18} />}
          color="blue"
        />

        <Metric
          title="Pending"
          value="1"
          icon={<RefreshCw size={18} />}
          color="violet"
        />

        <Metric
          title="Issues"
          value="1"
          icon={<AlertTriangle size={18} />}
          color="amber"
        />

      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">

        <ChannelRow
          name="Amazon"
          status="Live"
          sync="2 min ago"
        />

        <ChannelRow
          name="Flipkart"
          status="Live"
          sync="4 min ago"
        />

        <ChannelRow
          name="Meesho"
          status="Pending"
          sync="12 min ago"
        />

        <ChannelRow
          name="AJIO"
          status="Needs Review"
          sync="1 hour ago"
        />

        <ChannelRow
          name="Shopify"
          status="Live"
          sync="Now"
        />

      </div>

      <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">

        <div className="flex items-center gap-3">

          <Sparkles
            size={18}
            className="text-violet-600"
          />

          <h3 className="font-semibold text-violet-700">

            AI Channel Advisor

          </h3>

        </div>

        <p className="mt-3 text-sm leading-7 text-violet-700">

          This product is ready for Amazon, Flipkart and
          Shopify. AJIO requires one additional attribute
          before publishing.

        </p>

        <div className="mt-5 flex gap-3">

          <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white">
            Fix Issues
          </button>

          <button className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700">
            Publish All
          </button>

        </div>

      </div>

    </StudioAccordion>
  );
}

interface MetricProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "emerald" | "blue" | "violet" | "amber";
}

function Metric({
  title,
  value,
  icon,
  color,
}: MetricProps) {
  const styles = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue:
      "border-sky-200 bg-sky-50 text-sky-700",
    violet:
      "border-violet-200 bg-violet-50 text-violet-700",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700",
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

function ChannelRow({
  name,
  status,
  sync,
}: {
  name: string;
  status: string;
  sync: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 last:border-0">

      <div>

        <p className="font-semibold text-slate-900">
          {name}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Last Sync • {sync}
        </p>

      </div>

      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
        {status}
      </span>

    </div>
  );
}
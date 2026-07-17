"use client";

import {
  CheckCircle2,
  Image,
  PlayCircle,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

import StudioAccordion from "../../shared/StudioAccordion";

export default function MediaSection() {
  return (
    <StudioAccordion
      title="Media"
      description="Manage product images, videos and marketplace media."
      badge="8 Images"
      rightSlot={
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Ready
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-4">

        <StatCard
          icon={<Image size={18} />}
          title="Images"
          value="8 / 9"
          color="emerald"
        />

        <StatCard
          icon={<PlayCircle size={18} />}
          title="Videos"
          value="1"
          color="blue"
        />

        <StatCard
          icon={<Sparkles size={18} />}
          title="Lifestyle"
          value="3"
          color="violet"
        />

        <StatCard
          icon={<CheckCircle2 size={18} />}
          title="Marketplace Ready"
          value="92%"
          color="emerald"
        />

      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">

        <MarketplaceRow
          marketplace="Amazon"
          images="9 / 9"
          video="Yes"
          status="Ready"
        />

        <MarketplaceRow
          marketplace="Flipkart"
          images="8 / 8"
          video="Optional"
          status="Ready"
        />

        <MarketplaceRow
          marketplace="Meesho"
          images="6 / 6"
          video="No"
          status="Ready"
        />

        <MarketplaceRow
          marketplace="AJIO"
          images="5 / 8"
          video="Missing"
          status="Needs Attention"
        />

      </div>

      <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">

        <div className="flex items-center gap-3">

          <Sparkles
            size={18}
            className="text-violet-600"
          />

          <h3 className="font-semibold text-violet-700">
            AI Assist
          </h3>

        </div>

        <p className="mt-3 text-sm leading-7 text-violet-700">

          Two images need a pure white background for Amazon.
          One image resolution is below the recommended quality.
          AI can automatically generate marketplace-ready versions.

        </p>

        <div className="mt-5 flex flex-wrap gap-3">

          <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">

            Fix Images

          </button>

          <button className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100">

            Generate Lifestyle Images

          </button>

        </div>

      </div>

    </StudioAccordion>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color:
    | "emerald"
    | "blue"
    | "violet";
}

function StatCard({
  icon,
  title,
  value,
  color,
}: StatCardProps) {

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

interface MarketplaceRowProps {
  marketplace: string;
  images: string;
  video: string;
  status: string;
}

function MarketplaceRow({
  marketplace,
  images,
  video,
  status,
}: MarketplaceRowProps) {
  const warning = status === "Needs Attention";

  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 last:border-0">

      <div>

        <p className="font-semibold text-slate-900">

          {marketplace}

        </p>

        <p className="mt-1 text-sm text-slate-500">

          Images {images} • Video {video}

        </p>

      </div>

      <div
        className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
          warning
            ? "bg-amber-100 text-amber-700"
            : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {warning ? (
          <AlertTriangle size={14} />
        ) : (
          <CheckCircle2 size={14} />
        )}

        {status}

      </div>

    </div>
  );
}
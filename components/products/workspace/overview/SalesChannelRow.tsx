"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BarChart3 } from "lucide-react";

interface SalesChannelRowProps {
  marketplace: string;
  marketplaceSku: string;

  listingIdLabel: string;
  listingId: string;

  sellingPrice: number;

  availableStock: number;
  orders30Days: number;
  revenue30Days: number;

  status: string;
  listingStatus: string;

  stockSync: boolean;

  lastSync: string;

  healthScore?: number;

  marketplaceUrl?: string;
}

export default function SalesChannelRow({
  marketplace,
  marketplaceSku,
  listingIdLabel,
  listingId,
  sellingPrice,
  availableStock,
  orders30Days,
  status,
  marketplaceUrl,
}: SalesChannelRowProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3 transition hover:bg-slate-50">

      {/* LEFT */}

      <div className="flex items-center gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white">

          <Image
            src={`/marketplaces/${marketplace.toLowerCase()}.png`}
            alt={marketplace}
            width={24}
            height={24}
          />

        </div>

        <div>

          <div className="flex items-center gap-3">

            <h3 className="font-semibold text-slate-900">
              {marketplace}
            </h3>

            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                status === "Active"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {status}
            </span>

          </div>

          <div className="mt-2 flex gap-7">

            <InfoItem
              label="SKU"
              value={marketplaceSku}
            />

            <InfoItem
              label={listingIdLabel}
              value={listingId}
            />

          </div>

        </div>

      </div>

      {/* CENTER */}

      <div className="hidden lg:flex items-center gap-12">

        <Metric
          value={`₹${sellingPrice}`}
          label="Price"
        />

        <Metric
          value={availableStock.toString()}
          label="Stock"
          success
        />

        <Metric
          value={orders30Days.toString()}
          label="Orders"
        />

      </div>
            {/* RIGHT */}

      <div className="flex items-center gap-2">

        <button
          type="button"
          className="rounded-lg border border-slate-200 p-2 transition hover:border-blue-500 hover:text-blue-600"
          title="Analytics"
        >
          <BarChart3 size={17} />
        </button>

        <Link
          href={marketplaceUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-slate-200 p-2 transition hover:border-blue-500 hover:text-blue-600"
          title="Open Listing"
        >
          <ArrowUpRight size={17} />
        </Link>

      </div>

    </div>
  );
}

interface MetricProps {
  value: string;
  label: string;
  success?: boolean;
}

function Metric({
  value,
  label,
  success,
}: MetricProps) {
  return (
    <div className="min-w-[72px] text-center">

      <p
        className={`text-base font-semibold ${
          success
            ? "text-emerald-600"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>

      <p className="mt-0.5 text-xs text-slate-400">
        {label}
      </p>

    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}
function InfoItem({
  label,
  value,
}: InfoItemProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}
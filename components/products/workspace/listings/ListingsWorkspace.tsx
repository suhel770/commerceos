"use client";

import { safeResponseJson } from "@/lib/api/client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types/product";
import {
  MetricTile,
  WorkspacePanel,
} from "../shared/WorkspacePanel";
import MarketplaceAllocationSection from "./MarketplaceAllocationSection";

interface ListingsWorkspaceProps {
  product: Product;
}

function statusTone(status: string) {
  switch (status) {
    case "Live":
    case "Active":
      return "bg-emerald-100 text-emerald-700";
    case "Draft":
    case "Queued":
    case "Partial Active":
      return "bg-amber-100 text-amber-700";
    case "Failed":
    case "Out of Stock":
    case "Error":
      return "bg-rose-100 text-rose-700";
    case "Paused":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

/** Map product listing mock fields onto flowchart Step 7 labels */
function operationalLabel(listing: {
  listingStatus: string;
  status: string;
  availableStock: number;
}): string {
  if (listing.listingStatus === "Draft") return "Draft";
  if (listing.listingStatus === "Inactive") return "Paused";
  if (listing.availableStock <= 0) return "Out of Stock";
  if (listing.status !== "Active") return "Partial Active";
  return "Active";
}

function healthLabel(listing: {
  healthScore?: number;
  availableStock: number;
  listingStatus: string;
}): "Healthy" | "Action Required" {
  if (
    listing.listingStatus !== "Live" ||
    listing.availableStock <= 0 ||
    (listing.healthScore ?? 100) < 80
  ) {
    return "Action Required";
  }

  return "Healthy";
}

export default function ListingsWorkspace({
  product,
}: ListingsWorkspaceProps) {
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const liveCount = product.listings.filter(
    (item) => item.listingStatus === "Live",
  ).length;
  const draftCount = product.listings.filter(
    (item) => item.listingStatus === "Draft",
  ).length;
  const inactiveCount = product.listings.filter(
    (item) => item.listingStatus === "Inactive",
  ).length;
  const syncingCount = product.listings.filter(
    (item) => item.stockSync,
  ).length;

  const syncInventory = async () => {
    setSyncing(true);
    setSyncMessage(null);
    setSyncError(null);

    try {
      const response = await fetch("/api/v1/listings/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          type: "sync_inventory",
        }),
      });
      const payload = await safeResponseJson(response);

      setSyncMessage(
        `Synced ${Array.isArray(payload.data) ? payload.data.length : 0} channel job(s).`,
      );
    } catch (error) {
      setSyncMessage(
        error instanceof Error
          ? error.message
          : "Unable to sync listings.",
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Connected"
          value={product.listings.length}
          hint="Marketplace listings"
          tone="blue"
        />
        <MetricTile
          label="Live"
          value={liveCount}
          hint="Published & selling"
          tone="emerald"
        />
        <MetricTile
          label="Draft / Queued"
          value={draftCount}
          hint="Not yet live"
          tone="amber"
        />
        <MetricTile
          label="Stock Sync On"
          value={syncingCount}
          hint={`${inactiveCount} inactive`}
          tone="violet"
        />
      </div>

      <WorkspacePanel
        title="Unified Listing Management"
        description="Status tracking, marketplace IDs, inventory sync, errors, and deep links for every channel."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={syncing}
            onClick={() => void syncInventory()}
          >
            <RefreshCw
              className={`mr-2 h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`}
            />
            Sync inventory
          </Button>
        }
      >
        {syncMessage ? (
          <p className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600" role="status">
            {syncMessage}
          </p>
        ) : null}
        {product.listings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No marketplace listings yet. Publish from Product Studio to create channel listings.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
            {product.listings.map((listing) => (
              <article
                key={listing.id}
                className="flex flex-col gap-4 px-4 py-4 transition hover:bg-slate-50 xl:flex-row xl:items-center xl:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
                    <Image
                      src={`/marketplaces/${listing.marketplace.toLowerCase().replace(/\s+/g, "-")}.png`}
                      alt={listing.marketplace}
                      width={24}
                      height={24}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {listing.marketplace}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone(operationalLabel(listing))}`}
                      >
                        {operationalLabel(listing)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          healthLabel(listing) === "Healthy"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {healthLabel(listing)}
                      </span>
                      {listing.stockSync ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Sync on
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                          <CircleDashed className="h-3.5 w-3.5" />
                          Sync off
                        </span>
                      )}
                    </div>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {listing.title}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                      <span>
                        SKU{" "}
                        <strong className="text-slate-800">
                          {listing.marketplaceSku}
                        </strong>
                      </span>
                      <span>
                        {listing.listingIdLabel}{" "}
                        <strong className="text-slate-800">
                          {listing.listingId}
                        </strong>
                      </span>
                      <span>
                        Last sync{" "}
                        <strong className="text-slate-800">
                          {listing.lastSync}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 xl:justify-end">
                  <Metric
                    label="Price"
                    value={`₹${listing.sellingPrice}`}
                  />
                  <Metric
                    label="Stock"
                    value={String(listing.availableStock)}
                    success
                  />
                  <Metric
                    label="Orders 30D"
                    value={String(listing.orders30Days)}
                  />
                  <Metric
                    label="Revenue 30D"
                    value={`₹${listing.revenue30Days.toLocaleString("en-IN")}`}
                  />
                  {typeof listing.healthScore === "number" ? (
                    <Metric
                      label="Health"
                      value={`${listing.healthScore}%`}
                    />
                  ) : null}

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/products/${product.slug}/listings/${listing.id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
                    >
                      Open Listing
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                    {listing.marketplaceUrl ? (
                      <Link
                        href={listing.marketplaceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
                        aria-label={`Open ${listing.marketplace} storefront`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </WorkspacePanel>

      <MarketplaceAllocationSection product={product} />
    </div>
  );
}

function Metric({
  label,
  value,
  success,
}: {
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <div className="min-w-[72px]">
      <p
        className={`text-sm font-semibold ${
          success ? "text-emerald-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}

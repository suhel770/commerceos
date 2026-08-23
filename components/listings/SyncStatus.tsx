"use client";

import { safeResponseJson } from "@/lib/api/client";
import { useState } from "react";
import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";

import type { MarketplaceListing, Product } from "@/lib/types/product";

interface SyncStatusProps {
  product: Product;
  listing: MarketplaceListing;
}

export default function SyncStatus({
  product,
  listing,
}: SyncStatusProps) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const syncItems = [
    {
      title: "Inventory",
      time: listing.lastSync,
      success: listing.stockSync,
    },
    {
      title: "Price",
      time: listing.lastSync,
      success: listing.status === "Active",
    },
    {
      title: "Content",
      time: listing.lastSync,
      success: listing.listingStatus === "Live",
    },
    {
      title: "Status",
      time: listing.lastSync,
      success: listing.listingStatus !== "Inactive",
    },
  ];

  const runSync = async () => {
    setSyncing(true);
    setMessage(null);

    try {
      const marketplace = listing.marketplace
        .toLowerCase()
        .replace(/\s+/g, "_");

      const response = await fetch("/api/v1/listings/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          type: "sync_inventory",
          marketplace:
            marketplace === "own_website"
              ? "shopify"
              : marketplace,
        }),
      });

      const payload = await safeResponseJson(response);

      if (!payload.success) {
        throw new Error(
          payload.error?.message ?? "Sync failed.",
        );
      }

      setMessage("Sync job completed for this channel.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sync listing.",
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="mb-4 flex items-center justify-between">

        <div>

          <h2 className="text-sm font-bold text-slate-900">
            Sync Status
          </h2>

          <p className="text-xs text-slate-500">
            {listing.marketplace} synchronization
          </p>

        </div>

        <button
          type="button"
          disabled={syncing}
          onClick={() => void runSync()}
          className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50 disabled:opacity-60"
          aria-label="Run marketplace sync"
        >
          <RefreshCw
            size={15}
            className={`text-blue-600 ${syncing ? "animate-spin" : ""}`}
          />
        </button>

      </div>

      <div className="mb-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Clock3 size={14} />
          Last sync: {listing.lastSync}
        </div>
      </div>

      <div className="space-y-3">

        {syncItems.map((item) => (
          <div
            key={item.title}
            className="flex items-center justify-between"
          >

            <div className="flex items-center gap-2 text-sm text-slate-700">

              {item.success ? (
                <CheckCircle2
                  size={15}
                  className="text-emerald-600"
                />
              ) : (
                <ArrowUpRight
                  size={15}
                  className="text-amber-600"
                />
              )}

              {item.title}

            </div>

            <span className="text-xs text-slate-400">
              {item.time}
            </span>

          </div>
        ))}

      </div>

      {message ? (
        <p className="mt-4 text-xs text-slate-600" role="status">
          {message}
        </p>
      ) : null}

    </div>
  );
}

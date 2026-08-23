"use client";

import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import type { MarketplaceListing } from "@/lib/types/product";

interface MarketplaceHealthProps {
  listing: MarketplaceListing;
}

export default function MarketplaceHealth({
  listing,
}: MarketplaceHealthProps) {
  const score = listing.healthScore ?? 72;
  const healthy = score >= 80 && listing.availableStock > 0;
  const operational =
    listing.listingStatus === "Draft"
      ? "Draft"
      : listing.availableStock <= 0
        ? "Out of Stock"
        : listing.listingStatus === "Inactive"
          ? "Paused"
          : listing.status === "Active"
            ? "Active"
            : "Partial Active";
  const visibility =
    healthy && operational === "Active" ? "High" : score >= 70 ? "Medium" : "Low";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <div className="flex items-center gap-2">

            <ShieldCheck
              size={18}
              className={healthy ? "text-green-600" : "text-amber-600"}
            />

            <h2 className="text-sm font-semibold">
              Marketplace Status
            </h2>

          </div>

          <p className="mt-1 text-xs text-slate-500">
            {listing.marketplace} continuous tracking
          </p>

        </div>

        <div className="text-right">

          <p
            className={`text-3xl font-bold ${
              healthy ? "text-green-600" : "text-amber-600"
            }`}
          >
            {score}%
          </p>

          <p className="text-xs text-slate-500">
            {healthy ? "Healthy" : "Action Required"}
          </p>

        </div>

      </div>

      <div className="mt-4 h-2 rounded-full bg-slate-200">

        <div
          className={`h-2 rounded-full ${
            healthy ? "bg-green-500" : "bg-amber-500"
          }`}
          style={{ width: `${Math.min(100, score)}%` }}
        />

      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">

        <div className="flex items-center gap-2">

          <CheckCircle2
            size={16}
            className="text-green-600"
          />

          <span className="text-slate-600">
            {operational}
          </span>

        </div>

        <div className="flex items-center gap-2">

          {listing.stockSync ? (
            <CheckCircle2
              size={16}
              className="text-green-600"
            />
          ) : (
            <AlertTriangle
              size={16}
              className="text-amber-600"
            />
          )}

          <span className="text-slate-600">
            Visibility {visibility}
          </span>

        </div>

        <div className="text-xs text-slate-500">
          Platform ID: {listing.listingId}
        </div>

        <div className="text-xs text-slate-500">
          Stock: {listing.availableStock} · Sync {listing.lastSync}
        </div>

      </div>

    </div>
  );
}

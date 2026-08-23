"use client";

import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Loader2,
  Rocket,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useStudio } from "../../context/StudioContext";
import {
  computePublishingScore,
} from "@/lib/studio/workspace-metrics";
import { ListingStatus } from "@/lib/types/master-listing";

function formatListingStatus(
  status: ListingStatus,
): string {
  switch (status) {
    case ListingStatus.DRAFT:
      return "Draft";

    case ListingStatus.READY:
      return "Ready";

    case ListingStatus.PUBLISHED:
      return "Published";

    case ListingStatus.PARTIALLY_PUBLISHED:
      return "Partial";

    case ListingStatus.FAILED:
      return "Failed";

    case ListingStatus.ARCHIVED:
      return "Archived";

    default:
      return "Draft";
  }
}

export default function StudioHeader() {
  const {
    product,
    listing,
    dirty,
    saving,
    validating,
    publishing,
    save,
    validate,
    publish,
  } = useStudio();

  if (!listing) {
    return null;
  }

  const score = computePublishingScore(listing);
  const statusLabel = formatListingStatus(listing.status);

  return (
    <header className="bg-white">

      <div className="mx-auto flex max-w-[1800px] flex-col gap-4 px-4 pt-4 pb-2 sm:px-6">

        {/* Breadcrumb */}

        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-sm text-slate-500"
        >
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Products
          </Link>

          <ChevronRight className="h-4 w-4" />

          <Link
            href={`/products/${product.slug}`}
            className="font-medium transition-colors hover:text-slate-900"
          >
            Product Overview
          </Link>

          <ChevronRight className="h-4 w-4" />

          <span className="font-semibold text-slate-900">
            Product Studio
          </span>
        </nav>

        {/* Main row */}

        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

          {/* Product identity */}

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-3">

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {listing.identity.productName}
              </h1>

              <Badge
                variant="secondary"
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                {statusLabel}
              </Badge>

            </div>

            <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-500">
              <span>
                SKU:
                <strong className="ml-1 font-semibold text-slate-700">
                  {listing.identity.sku}
                </strong>
              </span>

              <span>
                Brand:
                <strong className="ml-1 font-semibold text-slate-700">
                  {listing.identity.brand}
                </strong>
              </span>

              <span>
                Category:
                <strong className="ml-1 font-semibold text-slate-700">
                  {listing.identity.category}
                </strong>
              </span>
            </p>

          </div>

          {/* Readiness */}

          <div className="w-full shrink-0 xl:w-64">

            <div className="mb-2 flex items-center justify-between text-sm">

              <span className="font-medium text-slate-600">
                Publishing Readiness
              </span>

              <span className="font-bold text-emerald-600">
                {score}%
              </span>

            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">

              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${score}%` }}
              />

            </div>

          </div>

          {/* Actions */}

          <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap xl:justify-end">

            <AutosaveIndicator
              dirty={dirty}
              saving={saving}
            />

            <Button
              variant="outline"
              className="h-10 shrink-0 rounded-lg border-slate-200 px-3.5 text-slate-700 shadow-sm"
              disabled={validating}
              onClick={() => validate()}
            >
              {validating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Validate
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="h-10 shrink-0 rounded-lg border-slate-200 px-3.5 text-slate-700 shadow-sm"
              disabled={
                saving ||
                !listing.permissions
                  .canEdit
              }
              onClick={() => save()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>

            <Button
              className="h-10 shrink-0 rounded-lg bg-blue-600 px-4 text-white shadow-sm hover:bg-blue-700"
              disabled={
                publishing ||
                !listing.permissions
                  .canPublish
              }
              onClick={() => publish()}
            >
              {publishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Publish
                </>
              )}
            </Button>

          </div>

        </div>

      </div>

    </header>
  );
}

interface AutosaveIndicatorProps {
  dirty: boolean;
  saving: boolean;
}

function AutosaveIndicator({
  dirty,
  saving,
}: AutosaveIndicatorProps) {
  if (saving) {
    return (
      <div className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-600 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Saving...
      </div>
    );
  }

  if (dirty) {
    return (
      <div className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-amber-200 bg-amber-50 px-4 text-sm text-amber-700 shadow-sm">
        <Cloud className="h-4 w-4" />
        Unsaved Changes
      </div>
    );
  }

  return (
    <div className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-emerald-300 bg-emerald-50 px-4 text-sm font-medium text-emerald-700 shadow-sm">
      <CheckCircle2 className="h-4 w-4" />
      All Changes Saved
    </div>
  );
}

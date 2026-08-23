"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Rocket,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildMarketplaceStatusCards,
  operationalStatusLabel,
} from "@/lib/listing-engine/status/marketplace-status";
import {
  computeChannelReadiness,
  computePublishingReadinessScore,
} from "@/lib/listing-engine/readiness/compute-readiness";
import { useStudio } from "../../../context/StudioContext";
import { Panel } from "./workspace-ui";

function statusTone(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-700";
    case "partial_active":
      return "bg-amber-100 text-amber-700";
    case "out_of_stock":
    case "error":
      return "bg-rose-100 text-rose-700";
    case "paused":
      return "bg-sky-100 text-sky-700";
    case "draft":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function PublishingWorkspace() {
  const {
    listing,
    validating,
    publishing,
    validate,
    publish,
  } = useStudio();

  if (!listing) return null;

  const masterScore = computePublishingReadinessScore(listing);
  const channels = computeChannelReadiness(listing);
  const statusCards = buildMarketplaceStatusCards(listing);
  const optionalSuggestions = listing.aiInsights.filter(
    (insight) => !insight.applied,
  );

  return (
    <div className="space-y-5">
      <Panel
        title="Validate & One-Click Publish"
        description="Rule engines prepare marketplace payloads. AI is optional and never required to publish."
      >
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Publishing Readiness
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Unified score from master validation and marketplace engines.
              </p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {masterScore}%
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            disabled={validating}
            onClick={() => validate()}
          >
            {validating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Validate Master Listing
          </Button>

          <Button
            disabled={publishing || !listing.permissions.canPublish}
            onClick={() => publish()}
          >
            {publishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="mr-2 h-4 w-4" />
            )}
            One Click Publish
          </Button>
        </div>
      </Panel>

      <Panel
        title="Marketplace Readiness"
        description="Per-channel scores from Amazon, Flipkart, and other marketplace engines."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <div
              key={channel.marketplace}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold capitalize text-slate-900">
                  {channel.marketplace}
                </p>
                <p className="text-lg font-bold text-slate-900">
                  {channel.score}%
                </p>
              </div>
              <p className="mt-1 text-xs capitalize text-slate-500">
                {channel.enabled
                  ? channel.publishStatus.replaceAll("_", " ")
                  : "disabled"}
              </p>
              {channel.blockers.length > 0 ? (
                <p className="mt-2 text-xs font-medium text-rose-600">
                  {channel.blockers.length} suggestion
                  {channel.blockers.length === 1 ? "" : "s"} / blockers
                </p>
              ) : (
                <p className="mt-2 text-xs font-medium text-emerald-600">
                  Ready to publish
                </p>
              )}
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="AI Suggestion Center"
        description="Optional credit-gated help. Manual validation and publish remain complete without AI."
      >
        {optionalSuggestions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No AI suggestions queued. Core rule engines are sufficient to publish.
          </p>
        ) : (
          <div className="space-y-3">
            {optionalSuggestions.map((insight) => (
              <article
                key={insight.id}
                className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  {insight.type}
                  {insight.creditRequired ? " · credits" : ""}
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {insight.title}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {insight.description}
                </p>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Marketplace Status Tracking"
        description="Live channel status, platform IDs, stock, visibility, and health after publish."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {statusCards.map((card) => (
            <article
              key={card.marketplace}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold capitalize text-slate-900">
                  {card.marketplace}
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone(card.operationalStatus)}`}
                >
                  {operationalStatusLabel(card.operationalStatus)}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600">
                <div>
                  <p className="uppercase tracking-wide text-slate-400">
                    Platform ID
                  </p>
                  <p className="mt-1 font-medium text-slate-800">
                    {card.platformId ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="uppercase tracking-wide text-slate-400">
                    Stock
                  </p>
                  <p className="mt-1 font-medium text-slate-800">
                    {card.stock}
                  </p>
                </div>
                <div>
                  <p className="uppercase tracking-wide text-slate-400">
                    Visibility
                  </p>
                  <p className="mt-1 font-medium capitalize text-slate-800">
                    {card.visibility}
                  </p>
                </div>
                <div>
                  <p className="uppercase tracking-wide text-slate-400">
                    Last sync
                  </p>
                  <p className="mt-1 font-medium text-slate-800">
                    {card.lastSyncAt
                      ? new Date(card.lastSyncAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
              </div>

              <p
                className={`mt-3 text-xs font-semibold ${
                  card.health === "healthy"
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                {card.health === "healthy"
                  ? "Healthy"
                  : "Action Required"}
              </p>
            </article>
          ))}
        </div>
      </Panel>

      <Panel
        title="Validation Results"
        description="Blocking and advisory issues returned by CommerceOS rule engines."
      >
        {listing.validationIssues.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            <CheckCircle2 className="h-5 w-5" />
            No validation issues detected.
          </div>
        ) : (
          <div className="space-y-3">
            {listing.validationIssues.map((issue) => (
              <article
                key={issue.id}
                className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                <div>
                  <p className="font-semibold text-amber-900">
                    {issue.title}
                  </p>

                  <p className="mt-1 text-sm text-amber-800">
                    {issue.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

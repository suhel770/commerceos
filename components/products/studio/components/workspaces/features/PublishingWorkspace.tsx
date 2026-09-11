"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Rocket,
  Sparkles,
  Code2,
  ShieldCheck,
  Globe,
  Info,
  Layers,
  ShieldAlert,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudio } from "../../../context/StudioContext";
import { Panel } from "./workspace-ui";
import { MarketplaceName } from "@/lib/types/master-listing";
import { getMarketplaceAdapter } from "@/lib/marketplace/adapters/generic.adapter";
import { getMarketplaceRegistry } from "@/lib/marketplace/registry/marketplace-registry";
import {
  computeDetailedChannelReadiness,
  validateListingPipeline,
  type DetailedChannelReadiness,
} from "@/lib/listing-engine/readiness/compute-readiness";

export function PublishingWorkspace() {
  const {
    listing,
    validating,
    publishing,
    validate,
    publish,
    setActiveWorkspace,
  } = useStudio();

  const [inspectPayloadChannel, setInspectPayloadChannel] = useState<MarketplaceName | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const pipeline = useMemo(() => {
    if (!listing) return null;
    return validateListingPipeline(listing);
  }, [listing]);

  if (!listing || !pipeline) return null;

  const eligibleChannels = pipeline.channelReadiness.filter((c) => c.state === "READY");
  const blockedChannels = pipeline.channelReadiness.filter((c) => c.state !== "READY" && c.isConnected);
  const unneededChannels = pipeline.channelReadiness.filter((c) => !c.isConnected);

  const inspectedAdapter = inspectPayloadChannel ? getMarketplaceAdapter(inspectPayloadChannel) : null;
  const inspectedPayload = inspectedAdapter ? inspectedAdapter.transform(listing) : null;

  const handleCopyPayload = () => {
    if (!inspectedPayload) return;
    navigator.clipboard.writeText(JSON.stringify(inspectedPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 1500);
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Multi-Channel Publish Center & Staging"
        description="Pre-publish validation gate verifies real catalog readiness. Staging transforms and pre-validates listing payloads across all connected sales channels."
      >
        {/* Notice Banner */}
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-xs text-sky-950">
          <Info className="h-4.5 w-4.5 shrink-0 text-sky-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              CommerceOS Pre-Publish Validation & Staging Engine
            </p>
            <p className="text-sky-800 leading-relaxed font-medium">
              Staging simulates and packages ready payloads for distribution. Live OAuth & external marketplace API dispatch will be unlocked in the final API integration phase.
            </p>
          </div>
        </div>

        {/* Action Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-2xs">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Multi-Channel Publish Gate
            </h4>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              {eligibleChannels.length} of {pipeline.channelReadiness.filter(c => c.isConnected).length} connected channels are 100% eligible for publishing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              disabled={validating}
              onClick={() => validate()}
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {validating ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              )}
              Re-Validate Dataset
            </Button>

            <Button
              size="sm"
              disabled={publishing || eligibleChannels.length === 0}
              onClick={() => publish()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
            >
              {publishing ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Rocket className="mr-1.5 h-3.5 w-3.5 text-white" />
              )}
              Stage & Prepare Eligible ({eligibleChannels.length})
            </Button>
          </div>
        </div>

        {/* 1. Eligible Channels for Staging */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Eligible Channels for Staged Publishing ({eligibleChannels.length})
          </h4>
          {eligibleChannels.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
              No channels are currently 100% eligible. Resolve missing requirements in the Exceptions Center.
            </div>
          ) : (
            eligibleChannels.map((channel) => (
              <article
                key={channel.marketplace}
                className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-black uppercase text-xs">
                    {channel.marketplace.slice(0, 2)}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">{channel.name}</h5>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Ready for Staged Publishing
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInspectPayloadChannel(channel.marketplace)}
                    className="h-8 text-xs bg-white border-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <Code2 className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                    View Prepared Data
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>

        {/* 2. Blocked Channels */}
        {blockedChannels.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Connected Channels Requiring Attention ({blockedChannels.length})
            </h4>
            {blockedChannels.map((channel) => (
              <article
                key={channel.marketplace}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-rose-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 font-bold uppercase text-xs">
                    {channel.marketplace.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-slate-900">{channel.name}</h5>
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-800 uppercase">
                        {channel.state.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-rose-700 font-medium">
                      Blockers: {channel.blockers.join("; ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveWorkspace("exceptions")}
                    className="h-8 text-xs border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer"
                  >
                    Resolve Blockers
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInspectPayloadChannel(channel.marketplace)}
                    className="h-8 text-xs cursor-pointer"
                  >
                    <Code2 className="mr-1.5 h-3.5 w-3.5" />
                    Inspect Payload
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      {/* Prepared Data Inspection Modal */}
      {inspectPayloadChannel && inspectedPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Prepared Listing Data: {inspectPayloadChannel.toUpperCase()}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Transformed from canonical master product by CommerceOS Adapter for staging.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPayload}
                  className="h-8 text-xs gap-1 cursor-pointer"
                >
                  {copiedPayload ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedPayload ? "Copied" : "Copy JSON"}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectPayloadChannel(null)}
                  className="h-8 text-xs cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6 bg-slate-950">
              <pre className="font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
                {JSON.stringify(inspectedPayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

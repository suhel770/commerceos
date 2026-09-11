"use client";

import { useMemo } from "react";
import {
  Share2,
  Globe2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink,
  Plus,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudio } from "../../context/StudioContext";
import StudioField from "../../shared/StudioField";
import { MarketplaceName, type MasterAttribute, type MasterListing } from "@/lib/types/master-listing";
import { getMarketplaceRegistry } from "@/lib/marketplace/registry/marketplace-registry";

export default function ChannelsSection() {
  const { listing, setActiveWorkspace } = useStudio();

  const channelData = useMemo(() => {
    if (!listing) return [];

    const channels = [
      MarketplaceName.AMAZON,
      MarketplaceName.FLIPKART,
      MarketplaceName.MEESHO,
      MarketplaceName.MYNTRA,
      MarketplaceName.SHOPIFY,
    ];

    const hasTitle = Boolean(listing.identity.productName?.trim());
    const hasCategory = Boolean(listing.identity.category?.trim());
    const hasPrice = Number(listing.pricing?.sellingPrice) > 0;
    const hasMedia = listing.media && listing.media.length > 0;
    const hasOrigin = listing.attributes.some((a: MasterAttribute) => a.key === "country_of_origin" && a.value);
    const hasSize = listing.attributes.some((a: MasterAttribute) => (a.key === "shoe_size_uk" || a.key === "size") && a.value);

    return channels.map((mp) => {
      const reg = getMarketplaceRegistry(mp);
      const isConnected = listing.marketplaces.some((m: MasterListing["marketplaces"][number]) => m.marketplace === mp && m.enabled);

      let score = 0;
      if (hasTitle) score += 25;
      if (hasCategory) score += 25;
      if (hasPrice) score += 20;
      if (hasMedia) score += 15;

      if (mp === MarketplaceName.MYNTRA && hasSize) score += 15;
      else if (mp === MarketplaceName.AMAZON && hasOrigin) score += 15;
      else if (mp !== MarketplaceName.MYNTRA && mp !== MarketplaceName.AMAZON) score += 15;

      return {
        marketplace: mp,
        name: reg.name,
        isConnected,
        score,
        status: !isConnected ? "NOT_CONNECTED" : score >= 90 ? "READY" : "ACTION_REQUIRED",
      };
    });
  }, [listing]);

  if (!listing) return null;

  const connectedList = channelData.filter((c) => c.isConnected);
  const healthScore = connectedList.length > 0
    ? Math.round(connectedList.reduce((acc, c) => acc + c.score, 0) / connectedList.length)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
            <Share2 className="h-4 w-4" />
            Universal Channel Intelligence
          </div>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            Marketplace Channels & Sync
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Manage marketplace readiness, channel mapping, and synchronization from this centralized Master Product workspace.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-cyan-600 shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Channel Readiness</p>
              <h3 className="text-xl font-bold text-cyan-800">{healthScore}%</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Connected Channels Overview */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <Globe2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Connected Channels</h3>
                <p className="text-xs text-slate-500">Active marketplace mappings</p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setActiveWorkspace("channels")}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Manage Channels
            </Button>
          </div>

          <div className="space-y-3">
            {channelData.map((channel) => (
              <div
                key={channel.marketplace}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-bold uppercase text-xs text-slate-700 shadow-2xs">
                    {channel.marketplace.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{channel.name}</h4>
                    <span className="text-xs text-slate-500">
                      {channel.isConnected ? `${channel.score}% Ready` : "Not connected"}
                    </span>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    channel.status === "READY"
                      ? "bg-emerald-100 text-emerald-800"
                      : channel.status === "ACTION_REQUIRED"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {channel.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items & Quick Navigation */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Intelligence Workspaces</h3>
                <p className="text-xs text-slate-500">Fast jump to channel intelligence</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-5">
              CommerceOS automates multi-channel listing preparation by standardizing data once at the Master Product layer.
            </p>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => setActiveWorkspace("readiness" as any)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-left transition-colors hover:bg-slate-100 text-xs font-semibold text-slate-800"
              >
                <span>Channel Readiness Command Center</span>
                <span className="text-indigo-600 font-bold">Open →</span>
              </button>

              <button
                onClick={() => setActiveWorkspace("exceptions" as any)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-left transition-colors hover:bg-slate-100 text-xs font-semibold text-slate-800"
              >
                <span>Exceptions & Action Items</span>
                <span className="text-rose-600 font-bold">Inspect →</span>
              </button>

              <button
                onClick={() => setActiveWorkspace("preview" as any)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-left transition-colors hover:bg-slate-100 text-xs font-semibold text-slate-800"
              >
                <span>Marketplace Simulation Preview</span>
                <span className="text-emerald-600 font-bold">View →</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

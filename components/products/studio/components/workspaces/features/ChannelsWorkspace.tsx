"use client";

import { useState } from "react";
import {
  Globe,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Tag,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useStudio } from "../../../context/StudioContext";
import { Panel } from "./workspace-ui";
import { MarketplaceName } from "@/lib/types/master-listing";
import { getMarketplaceRegistry } from "@/lib/marketplace/registry/marketplace-registry";

export function ChannelsWorkspace() {
  const { listing, updateListing, product } = useStudio();
  const [selectedChannel, setSelectedChannel] = useState<MarketplaceName>(MarketplaceName.AMAZON);

  if (!listing) return null;

  const channels = [
    MarketplaceName.AMAZON,
    MarketplaceName.FLIPKART,
    MarketplaceName.MEESHO,
    MarketplaceName.MYNTRA,
    MarketplaceName.SHOPIFY,
  ];

  const currentConnection = listing.marketplaces.find((m) => m.marketplace === selectedChannel);
  const isEnabled = Boolean(currentConnection?.enabled);
  const registry = getMarketplaceRegistry(selectedChannel);

  const toggleChannel = (marketplace: MarketplaceName, enabled: boolean) => {
    const updated = listing.marketplaces.map((m) =>
      m.marketplace === marketplace ? { ...m, enabled } : m
    );

    // If channel wasn't in array, add it
    if (!updated.some((m) => m.marketplace === marketplace)) {
      updated.push({
        marketplace,
        enabled,
        publishStatus: "DRAFT" as any,
        validationScore: 80,
        issues: [],
      });
    }

    updateListing({ marketplaces: updated });
  };

  // Custom channel overrides stored in listing.overrides / commercials
  const channelOverrides = (listing as any).channelOverrides?.[selectedChannel] || {};

  const handleUpdateOverride = (key: string, value: string) => {
    const prevOverrides = (listing as any).channelOverrides || {};
    const updatedChannelOverrides = {
      ...prevOverrides,
      [selectedChannel]: {
        ...prevOverrides[selectedChannel],
        [key]: value,
      },
    };

    updateListing({
      ...listing,
      channelOverrides: updatedChannelOverrides,
    } as any);
  };

  return (
    <Panel
      title="Connected Sales Channels & Channel Overrides"
      description="Configure active channels and customize marketplace-specific title and pricing overrides without modifying your canonical master product."
    >
      {/* Channel Switcher */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {channels.map((channel) => {
          const reg = getMarketplaceRegistry(channel);
          const isSelected = selectedChannel === channel;
          const isConn = listing.marketplaces.some((m) => m.marketplace === channel && m.enabled);

          return (
            <button
              key={channel}
              type="button"
              onClick={() => setSelectedChannel(channel)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{reg.name}</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  isConn ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Selected Channel Management Box */}
      <div className="space-y-6">
        {/* Connection Toggle Card */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">{registry.name} Connection</h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  isEnabled
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {isEnabled ? "ACTIVE FOR PUBLISHING" : "DISABLED"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600 font-medium">
              Enable or disable staging and inventory synchronization for this marketplace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={isEnabled}
              onCheckedChange={(checked) => toggleChannel(selectedChannel, checked)}
            />
          </div>
        </div>

        {/* Channel-Specific Overrides Section */}
        <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-indigo-600" />
                <h4 className="text-sm font-black text-slate-900">
                  {registry.name} Channel Overrides
                </h4>
                <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                  Channel Override
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Customize titles or prices specifically for {registry.name}.
              </p>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
            <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>Note:</strong> Changing fields here does <strong>not</strong> change your master product. Channel overrides are isolated strictly to {registry.name}.
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Custom Channel Title
              </label>
              <Input
                placeholder={listing.identity.productName || "Leave empty to use master title"}
                value={channelOverrides.title ?? ""}
                onChange={(e) => handleUpdateOverride("title", e.target.value)}
                className="text-xs font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Master Title: &quot;{listing.identity.productName}&quot;
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Custom Channel Selling Price (₹)
              </label>
              <Input
                type="number"
                min="0"
                placeholder={String(listing.pricing?.sellingPrice || "0")}
                value={channelOverrides.sellingPrice ?? ""}
                onChange={(e) => handleUpdateOverride("sellingPrice", e.target.value)}
                className="text-xs font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Master Selling Price: ₹{listing.pricing?.sellingPrice || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

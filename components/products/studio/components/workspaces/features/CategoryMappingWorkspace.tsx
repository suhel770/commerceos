"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FolderTree,
  CheckCircle2,
  AlertTriangle,
  Globe,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Layers,
  Edit2,
  Check,
  X,
  RefreshCw,
  ShieldCheck,
  Clock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStudio } from "../../../context/StudioContext";
import { Panel } from "./workspace-ui";
import { MarketplaceName } from "@/lib/types/master-listing";
import { getMarketplaceRegistry, getAllMarketplaceRegistries } from "@/lib/marketplace/registry/marketplace-registry";
import {
  resolveBaselineCategoryMapping,
  type CategoryMappingResult,
} from "@/lib/marketplace/taxonomy/category-mapping.service";
import {
  taxonomySyncService,
  type TaxonomySyncLedger,
} from "@/lib/marketplace/taxonomy/taxonomy-sync.service";

export function CategoryMappingWorkspace() {
  const { listing, updateListing, product } = useStudio();

  const [mappings, setMappings] = useState<Record<string, CategoryMappingResult | null>>({});
  const [loading, setLoading] = useState(true);
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [syncLedger, setSyncLedger] = useState<TaxonomySyncLedger | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const masterCategory = listing?.identity?.category || product?.category || "General";

  // Dynamic channels from listing or all registries
  const channels = useMemo(() => {
    if (listing?.marketplaces && listing.marketplaces.length > 0) {
      return listing.marketplaces.map((m) => m.marketplace);
    }
    return [
      MarketplaceName.AMAZON,
      MarketplaceName.FLIPKART,
      MarketplaceName.MEESHO,
      MarketplaceName.MYNTRA,
      MarketplaceName.AJIO,
      MarketplaceName.SHOPIFY,
    ];
  }, [listing?.marketplaces]);

  useEffect(() => {
    // Load initial sync status
    const ledger = taxonomySyncService.getSyncStatus();
    setSyncLedger(ledger);

    const handleSyncUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<TaxonomySyncLedger>;
      if (customEvent.detail) {
        setSyncLedger(customEvent.detail);
      }
    };
    window.addEventListener("commerceos_taxonomy_sync_updated", handleSyncUpdate);

    return () => {
      window.removeEventListener("commerceos_taxonomy_sync_updated", handleSyncUpdate);
    };
  }, []);

  useEffect(() => {
    if (!masterCategory) return;
    setLoading(true);

    const map: Record<string, CategoryMappingResult | null> = {};
    channels.forEach((mp) => {
      map[mp] = resolveBaselineCategoryMapping(masterCategory, mp);
    });
    setMappings(map);
    setLoading(false);
  }, [masterCategory, channels]);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const updated = taxonomySyncService.triggerAutomatedSync();
      setSyncLedger(updated);

      // Re-resolve mappings
      const map: Record<string, CategoryMappingResult | null> = {};
      channels.forEach((mp) => {
        map[mp] = resolveBaselineCategoryMapping(masterCategory, mp);
      });
      setMappings(map);
      setIsSyncing(false);
    }, 600);
  };

  const handleSaveMapping = (mp: string) => {
    if (!customName.trim()) return;

    setMappings((prev) => ({
      ...prev,
      [mp]: {
        marketplace: mp as MarketplaceName,
        commerceCategory: masterCategory,
        marketplaceCategoryId: `cat.${mp.toLowerCase()}.${customName.toLowerCase().replace(/\s+/g, "_")}`,
        marketplaceCategoryName: customName.trim(),
        marketplaceVertical: customName.toUpperCase().replace(/\s+/g, "_"),
        confidenceScore: 1.0,
        isAutomatic: false,
      },
    }));

    setEditingChannel(null);
    setCustomName("");
  };

  if (!listing) return null;

  const nextDueDate = syncLedger ? new Date(syncLedger.nextSyncDueAt) : null;
  const daysUntilSync = nextDueDate
    ? Math.max(1, Math.ceil((nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 7;

  return (
    <Panel
      title="Universal Category Taxonomy & Auto-Sync Engine"
      description="CommerceOS automatically links and synchronizes your master product category with live marketplace browse nodes and verticals."
    >
      {/* 1. Automated 7-Day Sync & Governance Banner */}
      <div className="mb-5 rounded-2xl border border-blue-200/80 bg-linear-to-r from-blue-50/70 to-indigo-50/50 p-4.5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs shrink-0 mt-0.5">
              <Zap className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-bold text-slate-900">
                  Automated Marketplace Taxonomy Sync
                </h4>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                  ● Weekly Schedule Active (Every 7 Days)
                </Badge>
              </div>
              <p className="text-xs text-slate-600 leading-normal">
                Categories are monitored in the background against Amazon SP-API and Flipkart Verticals. Changes are auto-healed with zero manual effort.
              </p>
              <div className="flex items-center gap-3 pt-0.5 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  Next auto-refresh: in {daysUntilSync} days
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-700">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  Schema Drift: Clean (0 Deprecations)
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="h-8 text-xs font-semibold bg-white border-blue-200 text-blue-700 hover:bg-blue-50 shadow-2xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-blue-600" : ""}`} />
              <span>{isSyncing ? "Checking Marketplace Changes…" : "Check for Changes Now"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Master Category Card */}
      <div className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Master Canonical Category (Single Source)
            </span>
            <div className="flex items-center gap-2.5 mt-1">
              <FolderTree className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">{masterCategory}</h3>
            </div>
          </div>

          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 self-start sm:self-auto flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Mapped to {channels.length} Connected Channels
          </span>
        </div>
      </div>

      {/* 3. Dynamic Multi-Channel Taxonomy Mappings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Connected Channel Vertical Resolutions
          </h4>
          <span className="text-[11px] text-slate-500 font-medium">
            Auto-derived from master category
          </span>
        </div>

        <div className="grid gap-3">
          {channels.map((mp) => {
            const registry = getMarketplaceRegistry(mp);
            const mapping = mappings[mp];
            const isEditing = editingChannel === mp;
            const confidence = mapping?.confidenceScore ?? 0;
            const isHighConfidence = confidence >= 0.90;

            return (
              <article
                key={mp}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs uppercase shadow-2xs">
                    {mp.slice(0, 2)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-slate-900">{registry.name}</h5>
                      <Badge
                        className={`text-[10px] font-bold px-2 py-0.2 ${
                          isHighConfidence
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {isHighConfidence ? "AUTO-MAPPED (95%+)" : "REVIEW REQUIRED"}
                      </Badge>
                    </div>

                    {!isEditing ? (
                      <p className="mt-1 text-xs font-medium text-slate-700">
                        Target Node / Vertical:{" "}
                        <strong className="text-slate-900 font-semibold">
                          {mapping?.marketplaceCategoryName || "Auto-detecting…"}
                        </strong>
                        {mapping?.marketplaceVertical && (
                          <span className="ml-2 text-slate-400 font-normal">
                            (Code: {mapping.marketplaceVertical})
                          </span>
                        )}
                      </p>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          placeholder="Enter marketplace category name"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          className="h-8 text-xs w-64 bg-white"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveMapping(mp)}
                          className="h-8 bg-slate-900 text-white text-xs px-2.5 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingChannel(null)}
                          className="h-8 text-xs px-2.5 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingChannel(mp);
                      setCustomName(mapping?.marketplaceCategoryName || "");
                    }}
                    className="h-7 text-xs gap-1 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer self-end sm:self-auto"
                  >
                    <Edit2 className="h-3 w-3 text-slate-400" />
                    <span>Override</span>
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

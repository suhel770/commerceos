"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudio } from "../../../context/StudioContext";
import { Panel } from "./workspace-ui";
import { MarketplaceName } from "@/lib/types/master-listing";
import { getMarketplaceRegistry } from "@/lib/marketplace/registry/marketplace-registry";
import {
  resolveBaselineCategoryMapping,
  type CategoryMappingResult,
} from "@/lib/marketplace/taxonomy/category-mapping.service";

export function CategoryMappingWorkspace() {
  const { listing, updateListing, product } = useStudio();

  const [mappings, setMappings] = useState<Record<string, CategoryMappingResult | null>>({});
  const [loading, setLoading] = useState(true);
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");

  const masterCategory = listing?.identity?.category || product?.category || "General";

  const channels = [
    MarketplaceName.AMAZON,
    MarketplaceName.FLIPKART,
    MarketplaceName.MEESHO,
    MarketplaceName.MYNTRA,
    MarketplaceName.SHOPIFY,
  ];

  useEffect(() => {
    if (!masterCategory) return;
    setLoading(true);

    const map: Record<string, CategoryMappingResult | null> = {};
    channels.forEach((mp) => {
      map[mp] = resolveBaselineCategoryMapping(masterCategory, mp);
    });
    setMappings(map);
    setLoading(false);
  }, [masterCategory]);

  if (!listing) return null;

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

  return (
    <Panel
      title="Universal Category Taxonomy & Mapping"
      description="CommerceOS links your canonical product category to the corresponding vertical taxonomy on each connected marketplace."
    >
      {/* Master Category Card */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-2xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Master Canonical Category
            </span>
            <div className="flex items-center gap-2 mt-1">
              <FolderTree className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-black text-slate-900">{masterCategory}</h3>
            </div>
          </div>

          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 self-start sm:self-auto">
            ✓ Master Category Configured
          </span>
        </div>
      </div>

      {/* Channel Mapping Cards */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Target Marketplace Category Mappings
        </h4>

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
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-black uppercase text-xs">
                    {mp.slice(0, 2)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-slate-900">{registry.name}</h5>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          isHighConfidence
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isHighConfidence ? "MAPPED" : "REVIEW REQUIRED"}
                      </span>
                    </div>

                    {!isEditing ? (
                      <p className="mt-1 text-xs font-medium text-slate-700">
                        Mapped to: <strong className="text-slate-900">{mapping?.marketplaceCategoryName || "Auto-detecting…"}</strong>
                        {mapping?.marketplaceVertical && (
                          <span className="ml-2 text-slate-400 font-normal">
                            (Vertical: {mapping.marketplaceVertical})
                          </span>
                        )}
                      </p>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          placeholder="Enter marketplace category name"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          className="h-8 text-xs w-64"
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
                    className="h-8 text-xs gap-1 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer self-end sm:self-auto"
                  >
                    <Edit2 className="h-3 w-3 text-slate-500" />
                    <span>Override Mapping</span>
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

"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Info,
  Layers,
  Percent,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import type { Product } from "@/lib/types/product";
import type { ChannelAllocationRule } from "@/lib/inventory/types";
import { safeResponseJson } from "@/lib/api/client";
import CommerceSelect, { CommerceSelectOption } from "@/components/ui/CommerceSelect";

const ALLOCATION_MODE_OPTIONS: CommerceSelectOption[] = [
  { value: "fixed", label: "Fixed Quantity" },
  { value: "percentage", label: "Percentage (%)" },
  { value: "dynamic", label: "Dynamic (Pool)" },
];

interface MarketplaceAllocationSectionProps {
  product: Product;
}

interface ChannelConfigState {
  channel: string;
  name: string;
  logo: string;
  active: boolean;
  mode: "fixed" | "percentage" | "dynamic";
  fixedQty: number;
  percentage: number;
  connectionStatus: "Not Connected" | "Connected" | "Live";
  reportedStock: "Not Synced" | number;
  syncStatus: "NOT_SYNCED" | "PENDING_SYNC" | "SYNCED";
  lastSync: string;
}

export default function MarketplaceAllocationSection({
  product,
}: MarketplaceAllocationSectionProps) {
  // Available SKUs: Master SKU and any variant SKUs
  const availableSkus = useMemo(() => {
    const list: Array<{ sku: string; label: string }> = [
      { sku: product.sku, label: `${product.sku} (Master SKU)` },
    ];
    const rawVariants = (product as any).variants;
    if (Array.isArray(rawVariants)) {
      for (const v of rawVariants) {
        if (v && v.sku && v.sku !== product.sku) {
          list.push({ sku: v.sku, label: `${v.sku} (${v.name || "Variant"})` });
        }
      }
    }
    return list;
  }, [product]);

  const [selectedSku, setSelectedSku] = useState(availableSkus[0]?.sku || product.sku);

  // Map only REAL connected listings to channel configurations (0 fake channels)
  const initialChannels = useMemo<ChannelConfigState[]>(() => {
    const rawListings = (product.listings || []).filter(
      (l) => l.marketplace && l.marketplace.toLowerCase() !== "all" && l.marketplace.toLowerCase() !== "none"
    );

    return rawListings.map((l) => {
      const marketplaceName = l.marketplace;
      const key = marketplaceName.toUpperCase();
      let logo = "/marketplaces/amazon.png";
      const lower = marketplaceName.toLowerCase();
      if (lower.includes("flipkart")) logo = "/marketplaces/flipkart.png";
      else if (lower.includes("meesho")) logo = "/marketplaces/meesho.png";
      else if (lower.includes("shopify")) logo = "/marketplaces/shopify.png";
      else if (lower.includes("myntra")) logo = "/marketplaces/myntra.png";

      return {
        channel: key,
        name: marketplaceName,
        logo,
        active: l.listingStatus === "Live" || l.status === "Active",
        mode: "fixed",
        fixedQty: l.availableStock || 0,
        percentage: 30,
        connectionStatus: (l.listingStatus === "Live" ? "Live" : "Connected") as any,
        reportedStock: l.availableStock ?? "Not Synced",
        syncStatus: l.stockSync ? "SYNCED" : "NOT_SYNCED",
        lastSync: l.lastSync || "—",
      };
    });
  }, [product.listings]);

  const [channels, setChannels] = useState<ChannelConfigState[]>(initialChannels);
  const [totalAts, setTotalAts] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setChannels(initialChannels);
  }, [initialChannels]);

  // Load live ATS and existing rules for selected SKU
  useEffect(() => {
    let mounted = true;
    const loadAllocationData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/inventory?sku=${encodeURIComponent(selectedSku)}`);
        const payload = await safeResponseJson(res);
        const balances = payload?.data?.balances || payload?.balances || payload?.data || [];
        const match = Array.isArray(balances)
          ? balances.find((b: any) => (b.sku || "").toLowerCase() === selectedSku.toLowerCase())
          : null;

        const ats = match
          ? Math.max(0, (match.available || 0) - (match.allocated || 0) - (match.safetyStock || 0))
          : (product.inventory?.available ?? 41);

        if (mounted) {
          setTotalAts(ats);
        }
      } catch {
        if (mounted) {
          setTotalAts(product.inventory?.available ?? 41);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadAllocationData();
    return () => {
      mounted = false;
    };
  }, [selectedSku, product]);

  // Compute total allocated and unallocated units
  const { totalAllocated, unallocated, isOverAllocated, overage } = useMemo(() => {
    let allocated = 0;
    for (const ch of channels) {
      if (!ch.active) continue;
      if (ch.mode === "fixed") {
        allocated += Math.max(0, ch.fixedQty || 0);
      } else if (ch.mode === "percentage") {
        allocated += Math.max(0, Math.floor((totalAts * (ch.percentage || 0)) / 100));
      } else if (ch.mode === "dynamic") {
        allocated += totalAts;
      }
    }

    const over = allocated > totalAts ? allocated - totalAts : 0;
    return {
      totalAllocated: allocated,
      unallocated: Math.max(0, totalAts - allocated),
      isOverAllocated: allocated > totalAts,
      overage: over,
    };
  }, [channels, totalAts]);

  const handleUpdateChannel = (channelKey: string, patch: Partial<ChannelConfigState>) => {
    setChannels((prev) =>
      prev.map((c) => (c.channel === channelKey ? { ...c, ...patch } : c)),
    );
    setSaveFeedback(null);
  };

  const handleSaveAllocation = async () => {
    if (isOverAllocated) return;

    setIsSaving(true);
    setSaveFeedback(null);

    const rules: ChannelAllocationRule[] = channels.map((ch) => ({
      channel: ch.channel,
      active: ch.active,
      fixedCap: ch.mode === "fixed" ? Math.max(0, ch.fixedQty) : undefined,
      percentage: ch.mode === "percentage" ? Math.max(0, ch.percentage) : undefined,
    }));

    try {
      const res = await fetch("/api/v1/inventory/allocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          sku: selectedSku,
          totalAts,
          rules,
          mode: "growing",
        }),
      });

      const payload = await safeResponseJson(res);

      if (!res.ok || payload.error) {
        throw new Error(payload.error || "Failed to save marketplace allocation.");
      }

      setSaveFeedback({
        type: "success",
        text: `Marketplace allocation for ${selectedSku} saved successfully. ${unallocated} unallocated units remain in reserve.`,
      });
    } catch (err: any) {
      setSaveFeedback({
        type: "error",
        text: err.message || "Failed to save channel allocation.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      {/* SECTION HEADER */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                <Layers className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">
                Marketplace Sales & Inventory Allocation
              </h2>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Configure how central Available-to-Sell (ATS) stock is distributed across active sales channels.
            </p>
          </div>

          {/* SKU / VARIANT SELECTOR */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 shrink-0">Active SKU:</span>
            <div className="w-64">
              <CommerceSelect
                value={selectedSku}
                options={availableSkus.map((s) => ({ value: s.sku, label: s.label }))}
                size="sm"
                onChange={(value) => {
                  setSelectedSku(value);
                  setSaveFeedback(null);
                }}
                searchable={false}
              />
            </div>
          </div>
        </div>

        {/* ATS SUMMARY KPI STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Central Available Pool (ATS)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {totalAts.toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-bold text-slate-500">Units</span>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold block mt-1">
              Physical On-Hand − Reserved − Safety Stock
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${isOverAllocated ? "bg-rose-50 border-rose-200" : "bg-indigo-50/50 border-indigo-200"}`}>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${isOverAllocated ? "text-rose-700" : "text-indigo-800"}`}>
              Total Channel Allocation
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black font-mono ${isOverAllocated ? "text-rose-900" : "text-indigo-950"}`}>
                {totalAllocated.toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-bold text-slate-500">Units</span>
            </div>
            <span className={`text-[11px] font-semibold block mt-1 ${isOverAllocated ? "text-rose-700 font-extrabold" : "text-indigo-700"}`}>
              {isOverAllocated ? `Exceeds ATS by ${overage} units!` : `${((totalAllocated / (totalAts || 1)) * 100).toFixed(0)}% of ATS allocated`}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
              Unallocated Stock Buffer
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-950 font-mono">
                {unallocated.toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-bold text-emerald-800">Units</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
              Held in central reserve (prevents overselling)
            </span>
          </div>
        </div>

        {/* OVER-ALLOCATION VALIDATION ALERT */}
        {isOverAllocated && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-extrabold">Allocation exceeds available ATS by {overage} units.</p>
              <p className="text-rose-700">
                You have allocated <strong>{totalAllocated} units</strong> across marketplaces, but only <strong>{totalAts} units</strong> are available in central ATS. Reduce allocation before saving.
              </p>
            </div>
          </div>
        )}

        {/* FEEDBACK BANNER */}
        {saveFeedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              saveFeedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            {saveFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{saveFeedback.text}</span>
          </div>
        )}

        {/* MARKETPLACE ALLOCATION CARDS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Channel Allocation Rules
            </h3>
            {channels.length > 0 && (
              <span className="text-[11px] font-bold text-slate-400">
                {channels.length} Connected Channel{channels.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {channels.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-500 shadow-2xs mb-3">
                <Store className="h-6 w-6 text-slate-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No Marketplaces Connected</h4>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 font-medium">
                Sales channels (Amazon, Flipkart, Meesho, Shopify) must be connected in Settings before configuring inventory allocation and live sync rules.
              </p>
              <div className="mt-4 flex items-center justify-center">
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 transition active:scale-95 cursor-pointer"
                >
                  <span>Connect Channels in Settings</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
              {channels.map((ch) => {
                const computedQty =
                  ch.mode === "fixed"
                    ? ch.fixedQty
                    : ch.mode === "percentage"
                      ? Math.floor((totalAts * ch.percentage) / 100)
                      : totalAts;

                return (
                  <div
                    key={ch.channel}
                    className={`p-4 transition flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${
                      ch.active ? "bg-white hover:bg-slate-50/70" : "bg-slate-50/50 opacity-60"
                    }`}
                  >
                    {/* Left: Channel Info */}
                    <div className="flex items-center gap-3 min-w-[220px]">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5 overflow-hidden">
                        <Image
                          src={ch.logo}
                          alt=""
                          width={24}
                          height={24}
                          className="h-6 w-6 object-contain"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{ch.name}</span>
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {ch.connectionStatus}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>Marketplace Reported:</span>
                          <strong className="text-slate-700 font-mono">
                            {typeof ch.reportedStock === "number" ? `${ch.reportedStock} Units` : ch.reportedStock}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Mode & Input */}
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ch.active}
                          onChange={(e) => handleUpdateChannel(ch.channel, { active: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>Enable Allocation</span>
                      </label>

                      {ch.active && (
                        <div className="flex items-center gap-2">
                          {/* Mode selector */}
                          <div className="w-38 shrink-0">
                            <CommerceSelect
                              value={ch.mode}
                              options={ALLOCATION_MODE_OPTIONS}
                              size="sm"
                              onChange={(value) =>
                                handleUpdateChannel(ch.channel, {
                                  mode: value as any,
                                })
                              }
                              searchable={false}
                            />
                          </div>

                          {/* Input Value */}
                          {ch.mode === "fixed" && (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                max={totalAts}
                                value={ch.fixedQty}
                                onChange={(e) =>
                                  handleUpdateChannel(ch.channel, {
                                    fixedQty: Math.max(0, parseInt(e.target.value, 10) || 0),
                                  })
                                }
                                className="h-8 w-20 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-900 font-mono text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                              <span className="text-xs font-bold text-slate-500">Units</span>
                            </div>
                          )}

                          {ch.mode === "percentage" && (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={ch.percentage}
                                onChange={(e) =>
                                  handleUpdateChannel(ch.channel, {
                                    percentage: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)),
                                  })
                                }
                                className="h-8 w-16 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-900 font-mono text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                              <span className="text-xs font-bold text-slate-500">%</span>
                              <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                ({computedQty} Units)
                              </span>
                            </div>
                          )}

                          {ch.mode === "dynamic" && (
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg">
                              Shared Central ATS ({totalAts} Units)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Allocation Status */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 min-w-[180px]">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Allocated Slice</span>
                        <span className="text-sm font-black text-slate-900 font-mono">
                          {ch.active ? `${computedQty} Units` : "0 Units"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Sync State</span>
                        <span className="text-xs font-bold text-slate-500">
                          {ch.syncStatus === "NOT_SYNCED" ? "Not Synced" : "Synced"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SAVE ACTION BUTTON */}
        {channels.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Configuring channel allocation does NOT physically transfer stock from Storage facilities.
            </span>

            <button
              type="button"
              disabled={isOverAllocated || isSaving}
              onClick={handleSaveAllocation}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? "Saving..." : "Save Allocation"}</span>
            </button>
          </div>
        )}
      </div>

      {/* SEPARATE MARKETPLACE CONNECTIONS SECTION */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Marketplace Storefront Connections
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Authorized marketplace integrations active for your tenant.
              </p>
            </div>
          </div>

          <Link
            href="/settings"
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            <span>Manage Integrations</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {channels.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <p className="text-xs font-semibold text-slate-500">
              No external marketplace channels are currently connected to this workspace.
            </p>
            <Link
              href="/settings"
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              <span>Connect Amazon, Flipkart or Shopify in Settings</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {channels.map((ch) => (
              <div
                key={ch.channel}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-1 overflow-hidden">
                    <Image
                      src={ch.logo}
                      alt=""
                      width={20}
                      height={20}
                      className="h-5 w-5 object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">{ch.name}</span>
                    <span className="text-[10px] font-bold text-emerald-600">Connected</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                  Active
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

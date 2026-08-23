"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  AlertCircle,
  AlertTriangle,
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

const DEFAULT_CHANNELS: ChannelConfigState[] = [
  {
    channel: "AMAZON",
    name: "Amazon SP-API",
    logo: "/marketplaces/amazon.png",
    active: true,
    mode: "fixed",
    fixedQty: 0,
    percentage: 40,
    connectionStatus: "Not Connected",
    reportedStock: "Not Synced",
    syncStatus: "NOT_SYNCED",
    lastSync: "—",
  },
  {
    channel: "FLIPKART",
    name: "Flipkart Smart / FBF",
    logo: "/marketplaces/flipkart.png",
    active: true,
    mode: "fixed",
    fixedQty: 0,
    percentage: 30,
    connectionStatus: "Not Connected",
    reportedStock: "Not Synced",
    syncStatus: "NOT_SYNCED",
    lastSync: "—",
  },
  {
    channel: "SHOPIFY",
    name: "Shopify D2C Store",
    logo: "/marketplaces/shopify.png",
    active: true,
    mode: "fixed",
    fixedQty: 0,
    percentage: 20,
    connectionStatus: "Not Connected",
    reportedStock: "Not Synced",
    syncStatus: "NOT_SYNCED",
    lastSync: "—",
  },
];

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
  const [channels, setChannels] = useState<ChannelConfigState[]>(DEFAULT_CHANNELS);
  const [totalAts, setTotalAts] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
          // Set initial default allocations if available
          setChannels((prev) =>
            prev.map((ch, idx) => {
              if (idx === 0) return { ...ch, fixedQty: Math.min(ats, Math.floor(ats * 0.4)) };
              if (idx === 1) return { ...ch, fixedQty: Math.min(Math.max(0, ats - Math.floor(ats * 0.4)), Math.floor(ats * 0.3)) };
              if (idx === 2) return { ...ch, fixedQty: Math.min(Math.max(0, ats - Math.floor(ats * 0.7)), Math.floor(ats * 0.2)) };
              return ch;
            }),
          );
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
            <span className="text-xs font-bold text-slate-600">Active SKU:</span>
            <select
              value={selectedSku}
              onChange={(e) => {
                setSelectedSku(e.target.value);
                setSaveFeedback(null);
              }}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {availableSkus.map((s) => (
                <option key={s.sku} value={s.sku}>
                  {s.label}
                </option>
              ))}
            </select>
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
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Channel Allocation Rules
          </h3>

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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
                      <Image src={ch.logo} alt={ch.name} width={22} height={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{ch.name}</span>
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
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
                        <select
                          value={ch.mode}
                          onChange={(e) =>
                            handleUpdateChannel(ch.channel, {
                              mode: e.target.value as any,
                            })
                          }
                          className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white cursor-pointer"
                        >
                          <option value="fixed">Fixed Quantity</option>
                          <option value="percentage">Percentage (%)</option>
                          <option value="dynamic">Dynamic (Pool)</option>
                        </select>

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
        </div>

        {/* SAVE ACTION BUTTON */}
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
      </div>

      {/* SEPARATE MARKETPLACE CONNECTIONS SECTION (Section 11) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            <Store className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Marketplace Storefront Connections
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              Connect external marketplace API keys for real-time inventory feed updates.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Amazon Connection */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image src="/marketplaces/amazon.png" alt="Amazon" width={24} height={24} />
              <div>
                <span className="text-xs font-black text-slate-900 block">Amazon India</span>
                <span className="text-[10px] font-bold text-slate-500">Not Connected</span>
              </div>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
            >
              Connect Amazon
            </button>
          </div>

          {/* Flipkart Connection */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image src="/marketplaces/flipkart.png" alt="Flipkart" width={24} height={24} />
              <div>
                <span className="text-xs font-black text-slate-900 block">Flipkart</span>
                <span className="text-[10px] font-bold text-slate-500">Not Connected</span>
              </div>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
            >
              Connect Flipkart
            </button>
          </div>

          {/* Shopify Connection */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image src="/marketplaces/shopify.png" alt="Shopify" width={24} height={24} />
              <div>
                <span className="text-xs font-black text-slate-900 block">Shopify D2C</span>
                <span className="text-[10px] font-bold text-slate-500">Not Connected</span>
              </div>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
            >
              Connect Shopify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

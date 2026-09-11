"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Pencil, Check, X, RefreshCw, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type MasterListing } from "@/lib/types/master-listing";
import { useStudio } from "../../../context/StudioContext";
import { Panel, Field } from "./workspace-ui";

// ─── Types ─────────────────────────────────────────────────────────────────
interface LatestBillInfo {
  billNumber: string;
  billDate:   string;
  vendorName: string;
  unitPrice:  number;
  hsn:        string | null;
  gstRate:    number | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function usePurchaseBillPrice(sku: string) {
  const [billInfo, setBillInfo]   = useState<LatestBillInfo | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!sku) { setLoading(false); return; }

    setLoading(true);

    // Search ALL bills (no purchaseType filter) by SKU — SKU is now in the search haystack
    fetch(`/api/v1/purchase/bills?search=${encodeURIComponent(sku)}`)
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        const bills: any[] = Array.isArray(json) ? json : (json?.data ?? []);
        // Sort by billDate descending — get the latest bill
        const sorted = [...bills].sort(
          (a, b) => new Date(b.billDate ?? 0).getTime() - new Date(a.billDate ?? 0).getTime()
        );
        for (const bill of sorted) {
          const line = (bill.lines ?? []).find(
            (l: any) => typeof l.sku === "string" && l.sku.toLowerCase().trim() === sku.toLowerCase().trim()
          );
          if (line && Number(line.unitPrice) > 0) {
            setBillInfo({
              billNumber: bill.billNumber,
              billDate:   bill.billDate,
              vendorName: bill.vendorName,
              unitPrice:  Number(line.unitPrice),
              // Pull HSN and GST rate directly from the bill line
              hsn:     typeof line.hsn === "string" && line.hsn.trim() ? line.hsn.trim() : null,
              gstRate: typeof line.gstRate === "number" && line.gstRate > 0 ? line.gstRate : null,
            });
            return;
          }
        }
        setBillInfo(null);
      })
      .catch(() => setBillInfo(null))
      .finally(() => setLoading(false));
  }, [sku, refreshKey]);

  return { billInfo, loading, refresh: () => setRefreshKey((k) => k + 1) };
}

// ─── Component ─────────────────────────────────────────────────────────────
export function CommercialsWorkspace() {
  const { listing, updateListing, product } = useStudio();

  const sku = product?.sku ?? listing?.identity?.sku ?? "";

  // Fetch latest purchase bill price for this SKU
  const { billInfo, loading: billLoading, refresh: refreshBill } = usePurchaseBillPrice(sku);

  // ── Local cost adjustment state ──
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Editable extra-cost fields — stored in listing.commercials extended fields
  const [freightCost, setFreightCost]   = useState<number>(
    Number((listing?.commercials as any)?.inboundFreightPerUnit) || 0
  );
  const [otherCost, setOtherCost]       = useState<number>(
    Number((listing?.commercials as any)?.otherCostPerUnit) || 0
  );
  const [editingFreight, setEditingFreight] = useState(false);
  const [editingOther,   setEditingOther]   = useState(false);
  const [freightDraft, setFreightDraft]     = useState("");
  const [otherDraft,   setOtherDraft]       = useState("");

  // ── Manual cost override ──
  const [editingOverride, setEditingOverride] = useState(false);
  const [overrideDraft,   setOverrideDraft]   = useState("");

  if (!listing) return null;

  // ── Cost Derivation ────────────────────────────────────────────────
  // 1. Base: latest purchase bill unit price (real data)
  const basePurchasePrice = billInfo?.unitPrice ?? 0;

  // 2. Packaging: linked consumables (future integration point — currently 0)
  const packagingCost = 0;

  // 3. Freight + other (user-editable)
  const trueLandedCost = basePurchasePrice + packagingCost + freightCost + otherCost;

  // 4. Manual override takes precedence if explicitly set
  const storedOverride = Number((listing.pricing as any)?.manualCostOverride) || 0;
  const effectiveCost  = storedOverride > 0 ? storedOverride : trueLandedCost || basePurchasePrice;

  // ── Sync effectiveCost → listing.pricing.costPrice ────────────────
  useEffect(() => {
    if (effectiveCost > 0 && effectiveCost !== Number(listing.pricing?.costPrice)) {
      updateListing({ pricing: { ...listing.pricing, costPrice: effectiveCost } });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCost]);

  // ── Auto-sync HSN + GST rate from purchase bill → listing ─────────
  useEffect(() => {
    if (!billInfo) return;
    const updates: Record<string, any> = {};

    // Write HSN if bill has it and listing doesn't yet have one
    if (billInfo.hsn && !listing.identity?.hsn) {
      updates.identity = { ...listing.identity, hsn: billInfo.hsn };
    }

    // Write GST rate if bill has it and it differs from current
    if (
      billInfo.gstRate !== null &&
      billInfo.gstRate !== Number(listing.pricing?.taxPercentage)
    ) {
      updates.pricing = { ...listing.pricing, taxPercentage: billInfo.gstRate };
    }

    if (Object.keys(updates).length > 0) {
      updateListing(updates);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billInfo]);

  // ── Profit Calcs ──────────────────────────────────────────────────
  const sellingPrice   = Number(listing.pricing?.sellingPrice)  || 0;
  const mrp            = Number(listing.pricing?.mrp)            || 0;
  const taxPercentage  = Number(listing.pricing?.taxPercentage)  || 18;
  const grossProfit    = sellingPrice - effectiveCost;
  const grossMarginPct = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
  const markupPct      = effectiveCost  > 0 ? (grossProfit / effectiveCost)  * 100 : 0;
  const discountFromMrp = mrp > 0 ? ((mrp - sellingPrice) / mrp) * 100 : 0;

  // Delta vs landed cost when override is set
  const overrideDelta     = storedOverride > 0 ? storedOverride - trueLandedCost : 0;
  const deltaProfitImpact = -overrideDelta;

  // ── Updaters ──────────────────────────────────────────────────────
  const updateNumber = (key: keyof MasterListing["pricing"], value: string) =>
    updateListing({ pricing: { ...listing.pricing, [key]: Number(value) || 0 } });

  const updateCommercial = (key: keyof MasterListing["commercials"], value: string) =>
    updateListing({
      commercials: {
        ...listing.commercials,
        [key]: value === "" ? undefined : Math.max(0, Number(value) || 0),
      },
    });

  const commitFreight = () => {
    const v = Math.max(0, Number(freightDraft) || 0);
    setFreightCost(v);
    updateListing({ commercials: { ...listing.commercials, inboundFreightPerUnit: v } as any });
    setEditingFreight(false);
  };

  const commitOther = () => {
    const v = Math.max(0, Number(otherDraft) || 0);
    setOtherCost(v);
    updateListing({ commercials: { ...listing.commercials, otherCostPerUnit: v } as any });
    setEditingOther(false);
  };

  const commitOverride = () => {
    const val = Number(overrideDraft);
    if (!isNaN(val) && val >= 0) {
      updateListing({
        pricing: {
          ...listing.pricing,
          costPrice: val > 0 ? val : effectiveCost,
          ...(val > 0 ? { manualCostOverride: val } : { manualCostOverride: 0 }),
        } as any,
      });
    }
    setEditingOverride(false);
  };

  const clearOverride = () => {
    updateListing({
      pricing: { ...listing.pricing, costPrice: trueLandedCost || basePurchasePrice, manualCostOverride: 0 } as any,
    });
    setEditingOverride(false);
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Left 2-cols: Pricing Fields ── */}
        <div className="space-y-6 lg:col-span-2">
          <Panel
            title="Master Product Pricing"
            description="Set selling price and commercial specifications once. Channel adapters calculate marketplace listings from this base."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Selling Price (₹)">
                <Input
                  type="number" min="0"
                  value={listing.pricing.sellingPrice}
                  onChange={(e) => updateNumber("sellingPrice", e.target.value)}
                  className="font-bold text-base"
                />
              </Field>

              <Field label="Maximum Retail Price (MRP)">
                <Input
                  type="number" min="0"
                  value={listing.pricing.mrp}
                  onChange={(e) => updateNumber("mrp", e.target.value)}
                />
              </Field>

              {/* ── Cost Price + Inline Breakdown ── */}
              <div className="sm:col-span-2">
                <Field label="Cost Price (₹)">
                  <Input
                    type="number" min="0" readOnly
                    value={effectiveCost || ""}
                    placeholder="Calculating…"
                    className="bg-slate-50 font-semibold text-slate-800 cursor-default"
                    onClick={() => setShowBreakdown((v) => !v)}
                  />
                </Field>

                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => setShowBreakdown((v) => !v)}
                  className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition cursor-pointer"
                >
                  {showBreakdown ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  How is this calculated?
                </button>

                {showBreakdown && (
                  <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-2">

                    {/* 1. Base Purchase Price */}
                    <div className="flex items-center justify-between">
                      <div className="text-slate-600">
                        <span className="font-semibold text-slate-800">Base Purchase Price</span>
                        {billInfo && (
                          <span className="ml-2 text-[10px] text-slate-400">
                            {billInfo.vendorName} · {billInfo.billNumber} · {new Date(billInfo.billDate).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"2-digit" })}
                          </span>
                        )}
                        {billLoading && <span className="ml-2 text-[10px] text-slate-400 animate-pulse">Fetching from purchase bills…</span>}
                        {!billLoading && !billInfo && <span className="ml-2 text-[10px] text-amber-600">No purchase bill found for SKU {sku}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${basePurchasePrice > 0 ? "text-slate-900" : "text-slate-400"}`}>
                          {basePurchasePrice > 0 ? `₹${basePurchasePrice.toFixed(2)}` : "—"}
                        </span>
                        <button type="button" onClick={refreshBill} title="Re-fetch from purchase bills" className="text-slate-400 hover:text-indigo-600 cursor-pointer transition">
                          <RefreshCw className={`h-3 w-3 ${billLoading ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* 2. Packaging (future) */}
                    <div className="flex justify-between text-slate-500">
                      <span>Packaging Materials (Consumables)</span>
                      <span className="text-slate-400 italic text-[10px]">Link in Consumables workspace</span>
                    </div>

                    {/* HSN + GST pulled from bill — shown only when available */}
                    {billInfo && (billInfo.hsn || billInfo.gstRate !== null) && (
                      <div className="flex items-center gap-3 rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1.5">
                        <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider shrink-0">Auto-pulled from Bill</span>
                        {billInfo.hsn && (
                          <span className="text-[11px] font-bold text-indigo-800">
                            HSN: <span className="font-mono">{billInfo.hsn}</span>
                          </span>
                        )}
                        {billInfo.gstRate !== null && (
                          <span className="text-[11px] font-bold text-indigo-800">
                            GST: {billInfo.gstRate}%
                          </span>
                        )}
                      </div>
                    )}

                    {/* 3. Inbound Freight — editable */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600">Inbound Freight (per unit)</span>
                      {editingFreight ? (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">₹</span>
                          <Input
                            type="number" min="0" autoFocus
                            value={freightDraft}
                            onChange={(e) => setFreightDraft(e.target.value)}
                            className="h-6 w-24 text-xs px-2"
                          />
                          <button type="button" onClick={commitFreight} className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"><Check className="h-3 w-3" /></button>
                          <button type="button" onClick={() => setEditingFreight(false)} className="flex h-6 w-6 items-center justify-center rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"><X className="h-3 w-3" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={freightCost > 0 ? "font-semibold text-slate-900" : "text-slate-400"}>
                            {freightCost > 0 ? `₹${freightCost.toFixed(2)}` : "—"}
                          </span>
                          <button type="button" onClick={() => { setFreightDraft(String(freightCost)); setEditingFreight(true); }} className="text-slate-400 hover:text-indigo-600 cursor-pointer transition"><Pencil className="h-3 w-3" /></button>
                        </div>
                      )}
                    </div>

                    {/* 4. Other Cost — editable */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600">Other Cost (per unit)</span>
                      {editingOther ? (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">₹</span>
                          <Input
                            type="number" min="0" autoFocus
                            value={otherDraft}
                            onChange={(e) => setOtherDraft(e.target.value)}
                            className="h-6 w-24 text-xs px-2"
                          />
                          <button type="button" onClick={commitOther} className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"><Check className="h-3 w-3" /></button>
                          <button type="button" onClick={() => setEditingOther(false)} className="flex h-6 w-6 items-center justify-center rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"><X className="h-3 w-3" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={otherCost > 0 ? "font-semibold text-slate-900" : "text-slate-400"}>
                            {otherCost > 0 ? `₹${otherCost.toFixed(2)}` : "—"}
                          </span>
                          <button type="button" onClick={() => { setOtherDraft(String(otherCost)); setEditingOther(true); }} className="text-slate-400 hover:text-indigo-600 cursor-pointer transition"><Pencil className="h-3 w-3" /></button>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold text-slate-900">
                      <span>True Landed Cost</span>
                      <span className={trueLandedCost > 0 ? "text-emerald-700" : "text-slate-400"}>
                        {trueLandedCost > 0 ? `₹${trueLandedCost.toFixed(2)}` : basePurchasePrice === 0 ? "Add purchase bill first" : "Calculating…"}
                      </span>
                    </div>

                    {/* Manual override row */}
                    <div className="border-t border-slate-200 pt-2">
                      {!editingOverride ? (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">
                            {storedOverride > 0 ? (
                              <>Manual Override: <span className="font-bold text-amber-700">₹{storedOverride.toFixed(2)}</span></>
                            ) : "Using auto-calculated landed cost"}
                          </span>
                          <button
                            type="button"
                            onClick={() => { setEditingOverride(true); setOverrideDraft(String(storedOverride || effectiveCost)); }}
                            className="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <Pencil className="h-2.5 w-2.5" /> Modify
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number" min="0" autoFocus
                            value={overrideDraft}
                            onChange={(e) => setOverrideDraft(e.target.value)}
                            className="h-7 text-xs flex-1" placeholder="Custom cost price"
                          />
                          <button type="button" onClick={commitOverride} className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"><Check className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => setEditingOverride(false)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"><X className="h-3.5 w-3.5" /></button>
                          {storedOverride > 0 && (
                            <button type="button" onClick={clearOverride} className="text-[10px] text-rose-500 hover:text-rose-700 cursor-pointer whitespace-nowrap">Reset</button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Delta impact — only when override is active */}
                    {storedOverride > 0 && trueLandedCost > 0 && (
                      <div className={`rounded-lg px-2.5 py-2 text-[11px] font-semibold ${deltaProfitImpact >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {deltaProfitImpact >= 0
                          ? `✓ Override ₹${Math.abs(overrideDelta).toFixed(2)} lower → ₹${deltaProfitImpact.toFixed(2)} extra profit per unit`
                          : `⚠ Override ₹${Math.abs(overrideDelta).toFixed(2)} higher → ₹${Math.abs(deltaProfitImpact).toFixed(2)} less profit per unit`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Field label="GST / Tax Rate (%)">
                <Input type="number" min="0" value={listing.pricing.taxPercentage ?? 18} onChange={(e) => updateNumber("taxPercentage", e.target.value)} />
              </Field>

              <Field label="Currency">
                <Input value={listing.pricing.currency || "INR"} onChange={(e) => updateListing({ pricing: { ...listing.pricing, currency: e.target.value.toUpperCase() } })} />
              </Field>

              {(
                [
                  ["minimumPrice",    "Minimum Price (₹)"],
                  ["maximumPrice",    "Maximum Price (₹)"],
                  ["weightGrams",     "Weight (grams)"],
                  ["packageLengthCm", "Package Length (cm)"],
                  ["packageWidthCm",  "Package Width (cm)"],
                  ["packageHeightCm", "Package Height (cm)"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <Input type="number" min="0" value={listing.commercials[key] ?? ""} placeholder="—" onChange={(e) => updateCommercial(key, e.target.value)} />
                </Field>
              ))}
            </div>
          </Panel>
        </div>

        {/* ── Right col: Profitability ── */}
        <Panel title="Profitability & Unit Economics" description="Accurate margin analytics including all landed costs.">
          <div className="space-y-4">
            <div className={`rounded-2xl border p-4 ${grossProfit >= 0 ? "border-emerald-200 bg-emerald-50/50" : "border-rose-200 bg-rose-50/50"}`}>
              <span className={`text-xs font-semibold uppercase tracking-wider ${grossProfit >= 0 ? "text-emerald-800" : "text-rose-800"}`}>Net Profit / Unit</span>
              <p className={`mt-1 text-2xl font-bold ${grossProfit >= 0 ? "text-emerald-900" : "text-rose-800"}`}>₹{grossProfit.toFixed(2)}</p>
              <p className={`mt-0.5 text-xs ${grossProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>₹{sellingPrice} selling − ₹{effectiveCost.toFixed(2)} cost</p>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-800">Gross Margin</span>
              <p className="mt-1 text-2xl font-bold text-indigo-900">{grossMarginPct.toFixed(1)}%</p>
              <p className="mt-0.5 text-xs text-indigo-700">Markup on cost: {markupPct.toFixed(1)}%</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>MRP Discount:</span>
                <span className="font-semibold text-slate-800">{discountFromMrp.toFixed(0)}% OFF</span>
              </div>
              <div className="flex justify-between">
                <span>Break-Even Price:</span>
                <span className="font-semibold text-slate-800">₹{effectiveCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated GST ({taxPercentage}%):</span>
                <span className="font-semibold text-slate-800">₹{((sellingPrice * taxPercentage) / (100 + taxPercentage)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Panel>

      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import {
  IndianRupee,
  Percent,
  Receipt,
  Sparkles,
  Package,
  TrendingUp,
  Calculator,
} from "lucide-react";
import { useStudio } from "../../context/StudioContext";
import StudioField from "../../shared/StudioField";

export default function CommercialSection() {
  const { listing, setActiveWorkspace } = useStudio();

  const pricing = listing?.pricing;
  const commercials = listing?.commercials;

  const sellingPrice = Number(pricing?.sellingPrice) || 0;
  const mrp = Number(pricing?.mrp) || 0;
  const costPrice = Number(pricing?.costPrice) || 250;
  const packagingCost = 16.0; // Consumables (Box + Polybag + Tag)
  const freightCost = 5.0;
  const trueLandedCost = costPrice + packagingCost + freightCost;

  const profit = sellingPrice - trueLandedCost;
  const marginPercentage = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
  const taxPercentage = Number(pricing?.taxPercentage) || 18;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <IndianRupee className="h-4 w-4" />
            Commercials & Profitability
          </div>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            Pricing, Costs & Landed Margins
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Master pricing taking into account live purchase bills, linked packaging materials, and real unit economics.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Real Gross Margin</p>
              <h3 className="text-xl font-bold text-emerald-800">
                {marginPercentage.toFixed(1)}%
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Pricing Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Master Pricing</h3>
                <p className="text-xs text-slate-500">Channel base selling rates</p>
              </div>
            </div>

            <button
              onClick={() => setActiveWorkspace("commercials")}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Edit Pricing →
            </button>
          </div>

          <div className="space-y-4">
            <StudioField
              label="Selling Price"
              value={sellingPrice > 0 ? `₹${sellingPrice.toFixed(2)}` : "—"}
            />
            <StudioField
              label="Maximum Retail Price (MRP)"
              value={mrp > 0 ? `₹${mrp.toFixed(2)}` : "—"}
            />
            <StudioField
              label="Base Procurement Cost (Purchase Bill)"
              value={costPrice > 0 ? `₹${costPrice.toFixed(2)}` : "—"}
            />
            <StudioField
              label="GST / Tax Rate"
              value={`${taxPercentage}% GST`}
            />
          </div>
        </div>

        {/* True Landed Cost Breakdown Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">True Landed Cost (COGS)</h3>
                  <p className="text-xs text-slate-500">Purchase + Packaging + Inbound</p>
                </div>
              </div>

              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                ₹{trueLandedCost.toFixed(2)} / unit
              </span>
            </div>

            <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">1. Base Purchase Price:</span>
                <span className="font-semibold text-slate-900">₹{costPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">2. Packaging Consumables (Box + Bag):</span>
                <span className="font-semibold text-slate-900">+₹{packagingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">3. Inbound Freight:</span>
                <span className="font-semibold text-slate-900">+₹{freightCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                <span>Net Unit Profit:</span>
                <span className="text-emerald-600">₹{profit.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Weight: {commercials?.weightGrams ? `${commercials.weightGrams}g` : "350g"}</span>
            <span className="text-slate-500">Pkg: {commercials?.packageLengthCm ? `${commercials.packageLengthCm}x${commercials.packageWidthCm}x${commercials.packageHeightCm} cm` : "20x15x8 cm"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

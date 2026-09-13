"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Clock,
  HelpCircle,
  Package,
  Scale,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import CommerceSelect, { type CommerceSelectOption } from "@/components/ui/CommerceSelect";
import { useStudio } from "../../../context/StudioContext";
import { Panel, Field } from "./workspace-ui";

const HANDLING_TIME_OPTIONS: CommerceSelectOption[] = [
  { value: "1", label: "1 Business Day (Prime / Fast Dispatch Eligible)" },
  { value: "2", label: "2 Business Days (Standard Marketplace SLA)" },
  { value: "3", label: "3 Business Days (Custom / Made to Order)" },
  { value: "5", label: "5 Business Days (Heavy / Bulky Logistics)" },
];

const CONDITION_OPTIONS: CommerceSelectOption[] = [
  { value: "NEW", label: "Brand New (Factory Sealed)" },
  { value: "REFURBISHED", label: "Refurbished (Certified Working)" },
  { value: "USED_LIKE_NEW", label: "Used - Like New (Open Box)" },
];

const FULFILLMENT_OPTIONS: CommerceSelectOption[] = [
  { value: "MERCHANT_FULFILLED", label: "Merchant Fulfilled (Self-Ship / Easy Ship)" },
  { value: "MARKETPLACE_FULFILLED", label: "Marketplace Fulfilled (Amazon FBA / Flipkart Smart)" },
];

export function LogisticsWorkspace() {
  const { listing, updateListing } = useStudio();

  if (!listing) return null;

  const length = Number(listing.commercials?.packageLengthCm) || 0;
  const width = Number(listing.commercials?.packageWidthCm) || 0;
  const height = Number(listing.commercials?.packageHeightCm) || 0;
  const deadWeightGrams = Number(listing.commercials?.weightGrams) || 0;

  // Real-time domestic e-commerce volumetric calculation (cm^3 / 5000)
  const deadWeightKg = deadWeightGrams > 0 ? deadWeightGrams / 1000 : 0;
  const volumetricWeightKg = length > 0 && width > 0 && height > 0
    ? Number(((length * width * height) / 5000).toFixed(3))
    : 0;

  const billableWeightKg = Math.max(deadWeightKg, volumetricWeightKg);
  const isVolumetricHigher = volumetricWeightKg > deadWeightKg && volumetricWeightKg > 0;

  const updateCommercials = (updates: Partial<typeof listing.commercials>) => {
    updateListing({
      commercials: {
        ...listing.commercials,
        ...updates,
      },
    });
  };

  const updateIdentity = (updates: Partial<typeof listing.identity>) => {
    updateListing({
      identity: {
        ...listing.identity,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Volumetric vs Dead Weight Logistics Calculator Banner */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Scale className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-semibold">Dead (Physical) Weight</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {deadWeightGrams > 0 ? `${deadWeightGrams} g` : "—"}
            </span>
            {deadWeightKg > 0 && (
              <span className="text-xs font-medium text-slate-400">
                ({deadWeightKg.toFixed(2)} kg)
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Measured on physical weight scale</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Box className="h-4 w-4 text-violet-600" />
            <span className="text-xs font-semibold">Volumetric Weight (5000 divisor)</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-violet-700">
              {volumetricWeightKg > 0 ? `${volumetricWeightKg} kg` : "—"}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              (L×W×H / 5000)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {length > 0 && width > 0 && height > 0
              ? `${length} × ${width} × ${height} cm³`
              : "Enter L, W, H dimensions below"}
          </p>
        </div>

        <div className={`rounded-2xl border p-5 shadow-2xs ${
          isVolumetricHigher
            ? "border-amber-200 bg-amber-50/70"
            : "border-emerald-200 bg-emerald-50/70"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Truck className={`h-4 w-4 ${isVolumetricHigher ? "text-amber-600" : "text-emerald-600"}`} />
            <span className="text-xs font-bold text-slate-900">Marketplace Billable Weight</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${isVolumetricHigher ? "text-amber-800" : "text-emerald-800"}`}>
              {billableWeightKg > 0 ? `${billableWeightKg.toFixed(2)} kg` : "—"}
            </span>
            <span className="text-xs font-semibold text-slate-600">
              ({isVolumetricHigher ? "Billed on Volume" : "Billed on Dead Weight"})
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {isVolumetricHigher
              ? "⚠️ Package volume is higher than weight. Consider smaller packaging box to save freight!"
              : "✓ Efficient packaging. Courier charges based on dead weight."}
          </p>
        </div>
      </div>

      {/* Package Dimensions & Weight */}
      <Panel
        title="Packaging & Shipping Dimensions"
        description="Marketplace couriers (Amazon Easy Ship, FBA, Ekart, Delhivery) compute shipping fees based on these dimensions."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Package Length (cm)" hint="Outer box length">
            <Input
              type="number"
              min="0.1"
              step="0.1"
              placeholder="e.g. 20"
              value={listing.commercials?.packageLengthCm ?? ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateCommercials({ packageLengthCm: val > 0 ? Number(val.toFixed(2)) : undefined });
              }}
            />
          </Field>

          <Field label="Package Width (cm)" hint="Outer box width">
            <Input
              type="number"
              min="0.1"
              step="0.1"
              placeholder="e.g. 15"
              value={listing.commercials?.packageWidthCm ?? ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateCommercials({ packageWidthCm: val > 0 ? Number(val.toFixed(2)) : undefined });
              }}
            />
          </Field>

          <Field label="Package Height (cm)" hint="Outer box height">
            <Input
              type="number"
              min="0.1"
              step="0.1"
              placeholder="e.g. 8"
              value={listing.commercials?.packageHeightCm ?? ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateCommercials({ packageHeightCm: val > 0 ? Number(val.toFixed(2)) : undefined });
              }}
            />
          </Field>

          <Field label="Package Gross Weight (grams)" hint="Product + Packaging">
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 350"
              value={listing.commercials?.weightGrams ?? ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateCommercials({ weightGrams: val > 0 ? Math.round(val) : undefined });
              }}
            />
          </Field>
        </div>
      </Panel>

      {/* Fulfillment, SLA & Listing Exemption */}
      <Panel
        title="Fulfillment & Marketplace Listing Conditions"
        description="Configure dispatch lead time, condition guidelines, and barcode GTIN exemption."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {/* Dispatch SLA */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              Dispatch Handling Time (SLA)
            </label>
            <CommerceSelect
              options={HANDLING_TIME_OPTIONS}
              value={String(listing.identity?.handlingTimeDays || "2")}
              onChange={(val: string) => updateIdentity({ handlingTimeDays: Number(val) || 2 })}
              placeholder="Select Dispatch SLA"
            />
            <p className="text-[11px] text-slate-400">
              Orders must be shipped within this SLA to maintain 100% marketplace account health.
            </p>
          </div>

          {/* Condition Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
              Product Condition
            </label>
            <CommerceSelect
              options={CONDITION_OPTIONS}
              value={listing.identity?.conditionType || "NEW"}
              onChange={(val: string) => updateIdentity({ conditionType: val as any })}
              placeholder="Select Condition"
            />
            <p className="text-[11px] text-slate-400">
              Mandatory attribute on Amazon, Flipkart, and eBay.
            </p>
          </div>

          {/* Fulfillment Channel */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-slate-500" />
              Fulfillment Channel
            </label>
            <CommerceSelect
              options={FULFILLMENT_OPTIONS}
              value={listing.commercials?.fulfillmentChannel || "MERCHANT_FULFILLED"}
              onChange={(val: string) => updateCommercials({ fulfillmentChannel: val as any })}
              placeholder="Select Fulfillment Mode"
            />
            <p className="text-[11px] text-slate-400">
              Controls whether listing connects to warehouse inventory or FBA / Flipkart Smart warehouse.
            </p>
          </div>

          {/* Item Package Quantity / Pack of */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-slate-500" />
              Item Package Quantity (IPQ / Pack of)
            </label>
            <Input
              type="number"
              min="1"
              placeholder="1"
              value={listing.identity?.itemPackageQuantity ?? 1}
              onChange={(e) => updateIdentity({ itemPackageQuantity: Math.max(1, Number(e.target.value) || 1) })}
              className="h-10 text-sm"
            />
            <p className="text-[11px] text-slate-400">
              Number of units included in single order (e.g. 1 for single piece, 2 for Pack of 2).
            </p>
          </div>
        </div>

        {/* GTIN / Barcode Exemption Toggle */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  GTIN / Barcode Exemption (List without Barcode)
                </span>
                {listing.identity?.isGtinExempt && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" /> Exemption Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 max-w-xl">
                Enable this if you have an approved Brand GTIN Exemption from Amazon or Flipkart. This allows listing your branded/handcrafted products without purchasing GS1 EAN/UPC barcodes.
              </p>
            </div>
            <Switch
              checked={Boolean(listing.identity?.isGtinExempt)}
              onCheckedChange={(checked) => updateIdentity({ isGtinExempt: checked })}
            />
          </div>
        </div>
      </Panel>
    </div>
  );
}

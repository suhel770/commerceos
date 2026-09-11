"use client";

import {
  Building2,
  Hash,
  Package,
  ShieldCheck,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import CommerceSelect, { type CommerceSelectOption } from "@/components/ui/CommerceSelect";
import {
  ListingStatus,
  type ProductIdentity,
} from "@/lib/types/master-listing";

import { useStudio } from "../../context/StudioContext";

type EditableIdentityKey = Exclude<keyof ProductIdentity, "id">;

const STATUS_OPTIONS: CommerceSelectOption[] = Object.values(ListingStatus).map((status) => ({
  value: status,
  label: status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " "),
}));

export default function IdentitySection() {
  const { listing, updateListing } = useStudio();

  if (!listing) {
    return null;
  }

  const updateIdentity = (key: EditableIdentityKey, value: string) => {
    updateListing({
      identity: {
        ...listing.identity,
        [key]: value,
      },
    });
  };

  return (
    <div className="grid gap-3.5 lg:grid-cols-2">
      {/* 1. Core Product Information */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-slate-100">
          <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Product Information</h3>
            <p className="text-[11px] text-slate-400 font-medium">Core title, branding and category mapping</p>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={listing.identity.productName || ""}
              onChange={(e) => updateIdentity("productName", e.target.value)}
              placeholder="e.g. Kids Sandal - Pink"
              className="h-8.5 text-xs rounded-xl bg-white border-slate-200"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Short Name
            </label>
            <Input
              value={listing.identity.shortName || ""}
              onChange={(e) => updateIdentity("shortName", e.target.value)}
              placeholder="Customer-friendly concise name"
              className="h-8.5 text-xs rounded-xl bg-white border-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Brand <span className="text-rose-500">*</span>
            </label>
            <Input
              value={listing.identity.brand || ""}
              onChange={(e) => updateIdentity("brand", e.target.value)}
              placeholder="e.g. Acme"
              className="h-8.5 text-xs rounded-xl bg-white border-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <Input
              value={listing.identity.category || ""}
              onChange={(e) => updateIdentity("category", e.target.value)}
              placeholder="e.g. Footwear"
              className="h-8.5 text-xs rounded-xl bg-white border-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Sub-category
            </label>
            <Input
              value={listing.identity.subCategory || ""}
              onChange={(e) => updateIdentity("subCategory", e.target.value)}
              placeholder="e.g. Sandals"
              className="h-8.5 text-xs rounded-xl bg-white border-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Product Type
            </label>
            <Input
              value={listing.identity.productType || ""}
              onChange={(e) => updateIdentity("productType", e.target.value)}
              placeholder="e.g. Casual"
              className="h-8.5 text-xs rounded-xl bg-white border-slate-200"
            />
          </div>
        </div>
      </section>

      {/* 2. Identifiers, Status & Compliance */}
      <div className="flex flex-col gap-3.5">
        {/* Identifiers & Status Card */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex-1">
          <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Hash className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Identifiers & Lifecycle</h3>
                <p className="text-[11px] text-slate-400 font-medium">SKU, barcodes and publishing status</p>
              </div>
            </div>

            <div className="w-36">
              <CommerceSelect
                value={listing.status}
                options={STATUS_OPTIONS}
                onChange={(val) => updateListing({ status: val as ListingStatus })}
                size="sm"
                searchable={false}
              />
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Master SKU <span className="text-rose-500">*</span>
              </label>
              <Input
                value={listing.identity.sku || ""}
                onChange={(e) => updateIdentity("sku", e.target.value)}
                placeholder="SKU-XXXX"
                className="h-8.5 text-xs font-mono rounded-xl bg-white border-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Barcode
              </label>
              <Input
                value={listing.identity.barcode || ""}
                onChange={(e) => updateIdentity("barcode", e.target.value)}
                placeholder="Scan or enter barcode"
                className="h-8.5 text-xs font-mono rounded-xl bg-white border-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                GTIN / UPC
              </label>
              <Input
                value={listing.identity.gtin || listing.identity.upc || ""}
                onChange={(e) => updateIdentity("gtin", e.target.value)}
                placeholder="Global Trade Item Number"
                className="h-8.5 text-xs font-mono rounded-xl bg-white border-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Variant Group ID
              </label>
              <Input
                value={listing.identity.variantGroupId || ""}
                onChange={(e) => updateIdentity("variantGroupId", e.target.value)}
                placeholder="Optional group ID"
                className="h-8.5 text-xs font-mono rounded-xl bg-white border-slate-200"
              />
            </div>
          </div>
        </section>

        {/* Compliance Mini Card */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-slate-100">
            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Manufacturer & Tax</h3>
              <p className="text-[11px] text-slate-400 font-medium">HSN, tax code and manufacturer origin</p>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Manufacturer
              </label>
              <Input
                value={listing.identity.manufacturer || ""}
                onChange={(e) => updateIdentity("manufacturer", e.target.value)}
                placeholder="Manufacturer name"
                className="h-8.5 text-xs rounded-xl bg-white border-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                HSN Code
              </label>
              <Input
                value={listing.identity.hsn || ""}
                onChange={(e) => updateIdentity("hsn", e.target.value)}
                placeholder="e.g. 640419"
                className="h-8.5 text-xs font-mono rounded-xl bg-white border-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Tax Code
              </label>
              <Input
                value={listing.identity.taxCode || ""}
                onChange={(e) => updateIdentity("taxCode", e.target.value)}
                placeholder="e.g. 18% GST"
                className="h-8.5 text-xs font-mono rounded-xl bg-white border-slate-200"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

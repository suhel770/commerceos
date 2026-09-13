"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Copy,
  Cpu,
  Hash,
  Info,
  Layers,
  Package,
  Plus,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  Wrench,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import CommerceSelect, { type CommerceSelectOption } from "@/components/ui/CommerceSelect";
import {
  ListingStatus,
  MarketplaceName,
  type ProductIdentity,
} from "@/lib/types/master-listing";
import { brandApprovalService } from "@/lib/services/brand-approval.service";
import BrandApprovalModal from "../../components/dialogs/BrandApprovalModal";
import {
  getCategorySpecs,
  type InventoryTrackingMode,
} from "@/lib/marketplace/specifications/category-specs.service";

import { useStudio } from "../../context/StudioContext";

type EditableIdentityKey = Exclude<keyof ProductIdentity, "id">;

const STATUS_OPTIONS: CommerceSelectOption[] = Object.values(ListingStatus).map((status) => ({
  value: status,
  label: status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " "),
}));

const CONDITION_OPTIONS: CommerceSelectOption[] = [
  { value: "NEW", label: "Brand New (Factory Sealed)" },
  { value: "REFURBISHED", label: "Refurbished (Certified Working)" },
  { value: "USED_LIKE_NEW", label: "Used - Like New (Open Box)" },
];

const TRACKING_MODE_OPTIONS: CommerceSelectOption[] = [
  {
    value: "STANDARD",
    label: "Standard Quantity (Piece Count)",
  },
  {
    value: "SERIAL_NUMBER",
    label: "Serial Number / IMEI (Unit-Level)",
  },
  {
    value: "BATCH_LOT",
    label: "Batch / Lot (Mfg & Expiry)",
  },
];

const SUB_CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  electronics: ["Smartphones", "Laptops & Computers", "Cables & Adapters", "Power Banks", "TWS Earbuds", "Smartwatches", "Bluetooth Speakers"],
  mobile: ["Smartphones", "Feature Phones", "Refurbished Phones", "Foldable Phones"],
  phone: ["Smartphones", "Feature Phones", "Refurbished Phones", "Foldable Phones"],
  laptop: ["Thin & Light Laptops", "Gaming Laptops", "Business Laptops", "MacBooks", "2-in-1 Touch Laptops"],
  computer: ["Laptops", "Desktop PCs", "All-in-One PCs", "Monitors & Displays"],
  cable: ["Type-C to Type-C", "USB-A to Type-C", "Fast Charging 65W Cable", "Type-C to Lightning", "3-in-1 Cable"],
  charger: ["65W GaN Charger", "20W PD Adapter", "Dual Port Fast Charger", "Wireless Charger"],
  powerbank: ["10,000 mAh Power Bank", "20,000 mAh Fast Charge", "65W Laptop Power Bank", "MagSafe Wireless Battery"],
  audio: ["TWS Earbuds", "Over-Ear Headphones", "Neckbands", "Bluetooth Speakers", "Party Speakers"],
  earbud: ["Noise Cancelling TWS", "Gaming Earbuds", "Bass Boost TWS", "Sports Wireless Earbuds"],
  headphone: ["Over-Ear Studio Headphones", "Wireless ANC Headphones", "Gaming Headset with Mic"],
  smartwatch: ["Bluetooth Calling Watch", "Fitness Tracker", "Kids Smartwatch", "GPS Sports Watch", "AMOLED Smartwatch"],
  watch: ["Bluetooth Calling Watch", "Fitness Tracker", "Kids Smartwatch", "Analog Watch", "Digital Watch"],
  footwear: ["Sandals", "Sneakers", "Clogs & Slides", "Formal Shoes", "Boots", "Flats & Loafers", "Heels", "Slippers"],
  shoes: ["Sandals", "Sneakers", "Clogs & Slides", "Formal Shoes", "Boots", "Flats & Loafers", "Heels", "Slippers"],
  sandal: ["Kids Sandals", "Flat Sandals", "Heeled Sandals", "Gladiators"],
  clog: ["Kids Clogs", "Garden Clogs", "Mules & Slides"],
  jewelry: ["Rings", "Necklaces", "Earrings", "Bracelets & Bangles", "Pendants", "Anklets", "Brooches"],
  jewellery: ["Rings", "Necklaces", "Earrings", "Bracelets & Bangles", "Pendants", "Anklets", "Brooches"],
  ring: ["Solitaire Rings", "Band Rings", "Cocktail Rings", "Engagement Rings"],
  necklace: ["Chains", "Chokers", "Pendants", "Layered Necklaces"],
  apparel: ["T-Shirts", "Shirts", "Dresses", "Jeans", "Trousers & Pants", "Kurtas & Ethnic", "Jackets & Hoodies", "Shorts"],
  clothing: ["T-Shirts", "Shirts", "Dresses", "Jeans", "Trousers & Pants", "Kurtas & Ethnic", "Jackets & Hoodies", "Shorts"],
  bags: ["Backpacks", "Handbags", "Wallets", "Luggage & Suitcases", "Totes & Clutches", "Duffel Bags"],
  beauty: ["Skincare Serum", "Moisturizer", "Face Wash", "Haircare", "Makeup", "Fragrances & Perfumes"],
  home: ["Cookware", "Bedding & Linen", "Home Decor", "Kitchen Storage", "Dinnerware"],
  kids: ["Kids Footwear", "Kids Clothing", "Baby Gear", "Toys & Games"],
};

export default function IdentitySection() {
  const { listing, updateListing, product, updateAttribute, removeAttribute, setActiveWorkspace } = useStudio();
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [brandRecordVer, setBrandRecordVer] = useState(0);

  // Custom specification creation state
  const [addingCustom, setAddingCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customVal, setCustomVal] = useState("");

  useEffect(() => {
    const handleUpdate = () => {
      setBrandRecordVer((v) => v + 1);
    };
    window.addEventListener("commerceos_brand_approval_updated", handleUpdate);
    return () => {
      window.removeEventListener("commerceos_brand_approval_updated", handleUpdate);
    };
  }, []);

  if (!listing) {
    return null;
  }

  const currentBrand = listing.identity.brand || "";
  const brandRecord = brandApprovalService.getBrandRecord(currentBrand);

  const currentCategory = (listing.identity.category || "").toLowerCase();
  const currentSubCategory = listing.identity.subCategory || "";
  const titleLength = (listing.identity.productName || "").length;

  // Category specifications configuration
  const categoryConfig = useMemo(() => {
    return getCategorySpecs(listing.identity.category, listing.identity.subCategory);
  }, [listing.identity.category, listing.identity.subCategory]);

  const activeTrackingMode: InventoryTrackingMode =
    listing.identity.trackingMode || categoryConfig.defaultTrackingMode;

  const dynamicSuggestions = useMemo(() => {
    for (const [key, suggestions] of Object.entries(SUB_CATEGORY_SUGGESTIONS)) {
      if (currentCategory.includes(key)) {
        return suggestions;
      }
    }
    return ["Smartwatches", "Sandals", "Sneakers", "Clogs & Slides", "T-Shirts", "Rings", "Necklaces", "Backpacks"];
  }, [currentCategory]);

  const updateIdentity = (key: EditableIdentityKey, value: any) => {
    updateListing({
      identity: {
        ...listing.identity,
        [key]: value,
      },
    });
  };

  const getAttributeValue = (key: string): string => {
    const attr = listing.attributes?.find((a) => a.key === key);
    return attr?.value !== undefined && attr?.value !== null ? String(attr.value) : "";
  };

  const handleSpecChange = (key: string, label: string, group: string, value: string) => {
    const existingAttr = listing.attributes?.find((a) => a.key === key);
    updateAttribute({
      id: existingAttr?.id || crypto.randomUUID(),
      key,
      label,
      value,
      group: group || "technical",
      searchable: true,
      filterable: true,
    });
  };

  const handleAddCustom = () => {
    if (!customLabel.trim()) return;
    const cleanKey = customLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
    handleSpecChange(cleanKey, customLabel.trim(), "custom", customVal.trim());
    setCustomLabel("");
    setCustomVal("");
    setAddingCustom(false);
  };

  const standardKeys = useMemo(
    () => new Set(categoryConfig.specifications.map((s) => s.key)),
    [categoryConfig.specifications]
  );

  const customAttributes = useMemo(
    () => (listing.attributes || []).filter((a) => !standardKeys.has(a.key) && a.group === "custom"),
    [listing.attributes, standardKeys]
  );

  return (
    <div className="space-y-3.5">
      <div className="grid gap-3.5 lg:grid-cols-2">
        {/* ----------------------------------------------------------------- */}
        {/* COLUMN 1: Product Information & Dynamic Category Specifications */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex flex-col gap-3.5">
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
              {/* Marketplace Listing Title (SEO / Public) */}
              <div className="sm:col-span-2 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <span>Marketplace Listing Title (SEO / Public)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">
                      Amazon max: 200 • Flipkart max: 150
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md border ${
                        titleLength > 200
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : titleLength > 150
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {titleLength} / 200 chars
                    </span>
                  </div>
                </div>
                <Textarea
                  value={listing.identity.productName || ""}
                  onChange={(e) => updateIdentity("productName", e.target.value)}
                  placeholder="e.g. LilWalk Dinosaur Kids Clogs or Boat Wave Call 2 Smartwatch with Bluetooth Calling (1.83 HD, Black)"
                  rows={2}
                  className="text-xs rounded-xl bg-white border-slate-200 font-medium leading-relaxed resize-none"
                />
                {titleLength > 200 && (
                  <p className="text-[10px] text-rose-600 font-medium">
                    ⚠️ Title exceeds Amazon&apos;s 200 character limit. Amazon listings may be suppressed.
                  </p>
                )}
                {titleLength > 150 && titleLength <= 200 && (
                  <p className="text-[10px] text-amber-600 font-medium">
                    ℹ️ Title is within Amazon limit (200), but Flipkart will truncate titles over 150 characters.
                  </p>
                )}
              </div>

              {/* Internal / Purchase Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Purchase / Internal Name
                  </label>
                  {product?.name && product.name !== listing.identity.productName && (
                    <button
                      type="button"
                      onClick={() => updateIdentity("productName", product.name)}
                      className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Copy purchase bill name into marketplace title"
                    >
                      <Copy className="h-2.5 w-2.5" />
                      Copy to Title
                    </button>
                  )}
                </div>
                <Input
                  value={product?.name || listing.identity.shortName || ""}
                  readOnly
                  className="h-8.5 text-xs rounded-xl bg-slate-50 border-slate-200 text-slate-600 font-medium cursor-default"
                  title="Original product name recorded on purchase bill / inventory ledger"
                />
              </div>

              {/* Short Name (POS & Labels) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Short Name (Receipts & Labels)
                </label>
                <Input
                  value={listing.identity.shortName || ""}
                  onChange={(e) => updateIdentity("shortName", e.target.value)}
                  placeholder="Customer-friendly concise name"
                  className="h-8.5 text-xs rounded-xl bg-white border-slate-200 font-medium"
                />
              </div>

              {/* Brand Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700">
                    Brand <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setBrandModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200/90 text-[11px] font-semibold text-slate-700 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                    <span>
                      {brandRecord.isGeneric
                        ? "Generic Mode"
                        : `${Object.values(brandRecord.channels).filter((c) => c.status === "APPROVED" || c.status === "NOT_REQUIRED").length}/${Object.keys(brandRecord.channels).length} Cleared`}
                    </span>
                    <span className="text-[10px] text-slate-400">▾</span>
                  </button>
                </div>
                <Input
                  value={listing.identity.brand || ""}
                  onChange={(e) => updateIdentity("brand", e.target.value)}
                  placeholder="e.g. Acme or Boat"
                  className="h-8.5 text-xs rounded-xl bg-white border-slate-200 font-medium"
                />
                <div
                  onClick={() => setBrandModalOpen(true)}
                  className="flex items-center justify-between pt-0.5 px-0.5 cursor-pointer group text-[11px]"
                  title="Click to manage Brand Authorizations"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${
                        brandRecord.isGeneric ||
                        Object.values(brandRecord.channels).every(
                          (c) => c.status === "APPROVED" || c.status === "NOT_REQUIRED" || c.status === "GENERIC_EXEMPTION"
                        )
                          ? "bg-emerald-500 ring-2 ring-emerald-100"
                          : "bg-amber-500 ring-2 ring-amber-100"
                      }`}
                    />
                    <span className="text-slate-500 group-hover:text-slate-800 transition-colors font-medium truncate text-[11px]">
                      {brandRecord.isGeneric
                        ? "Generic Exemption active"
                        : Object.values(brandRecord.channels).some((c) => c.status === "ACTION_REQUIRED")
                        ? `${Object.values(brandRecord.channels).filter((c) => c.status === "ACTION_REQUIRED").length} channel action required`
                        : "All marketplace authorizations cleared"}
                    </span>
                  </div>
                  <span className="text-blue-600 group-hover:text-blue-700 font-semibold text-[10px] shrink-0 pl-2">
                    Manage Clearance &rarr;
                  </span>
                </div>
              </div>

              {/* Category Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/80">
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                    <span>Auto-Synced</span>
                  </span>
                </div>
                <Input
                  value={listing.identity.category || ""}
                  onChange={(e) => updateIdentity("category", e.target.value)}
                  placeholder="e.g. Electronics, Footwear, Jewelry, Apparel..."
                  className="h-8.5 text-xs rounded-xl bg-white border-slate-200 font-medium"
                />
              </div>

              {/* Sub-category / Product Leaf Field */}
              <div className="sm:col-span-2 space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700">
                    Sub-category / Product Leaf <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Leaf-level mapping for Amazon node & Flipkart vertical
                  </span>
                </div>
                <Input
                  value={listing.identity.subCategory || ""}
                  onChange={(e) => updateIdentity("subCategory", e.target.value)}
                  placeholder="e.g. Smartwatches, Sandals, Clogs, Rings, T-Shirts..."
                  className="h-8.5 text-xs rounded-xl bg-white border-slate-200 font-medium"
                />
                {/* Dynamic 1-Click Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mr-0.5">
                    <Sparkles className="h-2.5 w-2.5 text-blue-500" />
                    Leaf Suggestions:
                  </span>
                  {dynamicSuggestions.map((sug) => {
                    const isSelected = currentSubCategory.toLowerCase() === sug.toLowerCase();
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => updateIdentity("subCategory", sug)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                            : "bg-slate-50 text-slate-600 border-slate-200/90 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        {sug}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* 2. Category-Specific Specifications Card */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">Category Specifications</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                      {categoryConfig.badgeLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Marketplace-ready specifications dynamically adapted for {categoryConfig.displayName}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                {categoryConfig.specifications.length} fields
              </span>
            </div>

            <div className="space-y-3.5">
              {categoryConfig.specifications.map((spec) => {
                const val = getAttributeValue(spec.key);
                return (
                  <div key={spec.key} className="space-y-1.5 p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <span>{spec.label}</span>
                        {spec.required && <span className="text-rose-500">*</span>}
                      </label>
                      {spec.description && (
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[220px]">
                          {spec.description}
                        </span>
                      )}
                    </div>

                    <Input
                      value={val}
                      onChange={(e) => handleSpecChange(spec.key, spec.label, spec.group, e.target.value)}
                      placeholder={spec.placeholder}
                      className="h-8 text-xs rounded-lg bg-white border-slate-200 font-medium"
                    />

                    {/* Quick suggestion chips */}
                    {spec.suggestions?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[9px] font-bold text-slate-400 mr-0.5">Quick Fill:</span>
                        {spec.suggestions.map((sug) => {
                          const isPicked = val === sug;
                          return (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => handleSpecChange(spec.key, spec.label, spec.group, sug)}
                              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md border transition-all cursor-pointer ${
                                isPicked
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                            >
                              {sug}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {customAttributes.length > 0 && (
                <div className="pt-2 border-t border-slate-200/70 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Custom Specifications
                  </span>
                  {customAttributes.map((attr) => (
                    <div
                      key={attr.key}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/70"
                    >
                      <div className="flex-1 min-w-0">
                        <label className="text-[10px] font-bold text-slate-700 block truncate">
                          {attr.label}
                        </label>
                        <Input
                          value={String(attr.value ?? "")}
                          onChange={(e) => handleSpecChange(attr.key, attr.label, "custom", e.target.value)}
                          className="h-7 text-xs bg-white mt-0.5"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttribute(attr.key)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer mt-3"
                        title="Remove custom specification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Custom Field Inline Creator */}
              {addingCustom ? (
                <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-900">Add Custom Specification</span>
                    <button
                      type="button"
                      onClick={() => setAddingCustom(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="Field Name (e.g. Flight Time, Solar Capacity)"
                      className="h-8 text-xs bg-white"
                    />
                    <Input
                      value={customVal}
                      onChange={(e) => setCustomVal(e.target.value)}
                      placeholder="Value (e.g. 40 Minutes, 100W)"
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setAddingCustom(false)}
                      className="px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 rounded-md cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCustom}
                      disabled={!customLabel.trim()}
                      className="px-3 py-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md shadow-2xs cursor-pointer"
                    >
                      Add Field
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setAddingCustom(true)}
                    className="w-full py-1.5 border border-dashed border-slate-300 hover:border-blue-400 rounded-xl text-[11px] font-bold text-slate-600 hover:text-blue-600 flex items-center justify-center gap-1.5 transition-all bg-white hover:bg-blue-50/30 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Custom Specification Field</span>
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* COLUMN 2: Identifiers, Hardware & Serial Policy, Compliance       */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex flex-col gap-3.5">
          {/* 3. Identifiers & Lifecycle Card */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
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
                  className="h-8.5 text-xs font-mono rounded-xl bg-white border-slate-200 font-semibold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Master Barcode / EAN
                  </label>
                  {listing.identity.isGtinExempt ? (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200" title="Channel exemption requested on marketplaces">
                      Channel Exempt
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">GS1/Standard</span>
                  )}
                </div>
                <Input
                  value={listing.identity.barcode || ""}
                  onChange={(e) => updateIdentity("barcode", e.target.value)}
                  placeholder="Scan EAN, UPC, or store barcode"
                  className="h-8.5 text-xs font-mono rounded-xl bg-white border-slate-200"
                />
              </div>

              {/* GTIN Exemption Marketplace Request Toggle */}
              <div className="sm:col-span-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-800">
                      Marketplace GTIN Exemption
                    </span>
                    {listing.identity.isGtinExempt && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                        Requested / Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Enable if listing private-label or handcrafted items on Amazon/Flipkart under brand exemption without purchasing GS1 barcodes.
                  </p>
                </div>
                <Switch
                  checked={Boolean(listing.identity.isGtinExempt)}
                  onCheckedChange={(checked) => updateIdentity("isGtinExempt", checked)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Condition <span className="text-rose-500">*</span>
                </label>
                <CommerceSelect
                  value={listing.identity.conditionType || "NEW"}
                  options={CONDITION_OPTIONS}
                  onChange={(val) => updateIdentity("conditionType", val as any)}
                  size="sm"
                  searchable={false}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Item Package Quantity (Pack of)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={listing.identity.itemPackageQuantity ?? 1}
                  onChange={(e) => updateIdentity("itemPackageQuantity", Math.max(1, Number(e.target.value) || 1))}
                  placeholder="1"
                  className="h-8.5 text-xs font-mono rounded-xl bg-white border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  GTIN / UPC (Global)
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

              {/* Packaging & Shipping Quick Reference */}
              <div
                onClick={() => setActiveWorkspace("logistics")}
                className="sm:col-span-2 flex items-center justify-between p-2 rounded-xl bg-sky-50/70 border border-sky-200/80 text-sky-950 cursor-pointer hover:bg-sky-100/60 transition-colors"
                title="Click to manage Package Dimensions & Volumetric Weight"
              >
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-sky-700 shrink-0" />
                  <span className="text-[11px] font-bold">
                    Packaging:{" "}
                    {listing.commercials?.packageLengthCm && listing.commercials?.packageWidthCm && listing.commercials?.packageHeightCm
                      ? `${listing.commercials.packageLengthCm}×${listing.commercials.packageWidthCm}×${listing.commercials.packageHeightCm} cm • Volumetric: ${((listing.commercials.packageLengthCm * listing.commercials.packageWidthCm * listing.commercials.packageHeightCm) / 5000).toFixed(2)} kg`
                      : "Not Configured (Default Courier Tiers Apply)"}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-sky-700 hover:underline">
                  Configure Dimensions &rarr;
                </span>
              </div>
            </div>
          </section>

          {/* 4. Hardware Identifiers & Serial / Inventory Policy */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Hardware & Serial Tracking Policy</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Model details, warranty and unit-level serial inventory
                  </p>
                </div>
              </div>

              <div className="w-52">
                <CommerceSelect
                  value={activeTrackingMode}
                  options={TRACKING_MODE_OPTIONS}
                  onChange={(val) => updateIdentity("trackingMode", val as InventoryTrackingMode)}
                  size="sm"
                  searchable={false}
                />
              </div>
            </div>

            {/* Tracking Policy Banner */}
            <div
              className={`mb-3 p-3 rounded-xl border text-[11px] leading-relaxed ${
                activeTrackingMode === "SERIAL_NUMBER"
                  ? "bg-blue-50/80 border-blue-200 text-blue-900"
                  : activeTrackingMode === "BATCH_LOT"
                  ? "bg-purple-50/80 border-purple-200 text-purple-900"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <div className="flex items-start gap-2">
                {activeTrackingMode === "SERIAL_NUMBER" ? (
                  <Radio className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                ) : activeTrackingMode === "BATCH_LOT" ? (
                  <ShieldAlert className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">
                    {activeTrackingMode === "SERIAL_NUMBER"
                      ? "🛡️ Serial Number / IMEI Tracking Policy Active"
                      : activeTrackingMode === "BATCH_LOT"
                      ? "🧪 Batch & Lot Expiry Tracking Policy Active"
                      : "📦 Standard Quantity Inventory Mode Active"}
                  </p>
                  <p className="text-[10px] mt-0.5 opacity-90">
                    {activeTrackingMode === "SERIAL_NUMBER"
                      ? "Every physical unit's unique Serial/IMEI barcode will be scanned during Purchase Inward (GRN) and Marketplace Dispatch. Protects against customer return fraud and manages warranty claims."
                      : activeTrackingMode === "BATCH_LOT"
                      ? "Batch Number, Manufacturing Date, and Expiry Date tracking are enforced during inward and fulfillment for regulatory safety."
                      : "Standard piece count tracking per SKU. Recommended for non-electronic apparel and footwear items."}
                  </p>
                </div>
              </div>
            </div>

            {/* Hardware Fields Grid */}
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Model Number / Style Code {categoryConfig.hardwareFieldsRequired && <span className="text-rose-500">*</span>}
                </label>
                <Input
                  value={listing.identity.modelNumber || ""}
                  onChange={(e) => updateIdentity("modelNumber", e.target.value)}
                  placeholder="e.g. A2984 or SW-02"
                  className="h-8.5 text-xs font-mono rounded-xl bg-white border-slate-200 font-semibold"
                />
                <span className="text-[9px] text-slate-400 mt-0.5 block">
                  Crucial for Amazon ASIN match & Flipkart vertical specs
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Model Name
                </label>
                <Input
                  value={listing.identity.modelName || ""}
                  onChange={(e) => updateIdentity("modelName", e.target.value)}
                  placeholder="e.g. Wave Call 2 or Watch Ultra"
                  className="h-8.5 text-xs rounded-xl bg-white border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Manufacturer Part No. (MPN)
                </label>
                <Input
                  value={listing.identity.mpn || ""}
                  onChange={(e) => updateIdentity("mpn", e.target.value)}
                  placeholder="e.g. MPN-88219"
                  className="h-8.5 text-xs font-mono rounded-xl bg-white border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Warranty Coverage
                </label>
                <Input
                  value={listing.identity.warrantyPeriod || ""}
                  onChange={(e) => updateIdentity("warrantyPeriod", e.target.value)}
                  placeholder="e.g. 1 Year Domestic Brand Warranty"
                  className="h-8.5 text-xs rounded-xl bg-white border-slate-200"
                />
                <div className="flex items-center gap-1 mt-1">
                  {["1 Year Brand", "6 Months", "2 Years", "No Warranty"].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => updateIdentity("warrantyPeriod", w)}
                      className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 5. Compliance & Manufacturer Mini Card */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-slate-100">
              <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Manufacturer & Tax Details</h3>
                <p className="text-[11px] text-slate-400 font-medium">HSN, tax code and manufacturer identity</p>
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
                  placeholder="e.g. 851762 / 640419"
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

      <BrandApprovalModal
        open={brandModalOpen}
        brandName={currentBrand}
        connectedMarketplaces={listing.marketplaces?.map((m) => m.marketplace)}
        onClose={() => setBrandModalOpen(false)}
        onBrandUpdated={(b) => updateIdentity("brand", b)}
      />
    </div>
  );
}

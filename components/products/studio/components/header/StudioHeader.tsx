"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Copy,
  Check,
  Loader2,
  Rocket,
  Save,
  MoreHorizontal,
  MoreVertical,
  Camera,
  Pencil,
  Tag,
  Building2,
  FileText,
  Percent,
  IndianRupee,
  ShoppingBag,
  Layers,
  Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStudio } from "../../context/StudioContext";
import { getProductSlug } from "@/lib/products/slug";
import { ListingStatus } from "@/lib/types/master-listing";
import TopMetadataStrip from "@/components/products/workspace/hero/TopMetadataStrip";
import { computePublishingScore } from "@/lib/studio/workspace-metrics";

function formatListingStatus(status: ListingStatus): string {
  switch (status) {
    case ListingStatus.DRAFT:
      return "Draft";
    case ListingStatus.READY:
      return "Ready";
    case ListingStatus.PUBLISHED:
      return "Active";
    case ListingStatus.PARTIALLY_PUBLISHED:
      return "Partial";
    case ListingStatus.FAILED:
      return "Failed";
    case ListingStatus.ARCHIVED:
      return "Archived";
    default:
      return "Active";
  }
}

export default function StudioHeader() {
  const searchParams = useSearchParams();
  const fromUrl = searchParams?.get("from");

  const {
    product,
    listing,
    activeWorkspace,
    validating,
    saving,
    publishing,
    save,
    validate,
    publish,
    setActiveWorkspace,
  } = useStudio();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const realImages = useMemo(() => {
    const all = [product.image, ...(product.gallery ?? [])].filter(
      (img): img is string =>
        typeof img === "string" &&
        img.trim().length > 0 &&
        img !== "{}" &&
        !img.includes("placeholder.png")
    );
    return Array.from(new Set(all));
  }, [product.gallery, product.image]);

  if (!listing) {
    return null;
  }

  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    }
  };

  const statusLabel = formatListingStatus(listing.status);

  const currentImage = realImages[selectedImageIndex] || realImages[0];
  const barcodeValue = product.barcode || (product as any).gtin || "—";
  const productIdValue = product.productId || product.id || "—";
  const categoryValue = listing.identity.category || product.category || "—";
  const brandValue = listing.identity.brand || product.brand || "—";
  const hsnValue = product.hsn || "—";
  const taxValue = product.gstRate !== undefined && Number(product.gstRate) > 0 ? `${product.gstRate}% GST` : "—";
  const costPrice = Number(listing.pricing?.costPrice || product.pricing?.costPrice || 0);
  const sellingPrice = Number(listing.pricing?.sellingPrice || product.pricing?.sellingPrice || 0);
  const costPriceValue = costPrice > 0 ? `₹${costPrice.toFixed(2)}` : "—";
  const sellingPriceValue = sellingPrice > 0 ? `₹${sellingPrice.toFixed(2)}` : "—";
  const stockValue = product.inventory?.available ?? listing.inventory?.available ?? 0;
  const variantsCount = listing.variants?.length ?? (product as any).variants?.length ?? 0;
  const descriptionText =
    product.shortDescription ||
    product.description ||
    "No description configured.";

  const score = computePublishingScore(listing);
  const hasIdentity = Boolean(listing.identity.productName && listing.identity.sku && listing.identity.category);
  const hasMedia = (listing.media?.length ?? 0) > 0 || realImages.length > 0;
  const hasCommercials = Boolean(sellingPrice > 0);
  const hasVariants = variantsCount > 0;

  const isOverview = activeWorkspace === "overview";

  return (
    <header className="bg-slate-50/50 pt-2 pb-1.5 px-4 sm:px-6">
      <div className="mx-auto max-w-[1800px] flex flex-col gap-2.5">
        {/* Top Metadata Strip */}
        <TopMetadataStrip product={product} />

        {/* ADAPTIVE HEADER: Compact Bar for Sub-Workspaces, Full Hero for Overview */}
        {!isOverview ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            {/* Left: Product summary */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                {currentImage && !imgError ? (
                  <img src={currentImage} alt={product.name} className="h-full w-full object-contain p-1" />
                ) : (
                  <Package className="h-5 w-5 text-slate-300" strokeWidth={1.5} />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {listing.identity.productName || product.name}
                  </h1>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 shrink-0">
                    {statusLabel}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5">
                  <span className="font-mono">{product.sku}</span>
                  <span>·</span>
                  <span>{productIdValue}</span>
                  <span>·</span>
                  <span className="text-slate-700 font-bold">{stockValue} units in stock</span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl border-slate-200 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition active:scale-95 cursor-pointer"
                disabled={validating}
                onClick={() => validate()}
              >
                {validating ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-slate-500" />}
                <span>Validate</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl border-slate-200 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition active:scale-95 cursor-pointer"
                disabled={saving || !listing.permissions.canEdit}
                onClick={() => save()}
              >
                {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5 text-slate-500" />}
                <span>Save Draft</span>
              </Button>

              <Button
                size="sm"
                className="h-8 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 text-xs font-bold text-white shadow-2xs transition active:scale-95 cursor-pointer"
                disabled={publishing || !listing.permissions.canPublish}
                onClick={() => publish()}
              >
                {publishing ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Rocket className="mr-1 h-3.5 w-3.5" />}
                <span>Publish</span>
              </Button>
            </div>
          </div>
        ) : (
          /* OVERVIEW FULL HERO CONTAINER (COMPACT & TIGHTENED) */
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
            <div className="flex flex-col xl:flex-row items-start gap-4">
              {/* 1. LEFT: Product Media Box */}
              <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto items-center sm:items-start">
                <div className="relative h-36 w-36 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col items-center justify-center overflow-hidden shadow-2xs group">
                  {currentImage && !imgError ? (
                    <img
                      src={currentImage}
                      alt={product.name}
                      className="h-full w-full object-contain p-2"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-center p-2">
                      <Package className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                      <span className="text-[9px] font-bold text-slate-400">No product image</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveWorkspace("media")}
                    className="absolute top-2 right-2 p-1 rounded-lg bg-white/90 backdrop-blur-xs border border-slate-200 shadow-2xs text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
                    title="Edit media"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>

                {realImages.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    {realImages.slice(0, 3).map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedImageIndex(idx);
                          setImgError(false);
                        }}
                        className={`h-8 w-8 rounded-lg border overflow-hidden transition cursor-pointer ${
                          selectedImageIndex === idx
                            ? "border-blue-600 ring-2 ring-blue-500/20"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <img src={img} alt="thumb" className="h-full w-full object-contain p-0.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

            {/* 2. MIDDLE: Title, Description, Identifiers and 8 Mini KPIs */}
            <div className="flex-1 min-w-0 w-full flex flex-col justify-between self-stretch">
              <div>
                {/* Title & Status */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    {listing.identity.productName || product.name}
                  </h1>

                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                    {statusLabel}
                  </span>
                </div>

                {/* Subtitle / Short Description */}
                <p className="mt-1 text-xs text-slate-500 font-medium line-clamp-1 max-w-2xl">
                  {descriptionText}
                </p>

                {/* 3-Column Identifiers Box */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-2 text-xs">
                  {/* SKU */}
                  <div className="flex items-center justify-between px-3 py-1">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">SKU</span>
                      <span className="font-mono font-bold text-slate-900 truncate block">{product.sku}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(product.sku, "sku")}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded transition cursor-pointer ml-1"
                    >
                      {copiedKey === "sku" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {/* Product ID */}
                  <div className="flex items-center justify-between px-3 py-1">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Product ID</span>
                      <span className="font-mono font-bold text-slate-900 truncate block">{productIdValue}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(productIdValue, "pid")}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded transition cursor-pointer ml-1"
                    >
                      {copiedKey === "pid" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {/* Barcode */}
                  <div className="flex items-center justify-between px-3 py-1">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Barcode</span>
                      <span className="font-mono font-bold text-slate-900 truncate block">{barcodeValue}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(barcodeValue, "barcode")}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded transition cursor-pointer ml-1"
                    >
                      {copiedKey === "barcode" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 8 Mini KPI Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-3 mt-3 border-t border-slate-100">
                {/* 1. Category */}
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-center">
                  <div className="h-6 w-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                    <Tag className="h-3 w-3" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Category</span>
                  <span className="text-xs font-bold text-slate-800 truncate max-w-full">{categoryValue}</span>
                </div>

                {/* 2. Brand */}
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-center">
                  <div className="h-6 w-6 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-1">
                    <Building2 className="h-3 w-3" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Brand</span>
                  <span className="text-xs font-bold text-slate-800 truncate max-w-full">{brandValue}</span>
                </div>

                {/* 3. HSN */}
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-center">
                  <div className="h-6 w-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
                    <FileText className="h-3 w-3" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">HSN</span>
                  <span className="text-xs font-mono font-bold text-slate-800 truncate max-w-full">{hsnValue}</span>
                </div>

                {/* 4. Tax */}
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-center">
                  <div className="h-6 w-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-1">
                    <Percent className="h-3 w-3" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Tax</span>
                  <span className="text-xs font-bold text-slate-800 truncate max-w-full">{taxValue}</span>
                </div>

                {/* 5. Cost Price */}
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-center">
                  <div className="h-6 w-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
                    <IndianRupee className="h-3 w-3" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Cost Price</span>
                  <span className="text-xs font-mono font-bold text-slate-800 truncate max-w-full">{costPriceValue}</span>
                </div>

                {/* 6. Selling Price */}
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-center">
                  <div className="h-6 w-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-1">
                    <Tag className="h-3 w-3" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Selling Price</span>
                  <span className="text-xs font-mono font-bold text-slate-800 truncate max-w-full">{sellingPriceValue}</span>
                </div>

                {/* 7. Stock Available */}
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-center">
                  <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                    <ShoppingBag className="h-3 w-3" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Stock Available</span>
                  <span className="text-xs font-mono font-bold text-emerald-600 truncate max-w-full">{stockValue}</span>
                </div>

                {/* 8. Variants */}
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-center">
                  <div className="h-6 w-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
                    <Layers className="h-3 w-3" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Variants</span>
                  <span className="text-xs font-mono font-bold text-slate-800 truncate max-w-full">{variantsCount}</span>
                </div>
              </div>
            </div>

            {/* 3. RIGHT: Actions & Publishing Readiness Donut Widget */}
            <div className="flex flex-col gap-3 shrink-0 w-full xl:w-64">
              {/* Top Action Buttons */}
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8.5 rounded-xl border-slate-200 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition active:scale-95"
                  disabled={validating}
                  onClick={() => validate()}
                >
                  {validating ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-slate-500" />
                  )}
                  <span>Validate</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8.5 rounded-xl border-slate-200 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition active:scale-95"
                  disabled={saving || !listing.permissions.canEdit}
                  onClick={() => save()}
                >
                  {saving ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-1 h-3.5 w-3.5 text-slate-500" />
                  )}
                  <span>Save Draft</span>
                </Button>

                <button
                  type="button"
                  className="h-8.5 w-8.5 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                <Button
                  size="sm"
                  className="h-8.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 text-xs font-bold text-white shadow-2xs transition active:scale-95 cursor-pointer"
                  disabled={publishing || !listing.permissions.canPublish}
                  onClick={() => publish()}
                >
                  {publishing ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Rocket className="mr-1 h-3.5 w-3.5" />
                  )}
                  <span>Publish</span>
                </Button>
              </div>

              {/* Publishing Readiness Donut Box */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  Publishing Readiness
                </span>

                <div className="flex items-center justify-between gap-3">
                  {/* Donut Chart SVG */}
                  <div className="relative h-18 w-18 shrink-0 flex items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      {/* Background circle */}
                      <path
                        className="text-slate-100"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* Progress circle */}
                      <path
                        className="text-blue-600 transition-all duration-500"
                        strokeDasharray={`${score}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-xs font-black font-mono text-slate-900">
                      {score}%
                    </span>
                  </div>

                  {/* Checklist items */}
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className={`flex items-center gap-1 font-semibold ${hasIdentity ? "text-emerald-600" : "text-slate-400"}`}>
                      <span>{hasIdentity ? "✓" : "—"}</span>
                      <span>Identity</span>
                    </div>
                    <div className={`flex items-center gap-1 font-semibold ${hasMedia ? "text-emerald-600" : "text-slate-400"}`}>
                      <span>{hasMedia ? "✓" : "—"}</span>
                      <span>Media</span>
                    </div>
                    <div className={`flex items-center gap-1 font-semibold ${hasCommercials ? "text-emerald-600" : "text-slate-400"}`}>
                      <span>{hasCommercials ? "✓" : "—"}</span>
                      <span>Commercials</span>
                    </div>
                    <div className={`flex items-center gap-1 font-semibold ${hasVariants ? "text-emerald-600" : "text-slate-400"}`}>
                      <span>{hasVariants ? "✓" : "—"}</span>
                      <span>Variants</span>
                    </div>
                  </div>
                </div>

                {/* View Checklist Link */}
                <button
                  type="button"
                  onClick={() => setActiveWorkspace("publishing")}
                  className="mt-2.5 flex items-center justify-end gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer w-full"
                >
                  <span>View Checklist</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </header>
  );
}

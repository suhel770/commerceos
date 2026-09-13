"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
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
  Plus,
  Image as ImageIcon,
  Sparkles,
  Tag,
  Building2,
  FileText,
  Percent,
  IndianRupee,
  ShoppingBag,
  Layers,
  Package,
  Eye,
  RotateCcw,
  Zap,
  Radio,
  ShieldCheck,
  ChevronDown,
  Clock,
  Box,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useStudio } from "../../context/StudioContext";
import { getProductSlug } from "@/lib/products/slug";
import {
  ListingStatus,
  MarketplacePublishStatus,
  ValidationSeverity,
} from "@/lib/types/master-listing";
import TopMetadataStrip from "@/components/products/workspace/hero/TopMetadataStrip";
import { computePublishingScore } from "@/lib/studio/workspace-metrics";
import { ReorderableKpiSection } from "@/components/ui/kpi";

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
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [simulatedHealth, setSimulatedHealth] = useState<"auto" | "yellow" | "blue" | "green" | "error">("auto");

  const realImages = useMemo(() => {
    const mediaUrls = (listing?.media || [])
      .filter(
        (m) =>
          (!m.kind || m.kind === "image") &&
          typeof m.url === "string" &&
          m.url.trim().length > 0 &&
          m.url !== "{}" &&
          !m.url.includes("placeholder.png")
      )
      .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((m) => m.url);

    const productUrls = [
      product.image,
      ...(Array.isArray(product.gallery) ? product.gallery : []),
      ...(Array.isArray((product as any).images) ? (product as any).images : []),
    ].filter(
      (img): img is string =>
        typeof img === "string" &&
        img.trim().length > 0 &&
        img !== "{}" &&
        !img.includes("placeholder.png")
    );

    return Array.from(new Set([...mediaUrls, ...productUrls]));
  }, [listing?.media, product]);

  const safeIndex = selectedImageIndex < realImages.length ? selectedImageIndex : 0;
  const currentImage = realImages[safeIndex] || realImages[0];
  const isCurrentImgError = currentImage ? failedImages[currentImage] : false;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (realImages.length <= 1) return;
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : realImages.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (realImages.length <= 1) return;
    setSelectedImageIndex((prev) => (prev < realImages.length - 1 ? prev + 1 : 0));
  };

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

  const pkgLength = Number((listing as any)?.logistics?.packageDimensions?.length || (product as any)?.packageDimensions?.length || 24);
  const pkgWidth = Number((listing as any)?.logistics?.packageDimensions?.width || (product as any)?.packageDimensions?.width || 18);
  const pkgHeight = Number((listing as any)?.logistics?.packageDimensions?.height || (product as any)?.packageDimensions?.height || 8);
  const volWeight = Number(((pkgLength * pkgWidth * pkgHeight) / 5000).toFixed(2));
  const isGtinExempt = Boolean((product as any)?.isGtinExempt ?? (listing as any)?.identity?.isGtinExempt);
  const handlingTimeDays = (product as any)?.handlingTimeDays || 1;

  // DYNAMIC 4-COLOR HEALTH TELEMETRY & 360° ROTATING BORDER BEAM
  // 1. Red: Publish failure or critical validation errors
  // 2. Yellow: Low readiness (~30% draft)
  // 3. Blue: Moderate readiness (~70% in progress)
  // 4. Green: High readiness / 100% complete / Active
  const activeHealthState: "yellow" | "blue" | "green" | "error" = useMemo(() => {
    if (simulatedHealth !== "auto") {
      return simulatedHealth;
    }

    // Check for critical errors or publish failure (Red)
    const isFailed = listing.status === ListingStatus.FAILED;
    const hasValidationErrors = (listing.validationIssues || []).some(
      (issue) => issue.severity === ValidationSeverity.ERROR
    );
    const hasMarketplaceFailure = (listing.marketplaces || []).some(
      (m) => m.publishStatus === MarketplacePublishStatus.FAILED || (m as any).status === "failed" || (m as any).status === "error"
    );

    if (isFailed || hasValidationErrors || hasMarketplaceFailure) {
      return "error";
    }

    // 100% / High Readiness (Green)
    if (score >= 80 || listing.status === ListingStatus.PUBLISHED || listing.status === ListingStatus.READY) {
      return "green";
    }

    // ~70% / Mid-High Readiness (Blue)
    if (score >= 50) {
      return "blue";
    }

    // ~30% / Low Readiness (Yellow)
    return "yellow";
  }, [listing, score, simulatedHealth]);

  const beamTheme = useMemo(() => {
    switch (activeHealthState) {
      case "error":
        return {
          key: "error",
          label: "Sync/Publish Issue",
          scoreGrade: "Issue Detected",
          trackBorder: "border-rose-300/80",
          ambientGlow: "shadow-[0_0_40px_rgba(244,63,94,0.22)]",
          outerGlowFlare: "bg-rose-500/10",
          laserScanline: "via-rose-500/80",
          scanlineBottom: "via-rose-400/40",
          badgeBg: "bg-rose-50 border-rose-200 text-rose-700",
          pingDot: "bg-rose-400",
          solidDot: "bg-rose-500",
          hudRadarGlow: "text-rose-600",
          conicBeam:
            "conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 40deg, #f43f5e 80deg, #ef4444 105deg, #fda4af 120deg, transparent 150deg, transparent 220deg, #f43f5e 260deg, #ef4444 285deg, #fda4af 300deg, transparent 330deg, transparent 360deg)",
        };
      case "green":
        return {
          key: "green",
          label: "100% Ready",
          scoreGrade: "Marketplace Ready",
          trackBorder: "border-emerald-300/80",
          ambientGlow: "shadow-[0_0_40px_rgba(16,185,129,0.22)]",
          outerGlowFlare: "bg-emerald-500/10",
          laserScanline: "via-emerald-500/80",
          scanlineBottom: "via-teal-400/40",
          badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-700",
          pingDot: "bg-emerald-400",
          solidDot: "bg-emerald-500",
          hudRadarGlow: "text-emerald-600",
          conicBeam:
            "conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 40deg, #10b981 80deg, #14b8a6 105deg, #6ee7b7 120deg, transparent 150deg, transparent 220deg, #10b981 260deg, #14b8a6 285deg, #6ee7b7 300deg, transparent 330deg, transparent 360deg)",
        };
      case "blue":
        return {
          key: "blue",
          label: "70% In Progress",
          scoreGrade: "Refinement Phase",
          trackBorder: "border-blue-300/80",
          ambientGlow: "shadow-[0_0_40px_rgba(37,99,235,0.20)]",
          outerGlowFlare: "bg-blue-500/10",
          laserScanline: "via-blue-500/80",
          scanlineBottom: "via-cyan-400/40",
          badgeBg: "bg-blue-50 border-blue-200 text-blue-700",
          pingDot: "bg-blue-400",
          solidDot: "bg-blue-500",
          hudRadarGlow: "text-blue-600",
          conicBeam:
            "conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 40deg, #2563eb 80deg, #06b6d4 105deg, #93c5fd 120deg, transparent 150deg, transparent 220deg, #2563eb 260deg, #06b6d4 285deg, #93c5fd 300deg, transparent 330deg, transparent 360deg)",
        };
      case "yellow":
      default:
        return {
          key: "yellow",
          label: "30% Draft",
          scoreGrade: "Initial Draft",
          trackBorder: "border-amber-300/80",
          ambientGlow: "shadow-[0_0_40px_rgba(245,158,11,0.22)]",
          outerGlowFlare: "bg-amber-500/10",
          laserScanline: "via-amber-500/80",
          scanlineBottom: "via-yellow-400/40",
          badgeBg: "bg-amber-50 border-amber-200 text-amber-700",
          pingDot: "bg-amber-400",
          solidDot: "bg-amber-500",
          hudRadarGlow: "text-amber-600",
          conicBeam:
            "conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 40deg, #f59e0b 80deg, #fbbf24 105deg, #fef08a 120deg, transparent 150deg, transparent 220deg, #f59e0b 260deg, #fbbf24 285deg, #fef08a 300deg, transparent 330deg, transparent 360deg)",
        };
    }
  }, [activeHealthState]);

  // Real-Time Dynamic Marketplace Channel Signals
  const getChannelSignal = (name: "amazon" | "flipkart" | "shopify") => {
    const conn = (listing.marketplaces || []).find(
      (m) => m.marketplace?.toLowerCase() === name
    );

    if (!conn || !conn.enabled) {
      return {
        status: "not_connected" as const,
        label: "Not Linked",
        badgeClass: "bg-slate-100 text-slate-500",
        dotClass: "bg-slate-400",
        borderClass: "border-slate-200/90 bg-white hover:bg-slate-50",
        textClass: "text-slate-600",
        title: `${name.toUpperCase()} channel is not linked or enabled yet`,
      };
    }

    if (conn.publishStatus === MarketplacePublishStatus.FAILED || (conn as any).status === "failed") {
      return {
        status: "error" as const,
        label: "Sync Issue",
        badgeClass: "bg-rose-50 text-rose-700",
        dotClass: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]",
        borderClass: "border-rose-200/90 bg-white hover:bg-rose-50/80",
        textClass: "text-rose-700",
        title: `${name.toUpperCase()} sync issue: check Exceptions workspace`,
      };
    }

    if (conn.publishStatus === MarketplacePublishStatus.PUBLISHED) {
      return {
        status: "published" as const,
        label: "Live Active",
        badgeClass: "bg-emerald-50 text-emerald-800",
        dotClass: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]",
        borderClass: "border-emerald-200/90 bg-white hover:bg-emerald-50/80",
        textClass: "text-emerald-800",
        title: `${name.toUpperCase()} catalog is live and published`,
      };
    }

    if (conn.publishStatus === MarketplacePublishStatus.READY || conn.validationScore >= 80) {
      return {
        status: "ready" as const,
        label: "Ready",
        badgeClass: "bg-emerald-50 text-emerald-600",
        dotClass: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]",
        borderClass: "border-emerald-200/90 bg-white hover:bg-emerald-50/80",
        textClass: "text-emerald-700",
        title: `${name.toUpperCase()} validated and ready for publish`,
      };
    }

    return {
      status: "action_required" as const,
      label: "Needs Setup",
      badgeClass: "bg-amber-50 text-amber-700",
      dotClass: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]",
      borderClass: "border-amber-200/90 bg-white hover:bg-amber-50/80",
      textClass: "text-amber-800",
      title: `${name.toUpperCase()} missing required marketplace attributes`,
    };
  };

  const amazonSignal = getChannelSignal("amazon");
  const flipkartSignal = getChannelSignal("flipkart");
  const shopifySignal = getChannelSignal("shopify");

  const activeConnectedChannels = (listing.marketplaces || []).filter((m) => m.enabled);
  const activeChannelsText = activeConnectedChannels.length > 0
    ? activeConnectedChannels
        .map((m) => m.marketplace.charAt(0).toUpperCase() + m.marketplace.slice(1))
        .join(" · ")
    : "No Channels Linked";

  const isOverview = activeWorkspace === "overview";

  return (
    <header className="bg-slate-50/50 pt-1 pb-1 px-2 sm:px-3">
      <div className="w-full flex flex-col gap-2">
        {/* Top Metadata Strip */}
        <TopMetadataStrip product={product} />

        {/* ADAPTIVE HEADER: Compact Bar for Sub-Workspaces, Full Hero for Overview */}
        {!isOverview ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            {/* Left: Product summary */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                {currentImage && !isCurrentImgError ? (
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
          /* OVERVIEW FULL HERO CONTAINER (360° ROTATING DYNAMIC HUD BORDER BEAM) */
          <div
            className={cn(
              "relative rounded-[28px] p-[2.5px] overflow-hidden transition-all duration-700",
              beamTheme.ambientGlow
            )}
          >
            {/* 360° Rotating Laser Beam */}
            <div
              className="absolute -inset-[200%] animate-hud-beam pointer-events-none opacity-95 transition-opacity duration-700"
              style={{
                background: beamTheme.conicBeam,
              }}
            />

            {/* Static Outer Border Track for crisp definition */}
            <div
              className={cn(
                "absolute inset-0 rounded-[28px] border pointer-events-none transition-colors duration-700",
                beamTheme.trackBorder
              )}
            />

            {/* Dynamic Luminous Ambient Flare */}
            <div
              className={cn(
                "pointer-events-none absolute -top-28 -left-28 h-72 w-72 rounded-full blur-[90px] transition-colors duration-700",
                beamTheme.outerGlowFlare
              )}
            />
            <div className="pointer-events-none absolute -bottom-28 -right-28 h-72 w-72 rounded-full bg-slate-200/25 blur-[90px]" />

            {/* Inner HUD Card Surface */}
            <div className="relative z-10 w-full h-full rounded-[25.5px] overflow-hidden bg-gradient-to-br from-white via-slate-50/80 to-blue-50/20 p-4 sm:p-5 text-slate-800 backdrop-blur-xl shadow-2xs">
              {/* Micro-Grid Overlay */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-35" />

              {/* Top & Bottom Cyber Laser Scanlines matching health state */}
              <div
                className={cn(
                  "pointer-events-none absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent to-transparent transition-all duration-700",
                  beamTheme.laserScanline
                )}
              />
              <div
                className={cn(
                  "pointer-events-none absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent to-transparent transition-all duration-700",
                  beamTheme.scanlineBottom
                )}
              />

              <div className="relative z-10 flex flex-col gap-4">
                {/* TOP COMMAND BAR: Title & Status (Left) + Actions (Right) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                      {listing.identity.productName || product.name}
                    </h1>

                    {/* Status Pill with dynamic health beam integration */}
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 border shadow-2xs transition-colors duration-500",
                        beamTheme.badgeBg
                      )}
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span
                          className={cn(
                            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                            beamTheme.pingDot
                          )}
                        />
                        <span
                          className={cn(
                            "relative inline-flex rounded-full h-1.5 w-1.5",
                            beamTheme.solidDot
                          )}
                        />
                      </span>
                      <span>{statusLabel}</span>
                      {activeHealthState === "error" && (
                        <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-100/90 px-1 py-0.2 rounded ml-0.5">
                          Issue
                        </span>
                      )}
                    </span>

                    <span className="text-slate-300 hidden md:inline">·</span>
                    <p className="text-xs text-slate-500 font-medium line-clamp-1 max-w-md font-sans">
                      {descriptionText}
                    </p>
                  </div>

                {/* Top Action Command Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8.5 rounded-xl border-slate-200 bg-white hover:bg-slate-50 px-2.5 text-xs font-bold text-slate-700 shadow-2xs transition active:scale-95 cursor-pointer backdrop-blur-md"
                    disabled={validating}
                    onClick={() => validate()}
                  >
                    {validating ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin text-blue-600" />
                    ) : (
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-slate-500" />
                    )}
                    <span>Validate</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8.5 rounded-xl border-slate-200 bg-white hover:bg-slate-50 px-2.5 text-xs font-bold text-slate-700 shadow-2xs transition active:scale-95 cursor-pointer backdrop-blur-md"
                    disabled={saving || !listing.permissions.canEdit}
                    onClick={() => save()}
                  >
                    {saving ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin text-emerald-600" />
                    ) : (
                      <Save className="mr-1 h-3.5 w-3.5 text-slate-500" />
                    )}
                    <span>Save Draft</span>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8.5 rounded-xl border-slate-200 bg-white hover:bg-slate-50 px-2.5 text-xs font-bold text-slate-700 shadow-2xs transition active:scale-95 cursor-pointer backdrop-blur-md flex items-center gap-1.5"
                        title="Product Actions & Tools"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5 text-slate-500" />
                        <span>Actions</span>
                        <ChevronDown className="h-3 w-3 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-xl z-50">
                      <DropdownMenuItem
                        onClick={() => setActiveWorkspace("preview")}
                        className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                        <span>Live Marketplace Preview</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => setActiveWorkspace("readiness")}
                        className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Channel Readiness Audit</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => setActiveWorkspace("category_mapping")}
                        className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:text-purple-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        <Layers className="h-4 w-4 text-purple-600" />
                        <span>Category Taxonomy Mapping</span>
                      </DropdownMenuItem>

                      <div className="h-px bg-slate-100 my-1" />

                      <DropdownMenuItem
                        onClick={() => {
                          if (listing?.identity?.sku) {
                            navigator.clipboard.writeText(listing.identity.sku);
                            setCopiedKey("sku");
                            setTimeout(() => setCopiedKey(null), 2000);
                          }
                        }}
                        className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        <Copy className="h-4 w-4 text-slate-400" />
                        <span>{copiedKey === "sku" ? "Copied SKU!" : "Copy Master SKU"}</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          if (listing) {
                            navigator.clipboard.writeText(JSON.stringify(listing, null, 2));
                            setCopiedKey("json");
                            setTimeout(() => setCopiedKey(null), 2000);
                          }
                        }}
                        className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span>{copiedKey === "json" ? "Copied JSON!" : "Copy Product JSON"}</span>
                      </DropdownMenuItem>

                      <div className="h-px bg-slate-100 my-1" />

                      {/* HUD Border Beam Simulation Controls */}
                      <div className="px-2.5 py-1 text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center justify-between">
                        <span>HUD Laser Beam</span>
                        <span className="text-[9px] capitalize text-slate-600 font-semibold">{beamTheme.label}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 px-1.5 pb-1">
                        <button
                          type="button"
                          onClick={() => setSimulatedHealth("yellow")}
                          className={cn(
                            "px-1 py-1 rounded text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer",
                            activeHealthState === "yellow" ? "bg-amber-100 text-amber-800 ring-1 ring-amber-400" : "hover:bg-slate-100 text-slate-600"
                          )}
                          title="30% Readiness - Rotating Yellow Laser"
                        >
                          <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                          <span>30%</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimulatedHealth("blue")}
                          className={cn(
                            "px-1 py-1 rounded text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer",
                            activeHealthState === "blue" ? "bg-blue-100 text-blue-800 ring-1 ring-blue-400" : "hover:bg-slate-100 text-slate-600"
                          )}
                          title="70% Readiness - Rotating Blue Laser"
                        >
                          <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(37,99,235,0.8)]" />
                          <span>70%</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimulatedHealth("green")}
                          className={cn(
                            "px-1 py-1 rounded text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer",
                            activeHealthState === "green" ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-400" : "hover:bg-slate-100 text-slate-600"
                          )}
                          title="100% Ready - Rotating Green Laser"
                        >
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                          <span>100%</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimulatedHealth("error")}
                          className={cn(
                            "px-1 py-1 rounded text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer",
                            activeHealthState === "error" ? "bg-rose-100 text-rose-800 ring-1 ring-rose-400" : "hover:bg-slate-100 text-slate-600"
                          )}
                          title="Post-Publish Issue - Rotating Red Laser"
                        >
                          <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                          <span>Issue</span>
                        </button>
                      </div>
                      {simulatedHealth !== "auto" && (
                        <div className="px-2 pb-1">
                          <button
                            type="button"
                            onClick={() => setSimulatedHealth("auto")}
                            className="w-full text-center text-[10px] text-blue-600 hover:text-blue-700 hover:underline py-0.5 font-mono cursor-pointer"
                          >
                            ↺ Reset to Live Auto State
                          </button>
                        </div>
                      )}

                      <div className="h-px bg-slate-100 my-1" />

                      <DropdownMenuItem
                        onClick={() => {
                          if (confirm("Discard all unsaved changes and reload product?")) {
                            window.location.reload();
                          }
                        }}
                        className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <RotateCcw className="h-4 w-4 text-rose-500" />
                        <span>Discard Unsaved Changes</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    size="sm"
                    className="h-8.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-3.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition active:scale-95 cursor-pointer uppercase tracking-wider"
                    disabled={publishing || !listing.permissions.canPublish}
                    onClick={() => publish()}
                  >
                    {publishing ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Rocket className="mr-1 h-3.5 w-3.5 fill-current" />
                    )}
                    <span>Publish</span>
                  </Button>
                </div>
              </div>

              {/* LOWER BODY: Left Media Box + Middle Content + Right Readiness Radar */}
              <div className="flex flex-col xl:flex-row items-stretch gap-4">
                {/* 1. LEFT: Product Holographic Viewport with Cyber Thumbnail Rail */}
                <div className="flex flex-col justify-between shrink-0 w-full sm:w-auto self-stretch">
                  {/* Thumbnails Rail + Main Viewport */}
                  <div className="flex flex-col-reverse sm:flex-row gap-3 items-center sm:items-start">
                    {/* Cyber Thumbnail Rail */}
                    <div className="flex sm:flex-col items-center gap-2 max-h-52 sm:max-h-56 overflow-x-auto sm:overflow-y-auto no-scrollbar py-1">
                      {realImages.length > 0 ? (
                        <>
                          {realImages.map((img, idx) => {
                            const isSelected = safeIndex === idx;
                            const isFailed = failedImages[img];
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedImageIndex(idx)}
                                onMouseEnter={() => setSelectedImageIndex(idx)}
                                title={`View Asset ${idx + 1}`}
                                className={cn(
                                  "relative h-11 w-11 rounded-xl border bg-white flex items-center justify-center overflow-hidden transition-all cursor-pointer shrink-0 shadow-2xs group",
                                  isSelected
                                    ? "border-blue-600 ring-2 ring-blue-500/30 shadow-xs scale-105"
                                    : "border-slate-200/90 hover:border-slate-400 hover:scale-102 opacity-80 hover:opacity-100"
                                )}
                              >
                                {!isFailed ? (
                                  <img
                                    src={img}
                                    alt={`Thumbnail ${idx + 1}`}
                                    className="h-full w-full object-contain p-1 transition-transform group-hover:scale-110"
                                    onError={() => setFailedImages((prev) => ({ ...prev, [img]: true }))}
                                  />
                                ) : (
                                  <Package className="h-4 w-4 text-slate-300" strokeWidth={1.5} />
                                )}
                                {idx === 0 && (
                                  <span className="absolute bottom-0 inset-x-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-[7px] font-black text-white uppercase tracking-widest text-center py-[1px] leading-none">
                                    MASTER
                                  </span>
                                )}
                              </button>
                            );
                          })}

                          {/* Add more shortcut button */}
                          <button
                            type="button"
                            onClick={() => setActiveWorkspace("media")}
                            title="Deploy additional media in Media Studio"
                            className="h-11 w-11 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/50 flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-blue-600 transition-all cursor-pointer shrink-0"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span className="text-[8px] font-mono font-bold tracking-wider uppercase">Add</span>
                          </button>
                        </>
                      ) : (
                        /* Empty state cyber slots */
                        [0, 1, 2].map((i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActiveWorkspace("media")}
                            title="Add image in Media Studio"
                            className="h-11 w-11 rounded-xl border border-dashed border-slate-200 hover:border-blue-400 bg-white/70 hover:bg-blue-50/50 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 transition-all cursor-pointer shrink-0"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            <span className="text-[7px] font-mono font-semibold uppercase">{i === 0 ? "SLOT 1" : `SLOT ${i + 1}`}</span>
                          </button>
                        ))
                      )}
                    </div>

                    {/* Main Large Viewport with Laser Reticles */}
                    <div className="relative h-48 w-48 sm:h-52 sm:w-52 lg:h-56 lg:w-56 rounded-2xl border border-slate-200/90 bg-white flex flex-col items-center justify-center overflow-hidden shadow-inner group backdrop-blur-md">
                      {/* Precision Corner Reticles */}
                      <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 border-blue-500/80 rounded-tl-xs pointer-events-none" />
                      <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 border-blue-500/80 rounded-tr-xs pointer-events-none" />
                      <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b-2 border-l-2 border-blue-500/80 rounded-bl-xs pointer-events-none" />
                      <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b-2 border-r-2 border-blue-500/80 rounded-br-xs pointer-events-none" />

                      {currentImage && !isCurrentImgError ? (
                        <img
                          src={currentImage}
                          alt={product.name}
                          className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                          onError={() => setFailedImages((prev) => ({ ...prev, [currentImage]: true }))}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2.5 text-center p-3 relative z-10">
                          <div className="relative flex items-center justify-center">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-xs">
                              <Package className="h-7 w-7" strokeWidth={1.5} />
                            </div>
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                            </span>
                          </div>
                          <div>
                            <span className="font-mono text-[9px] font-black uppercase tracking-widest text-blue-600/80 block">
                              Holographic Viewport
                            </span>
                            <p className="text-xs font-bold text-slate-700 mt-0.5">No Master Media</p>
                            <button
                              type="button"
                              onClick={() => setActiveWorkspace("media")}
                              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all active:scale-95 cursor-pointer"
                            >
                              <Zap className="h-3 w-3 fill-current" />
                              <span>Upload Media</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Carousel Navigation Arrows */}
                      {realImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={handlePrevImage}
                            aria-label="Previous image"
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-white/95 hover:bg-white border border-slate-200 text-slate-700 shadow-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:scale-110 backdrop-blur-md"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleNextImage}
                            aria-label="Next image"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-white/95 hover:bg-white border border-slate-200 text-slate-700 shadow-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:scale-110 backdrop-blur-md"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}

                      {/* Top-Right: Edit in Media Studio button */}
                      <button
                        type="button"
                        onClick={() => setActiveWorkspace("media")}
                        className="absolute top-2 right-2 p-1.5 rounded-xl bg-white/95 hover:bg-white border border-slate-200 hover:border-blue-500 shadow-2xs text-slate-600 hover:text-blue-600 backdrop-blur-md transition cursor-pointer"
                        title="Edit media in Media Studio"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>

                      {/* Bottom-Left: Image Counter Pill */}
                      {realImages.length > 1 && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-slate-900/80 border border-slate-800 px-2 py-0.5 text-[9px] font-mono font-bold text-white shadow-xs pointer-events-none backdrop-blur-md">
                          <ImageIcon className="h-2.5 w-2.5 text-blue-400" />
                          <span>
                            {safeIndex + 1}/{realImages.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Media Asset Strip */}
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200/90 bg-white/90 backdrop-blur-md px-3 py-2 text-xs shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span className="font-mono font-bold text-slate-800">
                        {realImages.length > 0 ? `${realImages.length} Assets` : "No Assets"}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[10px] text-slate-500 font-mono font-medium tracking-wide">1:1 UHD Matrix</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveWorkspace("media")}
                      className="flex items-center gap-1 text-[11px] font-mono font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer hover:underline"
                    >
                      <span>Media Lab</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* 2. MIDDLE: HUD Metadata Strip, Channel Synapse Hub, and 4 KPI Telemetry Tiles */}
                <div className="flex-1 min-w-0 w-full flex flex-col justify-between self-stretch">
                  {/* Futuristic HUD Metadata Capsules Strip */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {/* SKU Capsule */}
                    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 px-2.5 py-1 backdrop-blur-md shadow-2xs hover:border-blue-400/60 transition-colors">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 font-mono">SKU</span>
                      <span className="font-mono font-bold text-slate-800">{product.sku}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(product.sku, "sku")}
                        className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition cursor-pointer ml-0.5"
                        title="Copy SKU"
                      >
                        {copiedKey === "sku" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>

                    {/* Product ID Capsule */}
                    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 px-2.5 py-1 backdrop-blur-md shadow-2xs hover:border-violet-400/60 transition-colors">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.6)]" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-violet-600 font-mono">ID</span>
                      <span className="font-mono font-bold text-slate-800">{productIdValue}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(productIdValue, "pid")}
                        className="text-slate-400 hover:text-violet-600 p-0.5 rounded transition cursor-pointer ml-0.5"
                        title="Copy Product ID"
                      >
                        {copiedKey === "pid" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>

                    {/* Barcode Capsule */}
                    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 px-2.5 py-1 backdrop-blur-md shadow-2xs hover:border-emerald-400/60 transition-colors">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 font-mono">BARCODE</span>
                      <span className="font-mono font-bold text-slate-800">{barcodeValue}</span>
                      {barcodeValue !== "—" && (
                        <button
                          type="button"
                          onClick={() => handleCopy(barcodeValue, "barcode")}
                          className="text-slate-400 hover:text-emerald-600 p-0.5 rounded transition cursor-pointer ml-0.5"
                          title="Copy Barcode"
                        >
                          {copiedKey === "barcode" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        </button>
                      )}
                    </div>

                    {/* HSN Capsule */}
                    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 px-2.5 py-1 backdrop-blur-md shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 font-mono">HSN</span>
                      <span className="font-mono font-bold text-slate-800">{hsnValue}</span>
                    </div>

                    {/* Tax GST Capsule */}
                    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 px-2.5 py-1 backdrop-blur-md shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 font-mono">TAX</span>
                      <span className="font-mono font-bold text-slate-800">{taxValue}</span>
                    </div>
                  </div>

                  {/* Marketplace Channel Synapse & Logistics Quick-Telemetry Strip (Grid, fills width edge-to-edge) */}
                  <div className="my-2.5 rounded-2xl border border-slate-200/90 bg-white/70 p-2.5 shadow-2xs backdrop-blur-xs">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 items-center">
                      {/* Left: Multi-Channel Instant Sync Signals */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono pl-0.5 pr-1">
                          Channel Sync
                        </span>

                        {/* Amazon Channel Signal */}
                        <button
                          type="button"
                          onClick={() => setActiveWorkspace("channels")}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-xl border px-2 py-1 text-[11px] font-bold transition cursor-pointer shadow-2xs",
                            amazonSignal.borderClass,
                            amazonSignal.textClass
                          )}
                          title={amazonSignal.title}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", amazonSignal.dotClass)} />
                          <span>Amazon</span>
                          <span className={cn("text-[9px] font-mono font-medium px-1 py-0.5 rounded", amazonSignal.badgeClass)}>
                            {amazonSignal.label}
                          </span>
                        </button>

                        {/* Flipkart Channel Signal */}
                        <button
                          type="button"
                          onClick={() => setActiveWorkspace("channels")}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-xl border px-2 py-1 text-[11px] font-bold transition cursor-pointer shadow-2xs",
                            flipkartSignal.borderClass,
                            flipkartSignal.textClass
                          )}
                          title={flipkartSignal.title}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", flipkartSignal.dotClass)} />
                          <span>Flipkart</span>
                          <span className={cn("text-[9px] font-mono font-medium px-1 py-0.5 rounded", flipkartSignal.badgeClass)}>
                            {flipkartSignal.label}
                          </span>
                        </button>

                        {/* Shopify Channel Signal */}
                        <button
                          type="button"
                          onClick={() => setActiveWorkspace("channels")}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-xl border px-2 py-1 text-[11px] font-bold transition cursor-pointer shadow-2xs",
                            shopifySignal.borderClass,
                            shopifySignal.textClass
                          )}
                          title={shopifySignal.title}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", shopifySignal.dotClass)} />
                          <span>Shopify</span>
                          <span className={cn("text-[9px] font-mono font-medium px-1 py-0.5 rounded", shopifySignal.badgeClass)}>
                            {shopifySignal.label}
                          </span>
                        </button>
                      </div>

                      {/* Right: Logistics & Exemption Badges */}
                      <div className="flex items-center justify-start lg:justify-end gap-1.5 flex-wrap">
                        {/* Handling SLA */}
                        <button
                          type="button"
                          onClick={() => setActiveWorkspace("logistics")}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 transition cursor-pointer shadow-2xs"
                          title="Dispatch Handling Time SLA"
                        >
                          <Clock className="h-3 w-3 text-blue-600" />
                          <span className="font-mono font-bold text-slate-800">{handlingTimeDays}d</span>
                          <span className="text-[10px] text-slate-400">SLA</span>
                        </button>

                        {/* GTIN / Barcode Exemption Badge */}
                        <button
                          type="button"
                          onClick={() => setActiveWorkspace("identity")}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 transition cursor-pointer shadow-2xs"
                          title="GTIN Exemption Status"
                        >
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          <span className="text-[10px] font-bold text-slate-800">
                            {isGtinExempt ? "GTIN Exempted" : "Standard GTIN"}
                          </span>
                        </button>

                        {/* Packaging Volumetric Weight Quick Badge */}
                        <button
                          type="button"
                          onClick={() => setActiveWorkspace("logistics")}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 transition cursor-pointer shadow-2xs"
                          title="Volumetric Weight Tier"
                        >
                          <Box className="h-3 w-3 text-indigo-600" />
                          <span className="font-mono font-bold text-slate-800">{volWeight} kg</span>
                          <span className="text-[10px] text-slate-400">Vol. Wt</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4 Spacious Executive Reorderable KPI Telemetry Cards */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <ReorderableKpiSection
                      storageKey="studio-header-executive-kpis"
                      defaultOrder={["selling_price", "inventory", "brand_category", "variants"]}
                      items={[
                        {
                          id: "selling_price",
                          render: () => (
                            <div className="relative overflow-hidden p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-400/60 transition-all shadow-2xs hover:shadow-[0_8px_20px_rgba(37,99,235,0.08)] h-full flex flex-col justify-between group">
                              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 font-mono">Selling Price</span>
                                <div className="h-7 w-7 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-2xs">
                                  <Tag className="h-3.5 w-3.5" />
                                </div>
                              </div>
                              <div className="my-1.5">
                                <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {sellingPriceValue}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                                <span>Cost:</span>
                                <span className="font-bold text-slate-800">{costPriceValue}</span>
                              </div>
                            </div>
                          ),
                        },
                        {
                          id: "inventory",
                          render: () => (
                            <div className="relative overflow-hidden p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-400/60 transition-all shadow-2xs hover:shadow-[0_8px_20px_rgba(16,185,129,0.08)] h-full flex flex-col justify-between group">
                              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 font-mono">Stock Available</span>
                                <div className="h-7 w-7 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs">
                                  <ShoppingBag className="h-3.5 w-3.5" />
                                </div>
                              </div>
                              <div className="my-1.5">
                                <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-600">
                                  {stockValue} <span className="text-xs font-bold text-slate-400">units</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-emerald-700">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                </span>
                                <span>{stockValue > 0 ? "Ready for dispatch" : "Restock required"}</span>
                              </div>
                            </div>
                          ),
                        },
                        {
                          id: "brand_category",
                          render: () => (
                            <div className="relative overflow-hidden p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-violet-400/60 transition-all shadow-2xs hover:shadow-[0_8px_20px_rgba(139,92,246,0.08)] h-full flex flex-col justify-between group">
                              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 font-mono">Brand</span>
                                <div className="h-7 w-7 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center shadow-2xs">
                                  <Building2 className="h-3.5 w-3.5" />
                                </div>
                              </div>
                              <div className="my-1.5">
                                <span className="text-base font-bold text-slate-900 truncate block tracking-tight" title={brandValue}>
                                  {brandValue}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 truncate">
                                <span>Category:</span>
                                <span className="font-bold text-slate-800 truncate">{categoryValue}</span>
                              </div>
                            </div>
                          ),
                        },
                        {
                          id: "variants",
                          render: () => (
                            <div className="relative overflow-hidden p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-amber-400/60 transition-all shadow-2xs hover:shadow-[0_8px_20px_rgba(245,158,11,0.08)] h-full flex flex-col justify-between group">
                              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 font-mono">Variants</span>
                                <div className="h-7 w-7 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shadow-2xs">
                                  <Layers className="h-3.5 w-3.5" />
                                </div>
                              </div>
                              <div className="my-1.5">
                                <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900">
                                  {variantsCount} <span className="text-xs font-bold text-slate-400">{variantsCount === 1 ? "option" : "options"}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                                <span>{variantsCount > 0 ? "Multi-Variant Matrix" : "Single Product SKU"}</span>
                              </div>
                            </div>
                          ),
                        },
                      ]}
                      gridClassName="grid grid-cols-2 xl:grid-cols-4 gap-2.5"
                      showHelperText={false}
                      showResetButton={false}
                    />
                  </div>
                </div>

                {/* 3. RIGHT: Orbital Publishing Readiness Donut & Channel Synapse */}
                <div className="flex flex-col justify-between gap-3 shrink-0 w-full xl:w-64">
                  {/* Publishing Readiness Donut Box */}
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs relative overflow-hidden backdrop-blur-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
                        <Radio className={cn("h-3 w-3 transition-colors", beamTheme.hudRadarGlow)} />
                        <span>Publishing Readiness</span>
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">HUD</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      {/* Donut Chart SVG with Gradient */}
                      <div className="relative h-18 w-18 shrink-0 flex items-center justify-center">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                          <defs>
                            <linearGradient id="readiness-light-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#2563eb" />
                              <stop offset="50%" stopColor="#06b6d4" />
                              <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                          </defs>
                          {/* Background orbital track */}
                          <path
                            className="text-slate-100"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          {/* Glowing progress arc */}
                          <path
                            stroke="url(#readiness-light-gradient)"
                            strokeDasharray={`${score}, 100`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            fill="none"
                            className="transition-all duration-700"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-xs font-black font-mono text-slate-900">
                            {score}%
                          </span>
                        </div>
                      </div>

                      {/* Checklist items */}
                      <div className="flex flex-col gap-1 text-[11px] font-mono">
                        <div className={`flex items-center gap-1.5 font-medium ${hasIdentity ? "text-emerald-600" : "text-slate-400"}`}>
                          <span className="font-bold">{hasIdentity ? "✓" : "—"}</span>
                          <span className={hasIdentity ? "text-slate-800" : "text-slate-400"}>Identity</span>
                        </div>
                        <div className={`flex items-center gap-1.5 font-medium ${hasMedia ? "text-emerald-600" : "text-slate-400"}`}>
                          <span className="font-bold">{hasMedia ? "✓" : "—"}</span>
                          <span className={hasMedia ? "text-slate-800" : "text-slate-400"}>Media</span>
                        </div>
                        <div className={`flex items-center gap-1.5 font-medium ${hasCommercials ? "text-emerald-600" : "text-slate-400"}`}>
                          <span className="font-bold">{hasCommercials ? "✓" : "—"}</span>
                          <span className={hasCommercials ? "text-slate-800" : "text-slate-400"}>Commercials</span>
                        </div>
                        <div className={`flex items-center gap-1.5 font-medium ${hasVariants ? "text-emerald-600" : "text-slate-400"}`}>
                          <span className="font-bold">{hasVariants ? "✓" : "—"}</span>
                          <span className={hasVariants ? "text-slate-800" : "text-slate-400"}>Variants</span>
                        </div>
                      </div>
                    </div>

                    {/* View Checklist Link */}
                    <button
                      type="button"
                      onClick={() => setActiveWorkspace("publishing")}
                      className="mt-2.5 flex items-center justify-end gap-1 text-[11px] font-mono font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer w-full hover:underline"
                    >
                      <span>Audit Checklist</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Bottom Marketplace Channel Synapse Bar */}
                  <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 px-3 py-2 flex items-center justify-between text-xs shadow-2xs backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <div className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-slate-800 block text-[11px] leading-tight">Channel Synapse</span>
                        <span className="text-[10px] text-slate-500 font-medium">{activeChannelsText}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveWorkspace("preview")}
                        className="text-[11px] font-mono font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition hover:underline"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Live</span>
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={() => setActiveWorkspace("channels")}
                        className="text-[11px] font-mono font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer transition hover:underline shrink-0"
                      >
                        <span>Channels</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </header>
);
}

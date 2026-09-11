import { MarketplaceName, type MasterListing, type MasterAttribute } from "@/lib/types/master-listing";
import type { StudioWorkspaceId } from "@/components/products/studio/config/studio.config";

export type ExceptionSeverity = "BLOCKER" | "WARNING" | "INFO";
export type ExceptionStatus = "OPEN" | "RESOLVED" | "IGNORED";

export interface ConsolidatedException {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  category: "IDENTITY" | "ATTRIBUTES" | "MEDIA" | "COMMERCIALS" | "COMPLIANCE" | "VARIANTS";
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  reason: string;
  resolutionHint: string;
  targetWorkspace: StudioWorkspaceId;
  affectedMarketplaces: MarketplaceName[];
  isAutoResolvable: boolean;
  currentValue?: string | number | null;
  suggestedValue?: string | number | null;
}

/**
 * Intelligent Exception Consolidation Engine.
 * Evaluates marketplace requirements across all connected channels,
 * merges identical requirements into a single master resolution item,
 * and classifies blockers vs warnings vs info items.
 */
export function buildConsolidatedExceptions(
  listing: MasterListing,
): ConsolidatedException[] {
  if (!listing) return [];

  const exceptions: ConsolidatedException[] = [];

  const isFootwear =
    listing.identity.category?.toLowerCase().includes("sandal") ||
    listing.identity.category?.toLowerCase().includes("footwear") ||
    listing.identity.category?.toLowerCase().includes("shoe") ||
    listing.identity.category?.toLowerCase().includes("clog");

  const hasCountryOfOrigin = listing.attributes?.some(
    (a) =>
      (a.key === "country_of_origin" || a.label?.toLowerCase() === "country of origin") &&
      Boolean(a.value)
  );

  const hasShoeSize = listing.attributes?.some(
    (a) =>
      (a.key === "shoe_size_uk" || a.key === "size" || a.label?.toLowerCase().includes("size")) &&
      Boolean(a.value)
  );

  const hasBrand = Boolean(listing.identity.brand?.trim());
  const hasCategory = Boolean(listing.identity.category?.trim());
  const hasHsn = Boolean(listing.identity.hsn?.trim());
  const hasSellingPrice = Number(listing.pricing?.sellingPrice) > 0;
  const hasMrp = Number(listing.pricing?.mrp) > 0;
  const hasPrimaryImage = listing.media?.some((m) => m.kind === "image" && m.url);
  const imageCount = listing.media?.filter((m) => m.kind === "image" && m.url)?.length ?? 0;

  // ── 1. Consolidated Country of Origin (Amazon + Flipkart + Myntra + Meesho) ──
  if (!hasCountryOfOrigin) {
    exceptions.push({
      id: "master-country-of-origin",
      fieldKey: "country_of_origin",
      fieldLabel: "Country of Origin",
      category: "COMPLIANCE",
      severity: "BLOCKER",
      status: "OPEN",
      reason: "Legal Metrology regulations mandate country of manufacture across Indian marketplaces.",
      resolutionHint: "Set country of origin (e.g. India) once in Master Attributes or Compliance.",
      targetWorkspace: "attributes",
      affectedMarketplaces: [
        MarketplaceName.AMAZON,
        MarketplaceName.FLIPKART,
        MarketplaceName.MYNTRA,
        MarketplaceName.MEESHO,
      ],
      isAutoResolvable: true,
      suggestedValue: "India",
    });
  }

  // ── 2. Consolidated Footwear Size (Myntra + Flipkart + Amazon) ──
  if (isFootwear && !hasShoeSize) {
    exceptions.push({
      id: "master-footwear-size",
      fieldKey: "shoe_size_uk",
      fieldLabel: "Standard Shoe Size (UK)",
      category: "ATTRIBUTES",
      severity: "BLOCKER",
      status: "OPEN",
      reason: "Footwear catalogs require standard size specifications for size-chart rendering.",
      resolutionHint: "Specify shoe_size_uk in Master Attributes.",
      targetWorkspace: "attributes",
      affectedMarketplaces: [MarketplaceName.MYNTRA, MarketplaceName.FLIPKART],
      isAutoResolvable: false,
    });
  }

  // ── 3. Brand Requirement (Flipkart + Amazon + Myntra) ──
  if (!hasBrand) {
    exceptions.push({
      id: "master-brand-required",
      fieldKey: "brand",
      fieldLabel: "Brand Name",
      category: "IDENTITY",
      severity: "BLOCKER",
      status: "OPEN",
      reason: "Marketplace brand gatekeeper checks require a registered or generic brand name.",
      resolutionHint: "Specify registered brand in Product Identity.",
      targetWorkspace: "identity",
      affectedMarketplaces: [
        MarketplaceName.FLIPKART,
        MarketplaceName.AMAZON,
        MarketplaceName.MYNTRA,
      ],
      isAutoResolvable: false,
    });
  }

  // ── 4. Primary Image Requirement (All Channels) ──
  if (!hasPrimaryImage) {
    exceptions.push({
      id: "master-primary-image",
      fieldKey: "primary_image",
      fieldLabel: "Primary Product Image",
      category: "MEDIA",
      severity: "BLOCKER",
      status: "OPEN",
      reason: "Every marketplace catalog rejects products without at least one high-resolution image.",
      resolutionHint: "Upload a primary image in Media Studio.",
      targetWorkspace: "media",
      affectedMarketplaces: [
        MarketplaceName.AMAZON,
        MarketplaceName.FLIPKART,
        MarketplaceName.MEESHO,
        MarketplaceName.MYNTRA,
        MarketplaceName.SHOPIFY,
      ],
      isAutoResolvable: false,
    });
  } else if (imageCount < 3) {
    exceptions.push({
      id: "master-gallery-recommendation",
      fieldKey: "gallery_images",
      fieldLabel: "Gallery Images (< 3 images)",
      category: "MEDIA",
      severity: "WARNING",
      status: "OPEN",
      reason: "Catalogs with 3+ images achieve up to 40% higher conversion and search ranking.",
      resolutionHint: "Add additional angles / lifestyle images in Media Studio.",
      targetWorkspace: "media",
      affectedMarketplaces: [MarketplaceName.AMAZON, MarketplaceName.FLIPKART, MarketplaceName.MYNTRA],
      isAutoResolvable: false,
    });
  }

  // ── 5. HSN Code (GST Compliance) ──
  if (!hasHsn) {
    exceptions.push({
      id: "master-hsn-code",
      fieldKey: "hsn",
      fieldLabel: "HSN Code",
      category: "COMPLIANCE",
      severity: "BLOCKER",
      status: "OPEN",
      reason: "GST invoices on Amazon, Flipkart and Meesho cannot be generated without an HSN code.",
      resolutionHint: "Auto-pull HSN from Purchase Bills or enter in Product Identity / Compliance.",
      targetWorkspace: "compliance",
      affectedMarketplaces: [
        MarketplaceName.AMAZON,
        MarketplaceName.FLIPKART,
        MarketplaceName.MEESHO,
        MarketplaceName.MYNTRA,
      ],
      isAutoResolvable: false,
    });
  }

  // ── 6. Pricing Rules ──
  if (!hasSellingPrice) {
    exceptions.push({
      id: "master-selling-price",
      fieldKey: "sellingPrice",
      fieldLabel: "Base Selling Price",
      category: "COMMERCIALS",
      severity: "BLOCKER",
      status: "OPEN",
      reason: "Selling price must be set before channel listings can calculate commission and markups.",
      resolutionHint: "Configure selling price in Commercials workspace.",
      targetWorkspace: "commercials",
      affectedMarketplaces: [
        MarketplaceName.AMAZON,
        MarketplaceName.FLIPKART,
        MarketplaceName.MEESHO,
        MarketplaceName.MYNTRA,
        MarketplaceName.SHOPIFY,
      ],
      isAutoResolvable: false,
    });
  } else if (hasMrp && Number(listing.pricing?.mrp) < Number(listing.pricing?.sellingPrice)) {
    exceptions.push({
      id: "master-mrp-violation",
      fieldKey: "mrp",
      fieldLabel: "MRP Below Selling Price",
      category: "COMMERCIALS",
      severity: "BLOCKER",
      status: "OPEN",
      reason: "Consumer Protection rules forbid selling above Maximum Retail Price.",
      resolutionHint: "Adjust MRP or Selling Price in Commercials workspace.",
      targetWorkspace: "commercials",
      affectedMarketplaces: [MarketplaceName.AMAZON, MarketplaceName.FLIPKART, MarketplaceName.MYNTRA],
      isAutoResolvable: false,
    });
  }

  // ── 7. SEO Content (Info / Warning) ──
  if (!listing.growth?.seoTitle) {
    exceptions.push({
      id: "master-seo-title",
      fieldKey: "seoTitle",
      fieldLabel: "SEO Optimized Title",
      category: "IDENTITY",
      severity: "INFO",
      status: "OPEN",
      reason: "SEO metadata helps organic Google and marketplace search indexing.",
      resolutionHint: "Generate or write an SEO title in Growth workspace.",
      targetWorkspace: "growth",
      affectedMarketplaces: [MarketplaceName.SHOPIFY, MarketplaceName.AMAZON],
      isAutoResolvable: true,
      suggestedValue: listing.identity.productName,
    });
  }

  return exceptions;
}

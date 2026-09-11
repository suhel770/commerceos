import type { MasterListing, ValidationIssue } from "@/lib/types/master-listing";
import { ValidationSeverity } from "@/lib/types/master-listing";
import type { Product } from "@/lib/types/product";

export type CompletenessStatus = "COMPLETE" | "ACTION_REQUIRED" | "INCOMPLETE";

export interface DimensionCompleteness {
  dimension: string;
  label: string;
  status: "COMPLETE" | "WARNING" | "MISSING";
  score: number; // 0 - 100
  weight: number;
  summary: string;
  reasons: string[];
}

export interface MasterCompletenessResult {
  overallScore: number;
  status: CompletenessStatus;
  isPublishReady: boolean;
  dimensions: DimensionCompleteness[];
  missingCount: number;
  warningCount: number;
}

/**
 * Evaluates Master Product completeness using extensible business rules
 * rather than naive field counting.
 */
export function evaluateMasterCompleteness(
  listing: MasterListing,
  product?: Product,
): MasterCompletenessResult {
  const dimensions: DimensionCompleteness[] = [];

  // 1. Identity Dimension (Weight: 20%)
  const hasTitle = Boolean(listing.identity.productName?.trim());
  const hasSku = Boolean(listing.identity.sku?.trim());
  const hasBrand = Boolean(listing.identity.brand?.trim());
  const hasCategory = Boolean(listing.identity.category?.trim());
  const hasDescription = Boolean(
    (listing as any).content?.shortDescription?.trim() ||
    (listing as any).shortDescription?.trim() ||
    product?.shortDescription?.trim() ||
    product?.description?.trim()
  );

  const identityReasons: string[] = [];
  if (!hasTitle) identityReasons.push("Product title is required");
  if (!hasSku) identityReasons.push("Master SKU is required");
  if (!hasBrand) identityReasons.push("Brand is required for multi-channel listing");
  if (!hasCategory) identityReasons.push("Master category is required for mapping");
  if (!hasDescription) identityReasons.push("Product description is recommended");

  const identityScore =
    (hasTitle ? 30 : 0) +
    (hasSku ? 25 : 0) +
    (hasBrand ? 20 : 0) +
    (hasCategory ? 15 : 0) +
    (hasDescription ? 10 : 0);

  dimensions.push({
    dimension: "identity",
    label: "Product Identity",
    status: hasTitle && hasSku && hasBrand && hasCategory ? "COMPLETE" : hasTitle && hasSku ? "WARNING" : "MISSING",
    score: identityScore,
    weight: 0.20,
    summary: hasTitle && hasSku && hasBrand && hasCategory ? "All identity fields configured" : "Critical identity fields missing",
    reasons: identityReasons,
  });

  // 2. Media Dimension (Weight: 15%)
  const images = listing.media?.filter((m) => m.kind === "image" && m.url) ?? [];
  const primaryImage = listing.media?.find((m) => m.kind === "image" && m.isPrimary && m.url) || images[0];
  const hasVideo = Boolean(product?.video || listing.media?.some((m) => m.kind === "video"));

  const mediaReasons: string[] = [];
  if (!primaryImage) mediaReasons.push("Primary product image is mandatory");
  if (images.length < 3) mediaReasons.push("At least 3 images recommended for marketplace catalogs");
  if (!hasVideo) mediaReasons.push("Product video improves conversion rates");

  let mediaScore = 0;
  if (primaryImage) mediaScore += 60;
  if (images.length >= 3) mediaScore += 25;
  else if (images.length >= 2) mediaScore += 15;
  if (hasVideo) mediaScore += 15;

  dimensions.push({
    dimension: "media",
    label: "Media Studio",
    status: primaryImage && images.length >= 3 ? "COMPLETE" : primaryImage ? "WARNING" : "MISSING",
    score: Math.min(100, mediaScore),
    weight: 0.15,
    summary: primaryImage ? `${images.length} image(s) available` : "No primary image provided",
    reasons: mediaReasons,
  });

  // 3. Commercials Dimension (Weight: 20%)
  const sellingPrice = Number(listing.pricing?.sellingPrice) || 0;
  const costPrice = Number(listing.pricing?.costPrice) || 0;
  const mrp = Number(listing.pricing?.mrp) || 0;

  const commercialReasons: string[] = [];
  if (sellingPrice <= 0) commercialReasons.push("Selling price must be greater than zero");
  if (mrp > 0 && mrp < sellingPrice) commercialReasons.push("MRP cannot be lower than selling price");
  if (costPrice > 0 && costPrice > sellingPrice) commercialReasons.push("Cost exceeds selling price (negative margin)");

  let commercialScore = 0;
  if (sellingPrice > 0) commercialScore += 50;
  if (mrp >= sellingPrice && sellingPrice > 0) commercialScore += 30;
  if (costPrice > 0 && costPrice <= sellingPrice) commercialScore += 20;

  dimensions.push({
    dimension: "commercials",
    label: "Pricing & Commercials",
    status: sellingPrice > 0 && (mrp === 0 || mrp >= sellingPrice) && (costPrice === 0 || costPrice <= sellingPrice) ? "COMPLETE" : sellingPrice > 0 ? "WARNING" : "MISSING",
    score: commercialScore,
    weight: 0.20,
    summary: sellingPrice > 0 ? `Selling price ₹${sellingPrice.toFixed(2)}` : "Selling price not configured",
    reasons: commercialReasons,
  });

  // 4. Inventory Dimension (Weight: 10%)
  const availableStock = listing.inventory?.available ?? product?.inventory?.available ?? 0;
  const inventoryReasons: string[] = [];
  if (availableStock <= 0) inventoryReasons.push("Zero units in stock. Syncing will show out-of-stock.");

  dimensions.push({
    dimension: "inventory",
    label: "Inventory Allocation",
    status: availableStock > 0 ? "COMPLETE" : "WARNING",
    score: availableStock > 0 ? 100 : 50,
    weight: 0.10,
    summary: availableStock > 0 ? `${availableStock} units available` : "0 stock (Out of stock)",
    reasons: inventoryReasons,
  });

  // 5. Variants Dimension (Weight: 10%)
  // Rule: Non-variant products are NOT penalized for not having variants!
  const variants = listing.variants ?? [];
  const variantReasons: string[] = [];
  let variantScore = 100;
  let variantStatus: "COMPLETE" | "WARNING" | "MISSING" = "COMPLETE";

  if (variants.length > 0) {
    const duplicateSkus = variants.filter(
      (v, idx, arr) => arr.findIndex((c) => c.sku.toLowerCase().trim() === v.sku.toLowerCase().trim()) !== idx
    );
    if (duplicateSkus.length > 0) {
      variantReasons.push("Duplicate variant SKUs detected");
      variantScore = 30;
      variantStatus = "MISSING";
    }
  }

  dimensions.push({
    dimension: "variants",
    label: "Variant Architecture",
    status: variantStatus,
    score: variantScore,
    weight: 0.10,
    summary: variants.length > 0 ? `${variants.length} variant(s) configured` : "Single standalone product (No variants)",
    reasons: variantReasons,
  });

  // 6. Attributes Dimension (Weight: 10%)
  const attrs = listing.attributes ?? [];
  const filledAttrs = attrs.filter((a) => a.value !== undefined && a.value !== null && String(a.value).trim() !== "");
  const attrReasons: string[] = [];
  if (filledAttrs.length === 0) attrReasons.push("No attributes configured");

  const attrScore = attrs.length > 0 ? Math.round((filledAttrs.length / attrs.length) * 100) : (hasCategory ? 60 : 20);

  dimensions.push({
    dimension: "attributes",
    label: "Product Attributes",
    status: filledAttrs.length >= 2 ? "COMPLETE" : filledAttrs.length > 0 ? "WARNING" : "MISSING",
    score: attrScore,
    weight: 0.10,
    summary: `${filledAttrs.length} attribute(s) specified`,
    reasons: attrReasons,
  });

  // 7. Compliance Dimension (Weight: 15%)
  const hasHsn = Boolean(listing.identity.hsn || product?.hsn);
  const hasGst = Boolean(listing.pricing?.taxPercentage !== undefined && listing.pricing.taxPercentage >= 0);
  const complianceReasons: string[] = [];
  if (!hasHsn) complianceReasons.push("HSN code required for GST invoice compliance");
  if (!hasGst) complianceReasons.push("GST tax rate required");

  let compScore = 0;
  if (hasHsn) compScore += 50;
  if (hasGst) compScore += 50;

  dimensions.push({
    dimension: "compliance",
    label: "Tax & Compliance",
    status: hasHsn && hasGst ? "COMPLETE" : hasHsn || hasGst ? "WARNING" : "MISSING",
    score: compScore,
    weight: 0.15,
    summary: hasHsn && hasGst ? "HSN and GST rate configured" : "Compliance details incomplete",
    reasons: complianceReasons,
  });

  // Compute Overall Weighted Score
  const overallScore = Math.round(
    dimensions.reduce((acc, dim) => acc + dim.score * dim.weight, 0)
  );

  const missingCount = dimensions.filter((d) => d.status === "MISSING").length;
  const warningCount = dimensions.filter((d) => d.status === "WARNING").length;

  const isPublishReady =
    hasTitle &&
    hasSku &&
    hasCategory &&
    Boolean(primaryImage) &&
    sellingPrice > 0 &&
    hasHsn;

  const status: CompletenessStatus =
    missingCount === 0 && warningCount === 0
      ? "COMPLETE"
      : isPublishReady
      ? "ACTION_REQUIRED"
      : "INCOMPLETE";

  return {
    overallScore,
    status,
    isPublishReady,
    dimensions,
    missingCount,
    warningCount,
  };
}

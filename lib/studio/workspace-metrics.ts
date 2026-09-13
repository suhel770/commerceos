import type { StudioWorkspaceId } from "@/components/products/studio/config/studio.config";
import { computePublishingReadinessScore } from "@/lib/listing-engine/readiness/compute-readiness";
import type { MasterListing } from "@/lib/types/master-listing";
import { ValidationSeverity } from "@/lib/types/master-listing";
import type { Product } from "@/lib/types/product";

export type WorkspaceStatus = "ready" | "attention" | "progress";

export interface WorkspaceMetric {
  label: string;
  value: string | number;
}

export interface WorkspaceSummary {
  id: StudioWorkspaceId;
  status: WorkspaceStatus;
  metrics: WorkspaceMetric[];
  ai?: boolean;
}

export function computePublishingScore(listing: MasterListing): number {
  return computePublishingReadinessScore(listing);
}

function countFilledAttributes(listing: MasterListing): {
  filled: number;
  total: number;
} {
  const total = listing.attributes?.length || 0;
  if (total === 0) return { filled: 0, total: 0 };

  const filled = listing.attributes.filter((attribute) => {
    const value = attribute.value;
    if (value === null || value === undefined || value === "") {
      return false;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return true;
  }).length;

  return { filled, total };
}

function formatCurrency(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function computeWorkspaceSummaries(
  listing: MasterListing,
  product?: Product,
): WorkspaceSummary[] {
  const publishingScore = computePublishingScore(listing);
  const attributeStats = countFilledAttributes(listing);
  const attributeFillPercent = attributeStats.total > 0
    ? Math.round((attributeStats.filled / attributeStats.total) * 100)
    : 0;
  const missingAttributes = attributeStats.total - attributeStats.filled;
  
  const variantCount = listing.variants?.length ?? (product as any)?.variants?.length ?? 0;
  const imageCount = listing.media?.length ?? product?.gallery?.length ?? (product?.image ? 1 : 0);
  
  const sellingPrice = Number(listing.pricing?.sellingPrice || product?.pricing?.sellingPrice || 0);
  const costPrice = Number(listing.pricing?.costPrice || product?.pricing?.costPrice || 0);
  const hasPricing = sellingPrice > 0;
  const profit = hasPricing ? sellingPrice - costPrice : 0;
  const margin = hasPricing ? Math.round((profit / sellingPrice) * 100) : 0;

  const connectedChannels = listing.marketplaces?.filter((m) => m.enabled)?.length ?? 0;
  const healthyChannels = listing.marketplaces?.filter((m) => m.validationScore >= 90)?.length ?? 0;
  const channelHealth = connectedChannels > 0 ? Math.round((healthyChannels / connectedChannels) * 100) : 0;

  const availableStock = listing.inventory?.available ?? product?.inventory?.available ?? 0;
  const reservedStock = listing.inventory?.reserved ?? product?.inventory?.reserved ?? 0;

  const hasHsn = Boolean(listing.identity?.hsn || product?.hsn);
  const gstRate = listing.identity?.taxCode || (product?.gstRate !== undefined ? `${product.gstRate}%` : null);

  const issueCount = listing.validationIssues?.filter(
    (issue) =>
      issue.severity === ValidationSeverity.ERROR ||
      issue.severity === ValidationSeverity.WARNING,
  )?.length ?? 0;

  return [
    {
      id: "identity",
      status: listing.identity?.brand && listing.identity?.sku ? "ready" : "attention",
      metrics: [
        { label: "Brand", value: listing.identity?.brand || "Not set" },
        { label: "SKU", value: listing.identity?.sku || "Not set" },
      ],
    },
    {
      id: "media",
      status: imageCount >= 1 ? "ready" : "attention",
      ai: true,
      metrics: [
        { label: "Images", value: imageCount },
        { label: "Videos", value: product?.video ? 1 : 0 },
      ],
    },
    {
      id: "commercials",
      status: hasPricing ? "ready" : "attention",
      metrics: [
        { label: "Margin", value: hasPricing ? `${margin}%` : "Not set" },
        { label: "Profit", value: hasPricing ? formatCurrency(profit) : "Not set" },
      ],
    },
    {
      id: "inventory",
      status: availableStock > 0 ? "ready" : "attention",
      metrics: [
        { label: "Available", value: availableStock },
        { label: "Reserved", value: reservedStock },
      ],
    },
    {
      id: "logistics",
      status: listing.commercials?.packageLengthCm && listing.commercials?.weightGrams ? "ready" : "attention",
      metrics: [
        {
          label: "Vol. Wt",
          value: listing.commercials?.packageLengthCm && listing.commercials?.packageWidthCm && listing.commercials?.packageHeightCm
            ? `${((listing.commercials.packageLengthCm * listing.commercials.packageWidthCm * listing.commercials.packageHeightCm) / 5000).toFixed(2)} kg`
            : "Not set",
        },
        {
          label: "Gross Wt",
          value: listing.commercials?.weightGrams ? `${listing.commercials.weightGrams}g` : "Not set",
        },
      ],
    },
    {
      id: "attributes",
      status: attributeStats.total > 0 && attributeFillPercent >= 80 ? "ready" : "attention",
      metrics: [
        {
          label: "Filled",
          value: attributeStats.total > 0 ? `${attributeFillPercent}%` : "0%",
        },
        {
          label: "Missing",
          value: missingAttributes,
        },
      ],
    },
    {
      id: "variants",
      status: variantCount > 0 ? "ready" : "attention",
      metrics: [
        { label: "Variants", value: variantCount },
        {
          label: "Active",
          value: listing.variants?.filter((v) => v.active)?.length ?? variantCount,
        },
      ],
    },
    {
      id: "growth",
      status: listing.growth?.seoTitle ? "ready" : "progress",
      ai: true,
      metrics: [
        {
          label: "SEO Score",
          value: listing.growth?.seoTitle && listing.growth?.metaDescription ? "80/100" : "0/100",
        },
        {
          label: "Ideas",
          value: listing.aiInsights?.filter((i) => !i.applied)?.length ?? 0,
        },
      ],
    },
    {
      id: "channels",
      status: connectedChannels > 0 ? "ready" : "attention",
      metrics: [
        { label: "Connected", value: connectedChannels },
        { label: "Healthy", value: connectedChannels > 0 ? `${channelHealth}%` : "0%" },
      ],
    },
    {
      id: "compliance",
      status: hasHsn && gstRate ? "ready" : "attention",
      metrics: [
        { label: "GST", value: gstRate ? (gstRate.includes("%") ? gstRate : `${gstRate}%`) : "Pending" },
        { label: "HSN", value: hasHsn ? "Configured" : "Pending" },
      ],
    },
    {
      id: "publishing",
      status: publishingScore >= 80 ? "ready" : "attention",
      ai: true,
      metrics: [
        {
          label: "Readiness",
          value: `${publishingScore}%`,
        },
        {
          label: "Errors",
          value: issueCount,
        },
      ],
    },
    {
      id: "activity",
      status: "ready",
      metrics: [
        {
          label: "Events",
          value: listing.activity?.length ?? 0,
        },
        {
          label: "Today",
          value: listing.activity?.filter((e) => e.timestamp?.startsWith(new Date().toISOString().slice(0, 10)))?.length ?? 0,
        },
      ],
    },
  ];
}

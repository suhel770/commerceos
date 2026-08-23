import type { StudioWorkspaceId } from "@/components/products/studio/config/studio.config";

import { computePublishingReadinessScore } from "@/lib/listing-engine/readiness/compute-readiness";
import type {
  MasterListing,
} from "@/lib/types/master-listing";
import { ValidationSeverity } from "@/lib/types/master-listing";

import type { Product } from "@/lib/types/product";

export type WorkspaceStatus =
  | "ready"
  | "attention"
  | "progress";

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

export function computePublishingScore(
  listing: MasterListing,
): number {
  return computePublishingReadinessScore(listing);
}

function countFilledAttributes(
  listing: MasterListing,
): {
  filled: number;
  total: number;
} {
  const total = listing.attributes.length || 1;
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

function countVariants(
  listing: MasterListing,
): number {
  return listing.variants.length;
}

function formatCurrency(
  amount: number,
): string {
  return `₹${Math.round(amount)}`;
}

export function computeWorkspaceSummaries(
  listing: MasterListing,
  product?: Product,
): WorkspaceSummary[] {
  const publishingScore = computePublishingScore(listing);
  const attributeStats = countFilledAttributes(listing);
  const attributeFillPercent = Math.round(
    (attributeStats.filled / attributeStats.total) * 100,
  );
  const missingAttributes = attributeStats.total - attributeStats.filled;
  const variantCount = countVariants(listing);
  const imageCount = listing.media.length;
  const profit =
    listing.pricing.sellingPrice - listing.pricing.costPrice;
  const margin = listing.pricing.sellingPrice
    ? Math.round((profit / listing.pricing.sellingPrice) * 100)
    : 0;
  const connectedChannels = listing.marketplaces.filter(
    (marketplace) => marketplace.enabled,
  ).length;
  const healthyChannels = listing.marketplaces.filter(
    (marketplace) => marketplace.validationScore >= 90,
  ).length;
  const channelHealth = connectedChannels
    ? Math.round((healthyChannels / connectedChannels) * 100)
    : 0;
  const aiScore =
    product?.performance.healthScore ?? 94;
  const growthFields = [
    listing.growth.seoTitle,
    listing.growth.metaDescription,
    listing.growth.searchTerms.length,
    listing.growth.bulletPoints.length,
    listing.growth
      .merchandisingTags.length,
  ];
  const seoScore = Math.round(
    (growthFields.filter(Boolean)
      .length /
      growthFields.length) *
      100,
  );
  const pendingInsights = listing.aiInsights.filter(
    (insight) => !insight.applied,
  ).length;
  const issueCount = listing.validationIssues.filter(
    (issue) =>
      issue.severity === ValidationSeverity.ERROR ||
      issue.severity === ValidationSeverity.WARNING,
  ).length;
  const hasHsn = Boolean(listing.identity.hsn);
  const hasGst = Boolean(listing.identity.taxCode);

  return [
    {
      id: "identity",
      status: "ready",
      metrics: [
        { label: "Brand", value: listing.identity.brand },
        { label: "SKU", value: listing.identity.sku },
      ],
    },
    {
      id: "media",
      status: imageCount >= 6 ? "ready" : "attention",
      ai: true,
      metrics: [
        { label: "Images", value: imageCount },
        { label: "AI Score", value: aiScore },
      ],
    },
    {
      id: "commercials",
      status: margin >= 30 ? "ready" : "attention",
      metrics: [
        { label: "Margin", value: `${margin}%` },
        { label: "Profit", value: formatCurrency(profit) },
      ],
    },
    {
      id: "inventory",
      status:
        listing.inventory.available >
        listing.inventory.safetyStock
          ? "ready"
          : "attention",
      metrics: [
        {
          label: "Available",
          value:
            listing.inventory
              .available,
        },
        {
          label: "Reserved",
          value:
            listing.inventory
              .reserved,
        },
      ],
    },
    {
      id: "supply",
      status:
        listing.supply
          .primarySupplier
          ? "ready"
          : "attention",
      metrics: [
        {
          label: "Supplier",
          value:
            listing.supply
              .primarySupplier ??
            "Missing",
        },
        {
          label: "Lead Time",
          value:
            listing.supply
              .leadTimeDays !==
            undefined
              ? `${listing.supply.leadTimeDays}d`
              : "—",
        },
      ],
    },
    {
      id: "attributes",
      status:
        attributeFillPercent >= 85
          ? "ready"
          : "attention",
      metrics: [
        {
          label: "Filled",
          value: `${attributeFillPercent}%`,
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
          value:
            listing.variants.filter(
              (variant) =>
                variant.active,
            ).length,
        },
      ],
    },
    {
      id: "growth",
      status: seoScore >= 85 ? "ready" : "progress",
      ai: true,
      metrics: [
        { label: "SEO", value: seoScore },
        {
          label: "Ideas",
          value: pendingInsights,
        },
      ],
    },
    {
      id: "channels",
      status: channelHealth >= 90 ? "ready" : "attention",
      metrics: [
        { label: "Connected", value: connectedChannels },
        { label: "Healthy", value: `${channelHealth}%` },
      ],
    },
    {
      id: "compliance",
      status: hasHsn && hasGst ? "ready" : "attention",
      metrics: [
        { label: "GST", value: hasGst ? "OK" : "—" },
        { label: "HSN", value: hasHsn ? "Ready" : "—" },
      ],
    },
    {
      id: "publishing",
      status:
        publishingScore >= 90
          ? "ready"
          : "attention",
      ai: true,
      metrics: [
        {
          label: "Ready",
          value: `${publishingScore}%`,
        },
        {
          label: "Issues",
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
          value:
            listing.activity.length,
        },
        {
          label: "Today",
          value:
            listing.activity.filter(
              (event) =>
                event.timestamp.startsWith(
                  new Date()
                    .toISOString()
                    .slice(0, 10),
                ),
            ).length,
        },
      ],
    },
  ];
}

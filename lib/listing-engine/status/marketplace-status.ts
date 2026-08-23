import {
  MarketplacePublishStatus,
  type MarketplaceConnection,
  type MasterListing,
} from "@/lib/types/master-listing";

/**
 * Flowchart Step 7 — Marketplace Status Tracking legend.
 * Operational channel status shown in unified management / monitoring.
 */
export type MarketplaceOperationalStatus =
  | "active"
  | "partial_active"
  | "out_of_stock"
  | "draft"
  | "error"
  | "paused"
  | "inactive";

export type MarketplaceVisibility = "high" | "medium" | "low";

export type MarketplaceHealthLabel = "healthy" | "action_required";

export interface MarketplaceStatusCard {
  marketplace: MarketplaceConnection["marketplace"];
  operationalStatus: MarketplaceOperationalStatus;
  health: MarketplaceHealthLabel;
  platformId?: string;
  stock: number;
  visibility: MarketplaceVisibility;
  lastSyncAt?: string;
  publishStatus: MarketplacePublishStatus;
  enabled: boolean;
  readinessScore: number;
  openErrors: number;
}

export function deriveOperationalStatus(input: {
  connection: MarketplaceConnection;
  availableStock: number;
  openErrors: number;
}): MarketplaceOperationalStatus {
  const { connection, availableStock, openErrors } = input;

  if (!connection.enabled) {
    return "paused";
  }

  if (
    connection.publishStatus === MarketplacePublishStatus.FAILED ||
    openErrors > 0
  ) {
    return "error";
  }

  if (
    connection.publishStatus === MarketplacePublishStatus.NOT_CONNECTED ||
    connection.publishStatus === MarketplacePublishStatus.NOT_PUBLISHED ||
    connection.publishStatus === MarketplacePublishStatus.VALIDATING ||
    connection.publishStatus === MarketplacePublishStatus.READY ||
    connection.publishStatus === MarketplacePublishStatus.PUBLISHING
  ) {
    return "draft";
  }

  if (connection.publishStatus === MarketplacePublishStatus.SYNCING) {
    return availableStock > 0 ? "partial_active" : "out_of_stock";
  }

  if (connection.publishStatus === MarketplacePublishStatus.PUBLISHED) {
    if (availableStock <= 0) {
      return "out_of_stock";
    }

    if (connection.validationScore < 85) {
      return "partial_active";
    }

    return "active";
  }

  return "inactive";
}

export function deriveVisibility(
  score: number,
  operationalStatus: MarketplaceOperationalStatus,
): MarketplaceVisibility {
  if (
    operationalStatus === "error" ||
    operationalStatus === "out_of_stock" ||
    operationalStatus === "inactive"
  ) {
    return "low";
  }

  if (score >= 90 && operationalStatus === "active") {
    return "high";
  }

  return "medium";
}

export function buildMarketplaceStatusCards(
  listing: MasterListing,
  openErrorsByMarketplace: Partial<
    Record<MarketplaceConnection["marketplace"], number>
  > = {},
): MarketplaceStatusCard[] {
  return listing.marketplaces.map((connection) => {
    const openErrors =
      openErrorsByMarketplace[connection.marketplace] ?? 0;
    const operationalStatus = deriveOperationalStatus({
      connection,
      availableStock: listing.inventory.available,
      openErrors,
    });
    const visibility = deriveVisibility(
      connection.validationScore,
      operationalStatus,
    );

    return {
      marketplace: connection.marketplace,
      operationalStatus,
      health:
        operationalStatus === "active" ||
        operationalStatus === "partial_active"
          ? openErrors === 0 && connection.validationScore >= 80
            ? "healthy"
            : "action_required"
          : "action_required",
      platformId: connection.externalId ?? connection.listingId,
      stock: listing.inventory.available,
      visibility,
      lastSyncAt: connection.lastSyncedAt ?? connection.lastPublishedAt,
      publishStatus: connection.publishStatus,
      enabled: connection.enabled,
      readinessScore: connection.validationScore,
      openErrors,
    };
  });
}

export function operationalStatusLabel(
  status: MarketplaceOperationalStatus,
): string {
  switch (status) {
    case "active":
      return "Active";
    case "partial_active":
      return "Partial Active";
    case "out_of_stock":
      return "Out of Stock";
    case "draft":
      return "Draft";
    case "error":
      return "Error";
    case "paused":
      return "Paused";
    default:
      return "Inactive";
  }
}

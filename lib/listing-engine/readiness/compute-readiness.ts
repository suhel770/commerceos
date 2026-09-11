import { getMarketplaceAdapter } from "@/lib/marketplace/adapters/generic.adapter";
import { getMarketplaceRegistry } from "@/lib/marketplace/registry/marketplace-registry";
import { scoreFromIssues } from "@/lib/marketplace/adapters/types";
import { validateMasterListing } from "@/lib/domain/master-product/validate-master-listing";
import { evaluateMasterCompleteness } from "../completeness/completeness-engine";
import { buildConsolidatedExceptions } from "../exceptions/exception-intelligence";
import {
  MarketplaceName,
  type MasterListing,
  ValidationSeverity,
  type ValidationIssue,
} from "@/lib/types/master-listing";
import type {
  ChannelReadiness,
  ListingValidationResult,
} from "../types";

export type ChannelPublishState =
  | "READY"
  | "ACTION_REQUIRED"
  | "NOT_CONNECTED"
  | "NOT_CONFIGURED"
  | "BLOCKED"
  | "ERROR";

export interface ChannelReadinessFactor {
  name: string;
  isReady: boolean;
  message?: string;
}

export interface DetailedChannelReadiness {
  marketplace: MarketplaceName;
  name: string;
  state: ChannelPublishState;
  score: number;
  isConnected: boolean;
  blockers: string[];
  warnings: string[];
  factors: {
    identity: ChannelReadinessFactor;
    category: ChannelReadinessFactor;
    commercials: ChannelReadinessFactor;
    media: ChannelReadinessFactor;
    attributes: ChannelReadinessFactor;
    compliance: ChannelReadinessFactor;
  };
  preparedPayloadSummary: {
    title: string;
    price: number;
    sku: string;
    attributeCount: number;
  };
}

export interface UnifiedPipelineResult extends ListingValidationResult {
  isMasterValid: boolean;
  channelReadiness: DetailedChannelReadiness[];
  eligiblePublishCount: number;
  blockingCount: number;
}

/**
 * Computes deep multi-channel readiness using domain rules and adapters.
 */
export function computeDetailedChannelReadiness(
  listing: MasterListing,
): DetailedChannelReadiness[] {
  const supportedChannels = [
    MarketplaceName.AMAZON,
    MarketplaceName.FLIPKART,
    MarketplaceName.MEESHO,
    MarketplaceName.MYNTRA,
    MarketplaceName.SHOPIFY,
  ];

  const hasTitle = Boolean(listing.identity.productName?.trim());
  const hasSku = Boolean(listing.identity.sku?.trim());
  const hasCategory = Boolean(listing.identity.category?.trim());
  const hasPrice = Number(listing.pricing?.sellingPrice) > 0;
  const hasMrp = Number(listing.pricing?.mrp) > 0;
  const priceInvalid = hasPrice && hasMrp && Number(listing.pricing?.mrp) < Number(listing.pricing?.sellingPrice);
  const hasPrimaryImage = listing.media?.some((m) => m.kind === "image" && m.url);
  const hasCountryOfOrigin = listing.attributes?.some(
    (a) => (a.key === "country_of_origin" || a.label?.toLowerCase() === "country of origin") && Boolean(a.value)
  );
  const hasShoeSize = listing.attributes?.some(
    (a) => (a.key === "shoe_size_uk" || a.key === "size") && Boolean(a.value)
  );
  const isFootwear =
    listing.identity.category?.toLowerCase().includes("sandal") ||
    listing.identity.category?.toLowerCase().includes("footwear") ||
    listing.identity.category?.toLowerCase().includes("shoe");

  const hasHsn = Boolean(listing.identity.hsn || (listing as any).hsn);

  return supportedChannels.map((marketplace) => {
    const registry = getMarketplaceRegistry(marketplace);
    const connection = listing.marketplaces?.find((m) => m.marketplace === marketplace);
    const isConnected = Boolean(connection?.enabled);

    const blockers: string[] = [];
    const warnings: string[] = [];

    // Identity check
    if (!hasTitle) blockers.push("Product title is required");
    if (!hasSku) blockers.push("Master SKU is required");

    // Category check
    if (!hasCategory) blockers.push("Category mapping is required");

    // Commercials check
    if (!hasPrice) {
      blockers.push("Selling price is required");
    } else if (priceInvalid) {
      blockers.push("MRP cannot be lower than selling price");
    }

    // Media check
    if (!hasPrimaryImage) blockers.push("Primary image required");

    // Channel specific attribute checks
    if (marketplace === MarketplaceName.MYNTRA) {
      if (isFootwear && !hasShoeSize) blockers.push("Myntra catalog requires UK shoe size");
    } else if (marketplace === MarketplaceName.AMAZON) {
      if (!hasCountryOfOrigin) blockers.push("Amazon compliance requires Country of Origin");
      if (!hasHsn) warnings.push("Amazon GST invoice recommends HSN code");
    } else if (marketplace === MarketplaceName.FLIPKART) {
      if (!listing.identity.brand?.trim()) blockers.push("Flipkart requires a registered brand name");
      if (!hasCountryOfOrigin) blockers.push("Flipkart legal metrology requires Country of Origin");
    } else if (marketplace === MarketplaceName.MEESHO) {
      if (!hasHsn) warnings.push("HSN code recommended for Meesho GST invoicing");
    }

    // Determine state
    let state: ChannelPublishState = "NOT_CONNECTED";
    if (!isConnected) {
      state = "NOT_CONNECTED";
    } else if (priceInvalid) {
      state = "BLOCKED";
    } else if (blockers.length === 0) {
      state = "READY";
    } else if (blockers.length > 0) {
      state = "ACTION_REQUIRED";
    }

    // Calculate score
    let score = 0;
    if (hasTitle && hasSku) score += 20;
    if (hasCategory) score += 20;
    if (hasPrice && !priceInvalid) score += 20;
    if (hasPrimaryImage) score += 20;
    if (hasCountryOfOrigin) score += 10;
    if (!isFootwear || hasShoeSize) score += 10;

    const adapter = getMarketplaceAdapter(marketplace);
    let preparedSummary = {
      title: listing.identity.productName || "—",
      price: Number(listing.pricing?.sellingPrice) || 0,
      sku: listing.identity.sku || "—",
      attributeCount: listing.attributes?.length ?? 0,
    };

    try {
      const payload = adapter.transform(listing);
      preparedSummary = {
        title: payload.title || listing.identity.productName,
        price: payload.price || Number(listing.pricing?.sellingPrice) || 0,
        sku: payload.externalSku || listing.identity.sku,
        attributeCount: Object.keys(payload.attributes || {}).length,
      };
    } catch {}

    return {
      marketplace,
      name: registry.name,
      state,
      score: isConnected ? score : 0,
      isConnected,
      blockers,
      warnings,
      factors: {
        identity: { name: "Identity", isReady: hasTitle && hasSku },
        category: { name: "Category", isReady: hasCategory },
        commercials: { name: "Pricing", isReady: hasPrice && !priceInvalid },
        media: { name: "Media", isReady: Boolean(hasPrimaryImage) },
        attributes: { name: "Attributes", isReady: !isFootwear || hasShoeSize },
        compliance: { name: "Compliance", isReady: hasCountryOfOrigin },
      },
      preparedPayloadSummary: preparedSummary,
    };
  });
}

/** Legacy adapter-based channel readiness for pipeline monitoring */
export function computeChannelReadiness(listing: MasterListing): ChannelReadiness[] {
  return listing.marketplaces.map((connection) => {
    const adapter = getMarketplaceAdapter(connection.marketplace);
    const readiness = adapter.readiness(listing);

    return {
      marketplace: connection.marketplace,
      score: readiness.score,
      blockers: readiness.blockers,
      warnings: readiness.warnings,
      publishStatus: connection.publishStatus,
      enabled: connection.enabled,
      externalId: connection.externalId,
      lastSyncedAt: connection.lastSyncedAt,
      lastPublishedAt: connection.lastPublishedAt,
    };
  });
}

/**
 * High-level pipeline validation for studio header and publishing gate.
 */
export function validateListingPipeline(listing: MasterListing): UnifiedPipelineResult {
  const masterValidation = validateMasterListing(listing);
  const detailedReadiness = computeDetailedChannelReadiness(listing);
  const channels = computeChannelReadiness(listing);

  const eligibleChannels = detailedReadiness.filter((c) => c.state === "READY");
  const blockingChannels = detailedReadiness.filter((c) => c.state === "BLOCKED" || c.state === "ACTION_REQUIRED");

  return {
    productId: listing.id,
    valid: masterValidation.valid && blockingChannels.length === 0,
    isMasterValid: masterValidation.valid,
    masterScore: masterValidation.score,
    masterIssues: masterValidation.issues,
    channels,
    channelReadiness: detailedReadiness,
    eligiblePublishCount: eligibleChannels.length,
    blockingCount: blockingChannels.length,
  };
}

/** Unified publishing readiness percentage used by Studio header */
export function computePublishingReadinessScore(listing: MasterListing): number {
  if (!listing) return 0;
  const result = validateListingPipeline(listing);
  const connected = result.channelReadiness.filter((c) => c.isConnected);

  if (connected.length === 0) {
    return result.masterScore;
  }

  const channelAverage =
    connected.reduce((sum, channel) => sum + channel.score, 0) / connected.length;

  return Math.round(result.masterScore * 0.40 + channelAverage * 0.60);
}

import { getMarketplaceAdapter } from "@/lib/marketplace/adapters/generic.adapter";
import { scoreFromIssues } from "@/lib/marketplace/adapters/types";
import { validateMasterListing } from "@/lib/domain/master-product/validate-master-listing";
import type { MasterListing } from "@/lib/types/master-listing";
import { ValidationSeverity } from "@/lib/types/master-listing";

import type {
  ChannelReadiness,
  ListingValidationResult,
} from "../types";

export function computeMasterScore(listing: MasterListing): number {
  const master = validateMasterListing(listing);
  return scoreFromIssues(master.issues);
}

export function computeChannelReadiness(
  listing: MasterListing,
): ChannelReadiness[] {
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

export function validateListingPipeline(
  listing: MasterListing,
): ListingValidationResult {
  const master = validateMasterListing(listing);
  const channels = computeChannelReadiness(listing);
  const enabledChannels = channels.filter((channel) => channel.enabled);
  const channelBlocking = enabledChannels.some(
    (channel) => channel.blockers.length > 0,
  );

  return {
    productId: listing.id,
    valid: master.valid && !channelBlocking,
    masterScore: scoreFromIssues(master.issues),
    masterIssues: master.issues,
    channels,
  };
}

/** Unified publishing readiness used by Studio header */
export function computePublishingReadinessScore(
  listing: MasterListing,
): number {
  const result = validateListingPipeline(listing);
  const enabled = result.channels.filter((channel) => channel.enabled);

  if (enabled.length === 0) {
    return result.masterScore;
  }

  const channelAverage =
    enabled.reduce((sum, channel) => sum + channel.score, 0) /
    enabled.length;

  return Math.round(result.masterScore * 0.45 + channelAverage * 0.55);
}

export function hasBlockingErrors(listing: MasterListing): boolean {
  const result = validateListingPipeline(listing);
  return (
    result.masterIssues.some(
      (issue) => issue.severity === ValidationSeverity.ERROR,
    ) ||
    result.channels
      .filter((channel) => channel.enabled)
      .some((channel) => channel.blockers.length > 0)
  );
}

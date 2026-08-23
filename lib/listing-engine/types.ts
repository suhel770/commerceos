import type {
  MarketplaceName,
  MarketplacePublishStatus,
  ValidationIssue,
} from "@/lib/types/master-listing";
import type { MarketplacePublishPayload } from "@/lib/marketplace/adapters/types";
import type {
  MarketplaceHealthLabel,
  MarketplaceOperationalStatus,
  MarketplaceVisibility,
} from "./status/marketplace-status";

export type ListingJobType =
  | "publish"
  | "sync_price"
  | "sync_inventory"
  | "sync_status";

/** Bible publish pipeline states */
export type ListingJobStatus =
  | "draft"
  | "validated"
  | "queued"
  | "publishing"
  | "published"
  | "failed";

export interface ListingJobError {
  code: string;
  message: string;
}

export interface ListingJob {
  id: string;
  type: ListingJobType;
  status: ListingJobStatus;
  organizationId: string;
  workspaceId: string;
  productId: string;
  marketplace: MarketplaceName;
  payload?: MarketplacePublishPayload;
  externalId?: string;
  listingUrl?: string;
  error?: ListingJobError;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ChannelReadiness {
  marketplace: MarketplaceName;
  score: number;
  blockers: ValidationIssue[];
  warnings: ValidationIssue[];
  publishStatus: MarketplacePublishStatus;
  enabled: boolean;
  externalId?: string;
  lastSyncedAt?: string;
  lastPublishedAt?: string;
}

export interface ListingValidationResult {
  productId: string;
  valid: boolean;
  masterScore: number;
  masterIssues: ValidationIssue[];
  channels: ChannelReadiness[];
}

export interface ListingMonitorSnapshot {
  productId: string;
  marketplace: MarketplaceName;
  healthScore: number;
  publishStatus: MarketplacePublishStatus;
  operationalStatus: MarketplaceOperationalStatus;
  health: MarketplaceHealthLabel;
  visibility: MarketplaceVisibility;
  platformId?: string;
  stock: number;
  lastSyncAt?: string;
  lastPublishedAt?: string;
  openErrors: number;
  inventorySyncOk: boolean;
  priceSyncOk: boolean;
  contentSyncOk: boolean;
  suppressed: boolean;
  policyWatch: boolean;
  buyBoxRisk: boolean;
}

export interface ListingIndexItem {
  id: string;
  productId: string;
  marketplace: MarketplaceName;
  title: string;
  sku: string;
  publishStatus: MarketplacePublishStatus;
  operationalStatus: MarketplaceOperationalStatus;
  health: MarketplaceHealthLabel;
  visibility: MarketplaceVisibility;
  validationScore: number;
  stock: number;
  externalId?: string;
  listingUrl?: string;
  lastSyncedAt?: string;
  enabled: boolean;
  openErrors: number;
}

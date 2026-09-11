import type {
  MarketplaceName,
  MasterListing,
  ValidationIssue,
} from "@/lib/types/master-listing";

export interface MarketplacePublishPayload {
  marketplace: MarketplaceName;
  externalSku: string;
  title: string;
  price: number;
  quantity: number;
  attributes: Record<string, unknown>;
  category?: string;
  brand?: string;
  images?: string[];
  hsn?: string;
  description?: string;
  bulletPoints?: string[];
}

export interface MarketplaceReadiness {
  score: number;
  blockers: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface MarketplacePublishResult {
  marketplace: MarketplaceName;
  externalId?: string;
  listingUrl?: string;
  status: "SUCCESS" | "FAILED" | "PENDING_VERIFICATION";
  errors?: string[];
}

export interface MarketplaceSyncResult {
  marketplace: MarketplaceName;
  ok: boolean;
  syncedAt: string;
  message: string;
  error?: string;
}

export interface MarketplaceAdapter {
  marketplace: MarketplaceName;

  validate(listing: MasterListing): ValidationIssue[];

  mapAttributes(listing: MasterListing): Record<string, unknown>;

  transform(listing: MasterListing): MarketplacePublishPayload;

  readiness(listing: MasterListing): MarketplaceReadiness;

  publish?(
    connectionId: string,
    payload: MarketplacePublishPayload,
  ): Promise<MarketplacePublishResult>;

  syncInventory?(
    connectionId: string,
    externalSku: string,
    quantity: number,
  ): Promise<MarketplaceSyncResult>;

  syncPrice?(
    connectionId: string,
    externalSku: string,
    price: number,
  ): Promise<MarketplaceSyncResult>;
}

export function scoreFromIssues(issues: ValidationIssue[]): number {
  let score = 100;

  for (const issue of issues) {
    if (issue.severity === "error") {
      score -= 20;
    } else if (issue.severity === "warning") {
      score -= 8;
    } else {
      score -= 2;
    }
  }

  return Math.max(0, Math.min(100, score));
}

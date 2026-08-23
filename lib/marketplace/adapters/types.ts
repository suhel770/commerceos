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
}

export interface MarketplaceReadiness {
  score: number;
  blockers: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface MarketplaceAdapter {
  marketplace: MarketplaceName;

  validate(listing: MasterListing): ValidationIssue[];

  mapAttributes(listing: MasterListing): Record<string, unknown>;

  transform(listing: MasterListing): MarketplacePublishPayload;

  readiness(listing: MasterListing): MarketplaceReadiness;
}

export function scoreFromIssues(
  issues: ValidationIssue[],
): number {
  let score = 100;

  for (const issue of issues) {
    if (issue.severity === "error") {
      score -= 18;
    } else if (issue.severity === "warning") {
      score -= 6;
    } else {
      score -= 2;
    }
  }

  return Math.max(0, Math.min(100, score));
}

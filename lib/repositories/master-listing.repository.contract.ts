import type {
  MarketplaceName,
  MarketplacePublishStatus,
  MasterListing,
  ValidationIssue,
} from "@/lib/types/master-listing";

export interface MasterListingRepositoryContract {
  getAll(): Promise<MasterListing[]>;
  getById(
    id: string,
  ): Promise<MasterListing | null>;
  getBySku(
    sku: string,
  ): Promise<MasterListing | null>;
  create(
    listing: MasterListing,
  ): Promise<MasterListing>;
  update(
    id: string,
    updates: Partial<MasterListing>,
  ): Promise<MasterListing | null>;
  updateWithRevision(
    id: string,
    updates: Partial<MasterListing>,
    expectedRevision: number,
  ): Promise<MasterListing | null>;
  delete(id: string): Promise<boolean>;
  archive(
    id: string,
  ): Promise<MasterListing | null>;
  updatePricing(
    id: string,
    sellingPrice: number,
    mrp: number,
    costPrice: number,
  ): Promise<MasterListing | null>;
  updateInventory(
    id: string,
    available: number,
  ): Promise<MasterListing | null>;
  replaceValidationIssues(
    id: string,
    issues: ValidationIssue[],
  ): Promise<MasterListing | null>;
  updateMarketplaceStatus(
    id: string,
    marketplace: MarketplaceName,
    status: MarketplacePublishStatus,
  ): Promise<MasterListing | null>;
  publish(
    id: string,
  ): Promise<MasterListing | null>;
  markReady(
    id: string,
  ): Promise<MasterListing | null>;
}

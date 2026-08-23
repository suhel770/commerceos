import type { Product } from "@/lib/types/product";
import type {
  MarketplaceName,
  MasterListing,
  ValidationIssue,
} from "@/lib/types/master-listing";

export interface MasterProductGateway {
  load(
    product: Product,
  ): Promise<MasterListing>;
  saveDraft(
    listing: MasterListing,
  ): Promise<MasterListing>;
  publish(
    listingId: string,
    marketplace?: MarketplaceName,
  ): Promise<MasterListing | null>;
  replaceValidationIssues(
    listingId: string,
    issues: ValidationIssue[],
  ): Promise<MasterListing | null>;
  reload(
    listingId: string,
  ): Promise<MasterListing | null>;
}

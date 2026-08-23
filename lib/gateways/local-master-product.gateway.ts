import type { MasterProductGateway } from "./master-product.gateway";
import StudioService from "@/lib/services/studio.service";

export const localMasterProductGateway: MasterProductGateway =
  {
    load: (product) =>
      StudioService.load(product),
    saveDraft: (listing) =>
      StudioService.saveDraft(
        listing,
      ),
    publish: (
      listingId,
      marketplace,
    ) =>
      StudioService.publish(
        listingId,
        marketplace,
      ),
    replaceValidationIssues: (
      listingId,
      issues,
    ) =>
      StudioService.replaceValidationIssues(
        listingId,
        issues,
      ),
    reload: (listingId) =>
      StudioService.reload(
        listingId,
      ),
  };

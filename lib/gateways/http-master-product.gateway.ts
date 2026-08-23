import { safeResponseJson } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/contracts/api.contract";
import type { MasterProductGateway } from "./master-product.gateway";
import type { MasterListing } from "@/lib/types/master-listing";

async function readResponse<T>(
  response: Response,
): Promise<T> {
  const payload =
    (await safeResponseJson(response)) as ApiResponse<T>;

  return (payload as any).data;
}

function toPatchBody(
  listing: MasterListing,
) {
  return {
    revision: listing.revision,
    identity: listing.identity,
    status: listing.status,
    media: listing.media,
    pricing: listing.pricing,
    commercials: listing.commercials,
    inventory: listing.inventory,
    supply: listing.supply,
    variants: listing.variants,
    compliance: listing.compliance,
    growth: listing.growth,
    attributes: listing.attributes,
    marketplaces: listing.marketplaces,
  };
}

export const httpMasterProductGateway: MasterProductGateway =
  {
    async load(product) {
      const response = await fetch(
        `/api/v1/products/${product.id}`,
        {
          cache: "no-store",
        },
      );

      return readResponse<MasterListing>(
        response,
      );
    },

    async saveDraft(listing) {
      const response = await fetch(
        `/api/v1/products/${listing.id}`,
        {
          method: "PATCH",
          headers: {
            "content-type":
              "application/json",
            "x-request-id":
              crypto.randomUUID(),
          },
          body: JSON.stringify(
            toPatchBody(listing),
          ),
        },
      );

      return readResponse<MasterListing>(
        response,
      );
    },

    async publish(
      listingId,
      marketplace,
    ) {
      const response = await fetch(
        `/api/v1/products/${listingId}/publish`,
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json",
            "idempotency-key":
              crypto.randomUUID(),
            "x-request-id":
              crypto.randomUUID(),
          },
          body: JSON.stringify({
            marketplace,
          }),
        },
      );

      return readResponse<MasterListing>(
        response,
      );
    },

    async replaceValidationIssues(
      listingId,
    ) {
      const response = await fetch(
        `/api/v1/products/${listingId}/validate`,
        {
          method: "POST",
          headers: {
            "x-request-id":
              crypto.randomUUID(),
          },
        },
      );

      await readResponse<{
        valid: boolean;
      }>(response);

      return this.reload(listingId);
    },

    async reload(listingId) {
      const response = await fetch(
        `/api/v1/products/${listingId}`,
        {
          cache: "no-store",
        },
      );

      return readResponse<MasterListing>(
        response,
      );
    },
  };

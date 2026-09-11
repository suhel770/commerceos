import {
  MarketplaceName,
  ValidationSeverity,
  type MasterListing,
  type ValidationIssue,
} from "@/lib/types/master-listing";

import { amazonAdapter } from "./amazon.adapter";
import { flipkartAdapter } from "./flipkart.adapter";
import { meeshoAdapter } from "./meesho.adapter";
import { myntraAdapter } from "./myntra.adapter";
import { shopifyAdapter } from "./shopify.adapter";
import {
  scoreFromIssues,
  type MarketplaceAdapter,
  type MarketplacePublishPayload,
  type MarketplaceReadiness,
} from "./types";

export function createGenericAdapter(
  marketplace: MarketplaceName,
): MarketplaceAdapter {
  return {
    marketplace,

    validate(listing: MasterListing): ValidationIssue[] {
      const issues: ValidationIssue[] = [];

      if (!listing.identity.productName.trim()) {
        issues.push({
          id: `${marketplace}.title.required`,
          severity: ValidationSeverity.ERROR,
          title: "Title required",
          description: `${marketplace} requires a product title.`,
          field: "identity.productName",
          marketplaces: [marketplace],
        });
      }

      if (listing.pricing.sellingPrice <= 0) {
        issues.push({
          id: `${marketplace}.price.invalid`,
          severity: ValidationSeverity.ERROR,
          title: "Price required",
          description: `${marketplace} requires a positive selling price.`,
          field: "pricing.sellingPrice",
          marketplaces: [marketplace],
        });
      }

      if (
        listing.media.filter((item) => item.kind === "image").length === 0
      ) {
        issues.push({
          id: `${marketplace}.images.recommended`,
          severity: ValidationSeverity.WARNING,
          title: "Image recommended",
          description: `Add at least one image before publishing to ${marketplace}.`,
          field: "media",
          marketplaces: [marketplace],
        });
      }

      return issues;
    },

    mapAttributes(listing: MasterListing) {
      return Object.fromEntries(
        listing.attributes.map((attribute) => [
          attribute.key,
          attribute.value,
        ]),
      );
    },

    transform(listing: MasterListing): MarketplacePublishPayload {
      return {
        marketplace,
        externalSku: listing.identity.sku,
        title: listing.identity.productName,
        price: listing.pricing.sellingPrice,
        quantity: listing.inventory?.available || 0,
        category: listing.identity.category,
        brand: listing.identity.brand,
        hsn: listing.identity.hsn,
        description: listing.description,
        bulletPoints: listing.bulletPoints,
        images: listing.media
          .filter((item) => item.kind === "image")
          .map((item) => item.url),
        attributes: this.mapAttributes(listing),
      };
    },

    readiness(listing: MasterListing): MarketplaceReadiness {
      const issues = this.validate(listing);
      return {
        score: scoreFromIssues(issues),
        blockers: issues.filter(
          (issue) => issue.severity === ValidationSeverity.ERROR,
        ),
        warnings: issues.filter(
          (issue) => issue.severity !== ValidationSeverity.ERROR,
        ),
      };
    },
  };
}

const dedicatedAdapters: MarketplaceAdapter[] = [
  amazonAdapter,
  flipkartAdapter,
  meeshoAdapter,
  myntraAdapter,
  shopifyAdapter,
];

const dedicatedMarketplaces = new Set(
  dedicatedAdapters.map((a) => a.marketplace),
);

const fallbackAdapters = Object.values(MarketplaceName)
  .filter((marketplace) => !dedicatedMarketplaces.has(marketplace))
  .map(createGenericAdapter);

export const marketplaceAdapters: MarketplaceAdapter[] = [
  ...dedicatedAdapters,
  ...fallbackAdapters,
];

export function getMarketplaceAdapter(marketplace: MarketplaceName): MarketplaceAdapter {
  const adapter = marketplaceAdapters.find(
    (item) => item.marketplace === marketplace,
  );

  if (!adapter) {
    return createGenericAdapter(marketplace);
  }

  return adapter;
}

import {
  MarketplaceName,
  ValidationSeverity,
  type MasterListing,
  type ValidationIssue,
} from "@/lib/types/master-listing";

import {
  scoreFromIssues,
  type MarketplaceAdapter,
  type MarketplacePublishPayload,
  type MarketplaceReadiness,
} from "./types";

function shopifyIssues(listing: MasterListing): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const marketplace = MarketplaceName.SHOPIFY;

  if (!listing.identity.productName.trim()) {
    issues.push({
      id: "shopify.title.required",
      severity: ValidationSeverity.ERROR,
      title: "Store product title required",
      description: "Shopify requires a product title.",
      field: "identity.productName",
      marketplaces: [marketplace],
    });
  }

  if (listing.pricing.sellingPrice <= 0) {
    issues.push({
      id: "shopify.price.required",
      severity: ValidationSeverity.ERROR,
      title: "Product price required",
      description: "Shopify requires a valid product price.",
      field: "pricing.sellingPrice",
      marketplaces: [marketplace],
    });
  }

  return issues;
}

export const shopifyAdapter: MarketplaceAdapter = {
  marketplace: MarketplaceName.SHOPIFY,

  validate(listing: MasterListing): ValidationIssue[] {
    return shopifyIssues(listing);
  },

  mapAttributes(listing: MasterListing): Record<string, unknown> {
    const mapped: Record<string, unknown> = {
      vendor: listing.identity.brand || "Default Vendor",
      product_type: listing.identity.category,
      tags: [listing.identity.category, listing.identity.brand].filter(Boolean),
    };

    for (const attr of listing.attributes) {
      mapped[attr.key] = attr.value;
    }

    return mapped;
  },

  transform(listing: MasterListing): MarketplacePublishPayload {
    return {
      marketplace: MarketplaceName.SHOPIFY,
      externalSku: listing.identity.sku,
      title: listing.identity.productName,
      price: listing.pricing.sellingPrice,
      quantity: 10,
      attributes: this.mapAttributes(listing),
      category: listing.identity.category,
      brand: listing.identity.brand,
      images: listing.media.filter((item) => item.kind === "image").map((i) => i.url),
      description: listing.description,
    };
  },

  readiness(listing: MasterListing): MarketplaceReadiness {
    const issues = shopifyIssues(listing);
    return {
      score: scoreFromIssues(issues),
      blockers: issues.filter((i) => i.severity === ValidationSeverity.ERROR),
      warnings: issues.filter((i) => i.severity === ValidationSeverity.WARNING),
    };
  },
};

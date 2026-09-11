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

function meeshoIssues(listing: MasterListing): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const marketplace = MarketplaceName.MEESHO;

  if (!listing.identity.productName.trim()) {
    issues.push({
      id: "meesho.title.required",
      severity: ValidationSeverity.ERROR,
      title: "Product title required",
      description: "Meesho requires a clear product title.",
      field: "identity.productName",
      marketplaces: [marketplace],
    });
  }

  if (!listing.identity.category.trim()) {
    issues.push({
      id: "meesho.category.required",
      severity: ValidationSeverity.ERROR,
      title: "Meesho category required",
      description: "Map the product to a Meesho catalog category.",
      field: "identity.category",
      marketplaces: [marketplace],
    });
  }

  const images = listing.media.filter((item) => item.kind === "image");
  if (images.length === 0) {
    issues.push({
      id: "meesho.images.required",
      severity: ValidationSeverity.ERROR,
      title: "Catalog image required",
      description: "Meesho requires at least one primary product image.",
      field: "media",
      marketplaces: [marketplace],
    });
  }

  if (listing.pricing.sellingPrice <= 0) {
    issues.push({
      id: "meesho.price.required",
      severity: ValidationSeverity.ERROR,
      title: "Meesho selling price required",
      description: "Selling price must be greater than zero.",
      field: "pricing.sellingPrice",
      marketplaces: [marketplace],
    });
  }

  if (!listing.identity.hsn?.trim()) {
    issues.push({
      id: "meesho.hsn.required",
      severity: ValidationSeverity.ERROR,
      title: "HSN code required",
      description: "Meesho GST invoicing requires an HSN code.",
      field: "identity.hsn",
      marketplaces: [marketplace],
    });
  }

  return issues;
}

export const meeshoAdapter: MarketplaceAdapter = {
  marketplace: MarketplaceName.MEESHO,

  validate(listing: MasterListing): ValidationIssue[] {
    return meeshoIssues(listing);
  },

  mapAttributes(listing: MasterListing): Record<string, unknown> {
    const mapped: Record<string, unknown> = {
      catalog_name: listing.identity.productName,
      price: listing.pricing.sellingPrice,
      mrp: listing.pricing.mrp || listing.pricing.sellingPrice,
      gst_hsn: listing.identity.hsn,
    };

    for (const attr of listing.attributes) {
      mapped[attr.key.toLowerCase()] = attr.value;
    }

    return mapped;
  },

  transform(listing: MasterListing): MarketplacePublishPayload {
    return {
      marketplace: MarketplaceName.MEESHO,
      externalSku: listing.identity.sku,
      title: listing.identity.productName,
      price: listing.pricing.sellingPrice,
      quantity: 10,
      attributes: this.mapAttributes(listing),
      category: listing.identity.category,
      brand: listing.identity.brand,
      images: listing.media.filter((item) => item.kind === "image").map((i) => i.url),
      hsn: listing.identity.hsn,
      description: listing.description,
    };
  },

  readiness(listing: MasterListing): MarketplaceReadiness {
    const issues = meeshoIssues(listing);
    return {
      score: scoreFromIssues(issues),
      blockers: issues.filter((i) => i.severity === ValidationSeverity.ERROR),
      warnings: issues.filter((i) => i.severity === ValidationSeverity.WARNING),
    };
  },
};

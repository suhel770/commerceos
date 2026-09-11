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

function myntraIssues(listing: MasterListing): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const marketplace = MarketplaceName.MYNTRA;

  if (!listing.identity.productName.trim()) {
    issues.push({
      id: "myntra.title.required",
      severity: ValidationSeverity.ERROR,
      title: "Myntra style name required",
      description: "Myntra requires a full product name/style title.",
      field: "identity.productName",
      marketplaces: [marketplace],
    });
  }

  if (!listing.identity.brand.trim()) {
    issues.push({
      id: "myntra.brand.required",
      severity: ValidationSeverity.ERROR,
      title: "Registered brand required",
      description: "Myntra only permits approved catalog brands.",
      field: "identity.brand",
      marketplaces: [marketplace],
    });
  }

  const images = listing.media.filter((item) => item.kind === "image");
  if (images.length < 2) {
    issues.push({
      id: "myntra.images.min_required",
      severity: ValidationSeverity.ERROR,
      title: "Minimum 2 high-res images required",
      description: "Myntra catalog approval mandates front and side/back photography.",
      field: "media",
      marketplaces: [marketplace],
    });
  }

  if (listing.pricing.sellingPrice <= 0) {
    issues.push({
      id: "myntra.price.required",
      severity: ValidationSeverity.ERROR,
      title: "Selling price required",
      description: "Selling price must be greater than zero.",
      field: "pricing.sellingPrice",
      marketplaces: [marketplace],
    });
  }

  if (!listing.identity.hsn?.trim()) {
    issues.push({
      id: "myntra.hsn.required",
      severity: ValidationSeverity.ERROR,
      title: "HSN code required",
      description: "Valid HSN code is required for Myntra tax categorization.",
      field: "identity.hsn",
      marketplaces: [marketplace],
    });
  }

  return issues;
}

export const myntraAdapter: MarketplaceAdapter = {
  marketplace: MarketplaceName.MYNTRA,

  validate(listing: MasterListing): ValidationIssue[] {
    return myntraIssues(listing);
  },

  mapAttributes(listing: MasterListing): Record<string, unknown> {
    const mapped: Record<string, unknown> = {
      style_name: listing.identity.productName,
      brand_name: listing.identity.brand,
      mrp: listing.pricing.mrp || listing.pricing.sellingPrice,
      selling_price: listing.pricing.sellingPrice,
      hsn_code: listing.identity.hsn,
    };

    for (const attr of listing.attributes) {
      if (attr.key.toLowerCase() === "color") {
        mapped.baseColour = attr.value;
      } else if (attr.key.toLowerCase() === "gender") {
        mapped.gender = attr.value;
      } else {
        mapped[attr.key] = attr.value;
      }
    }

    return mapped;
  },

  transform(listing: MasterListing): MarketplacePublishPayload {
    return {
      marketplace: MarketplaceName.MYNTRA,
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
    const issues = myntraIssues(listing);
    return {
      score: scoreFromIssues(issues),
      blockers: issues.filter((i) => i.severity === ValidationSeverity.ERROR),
      warnings: issues.filter((i) => i.severity === ValidationSeverity.WARNING),
    };
  },
};

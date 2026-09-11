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

function flipkartIssues(listing: MasterListing): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const marketplace = MarketplaceName.FLIPKART;

  if (!listing.identity.productName.trim()) {
    issues.push({
      id: "flipkart.title.required",
      severity: ValidationSeverity.ERROR,
      title: "Flipkart title required",
      description: "Flipkart requires a product title.",
      field: "identity.productName",
      marketplaces: [marketplace],
    });
  }

  if (!listing.identity.brand.trim()) {
    issues.push({
      id: "flipkart.brand.required",
      severity: ValidationSeverity.ERROR,
      title: "Brand required",
      description: "Flipkart requires an approved brand name.",
      field: "identity.brand",
      marketplaces: [marketplace],
    });
  }

  if (!listing.identity.category.trim()) {
    issues.push({
      id: "flipkart.category.required",
      severity: ValidationSeverity.ERROR,
      title: "Category required",
      description: "Select a Flipkart vertical/category.",
      field: "identity.category",
      marketplaces: [marketplace],
    });
  }

  const images = (listing.media || []).filter((item) => item.kind === "image");
  if (images.length === 0) {
    issues.push({
      id: "flipkart.images.required",
      severity: ValidationSeverity.ERROR,
      title: "Image required",
      description: "Flipkart requires at least one product image.",
      field: "media",
      marketplaces: [marketplace],
    });
  }

  if (
    !listing.growth?.metaDescription?.trim() &&
    !listing.growth?.bulletPoints?.length &&
    !listing.description?.trim()
  ) {
    issues.push({
      id: "flipkart.description.required",
      severity: ValidationSeverity.WARNING,
      title: "Description recommended",
      description: "Add a description for better Flipkart discovery.",
      field: "growth.metaDescription",
      marketplaces: [marketplace],
    });
  }

  if (!listing.identity.hsn?.trim()) {
    issues.push({
      id: "flipkart.hsn.required",
      severity: ValidationSeverity.ERROR,
      title: "HSN required",
      description: "Flipkart tax compliance requires HSN.",
      field: "identity.hsn",
      marketplaces: [marketplace],
    });
  }

  if ((listing.pricing?.sellingPrice ?? 0) <= 0) {
    issues.push({
      id: "flipkart.price.invalid",
      severity: ValidationSeverity.ERROR,
      title: "Price required",
      description: "Flipkart requires a positive selling price.",
      field: "pricing.sellingPrice",
      marketplaces: [marketplace],
    });
  }

  if (listing.inventory?.available === undefined || listing.inventory?.available < 0) {
    issues.push({
      id: "flipkart.stock.invalid",
      severity: ValidationSeverity.WARNING,
      title: "Inventory required",
      description: "Ensure sellable inventory is available before publishing.",
      field: "inventory.available",
      marketplaces: [marketplace],
    });
  }

  if (
    listing.commercials?.weightGrams !== undefined &&
    listing.commercials.weightGrams <= 0
  ) {
    issues.push({
      id: "flipkart.weight.invalid",
      severity: ValidationSeverity.WARNING,
      title: "Package weight missing",
      description: "Provide package weight for Flipkart shipping.",
      field: "commercials.weightGrams",
      marketplaces: [marketplace],
    });
  }

  return issues;
}

export const flipkartAdapter: MarketplaceAdapter = {
  marketplace: MarketplaceName.FLIPKART,

  validate(listing) {
    return flipkartIssues(listing);
  },

  mapAttributes(listing) {
    return {
      product_name: listing.identity.productName,
      brand: listing.identity.brand,
      description:
        listing.growth?.metaDescription ??
        listing.growth?.seoTitle ??
        listing.description ??
        "",
      key_features: listing.growth?.bulletPoints ?? listing.bulletPoints ?? [],
      hsn: listing.identity.hsn,
      mrp: listing.pricing?.mrp,
      selling_price: listing.pricing?.sellingPrice,
      stock: listing.inventory?.available ?? 0,
      ...Object.fromEntries(
        (listing.attributes || []).map((attribute) => [
          attribute.key,
          attribute.value,
        ]),
      ),
    };
  },

  transform(listing): MarketplacePublishPayload {
    return {
      marketplace: MarketplaceName.FLIPKART,
      externalSku: listing.identity.sku,
      title: listing.identity.productName,
      price: listing.pricing?.sellingPrice || 0,
      quantity: listing.inventory?.available || 0,
      category: listing.identity.category,
      brand: listing.identity.brand,
      hsn: listing.identity.hsn,
      images: (listing.media || [])
        .filter((item) => item.kind === "image")
        .map((item) => item.url),
      attributes: flipkartAdapter.mapAttributes(listing),
    };
  },

  readiness(listing): MarketplaceReadiness {
    const issues = flipkartIssues(listing);
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

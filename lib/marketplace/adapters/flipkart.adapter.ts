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
    const length = Number(listing.commercials?.packageLengthCm) || 0;
    const width = Number(listing.commercials?.packageWidthCm) || 0;
    const height = Number(listing.commercials?.packageHeightCm) || 0;
    const deadWeightGrams = Number(listing.commercials?.weightGrams) || 0;
    const volumetricWeightKg = length > 0 && width > 0 && height > 0
      ? Number(((length * width * height) / 5000).toFixed(3))
      : undefined;

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
      model_number: listing.identity.modelNumber || undefined,
      model_name: listing.identity.modelName || undefined,
      part_number: listing.identity.mpn || undefined,
      warranty_summary: listing.identity.warrantyPeriod || undefined,
      serial_number_tracking: listing.identity.trackingMode === "SERIAL_NUMBER",
      condition: listing.identity.conditionType || "NEW",
      package_length: length || undefined,
      package_width: width || undefined,
      package_height: height || undefined,
      weight_in_grams: deadWeightGrams || undefined,
      volumetric_weight_kg: volumetricWeightKg,
      country_of_origin: listing.compliance?.countryOfOrigin || "India",
      manufacturer_details: listing.compliance?.manufacturerName || listing.identity.manufacturer,
      packer_details: listing.compliance?.packerName,
      consumer_care_email: listing.compliance?.consumerCareEmail,
      consumer_care_phone: listing.compliance?.consumerCarePhone,
      net_quantity: listing.compliance?.netQuantity || "1 N",
      ...Object.fromEntries(
        (listing.attributes || []).map((attribute) => [
          attribute.key,
          attribute.value,
        ]),
      ),
    };
  },

  transform(listing): MarketplacePublishPayload {
    const length = Number(listing.commercials?.packageLengthCm) || 0;
    const width = Number(listing.commercials?.packageWidthCm) || 0;
    const height = Number(listing.commercials?.packageHeightCm) || 0;
    const deadWeightGrams = Number(listing.commercials?.weightGrams) || 0;
    const volumetricWeightKg = length > 0 && width > 0 && height > 0
      ? Number(((length * width * height) / 5000).toFixed(3))
      : undefined;

    return {
      marketplace: MarketplaceName.FLIPKART,
      externalSku: listing.identity.sku,
      title: listing.identity.productName,
      price: listing.pricing?.sellingPrice || 0,
      mrp: listing.pricing?.mrp,
      quantity: listing.inventory?.available || 0,
      category: listing.identity.category,
      subCategory: listing.identity.subCategory,
      brand: listing.identity.brand,
      hsn: listing.identity.hsn,
      taxPercentage: listing.pricing?.taxPercentage,
      description: listing.description,
      bulletPoints: listing.growth?.bulletPoints || listing.bulletPoints,
      barcode: listing.identity.barcode || listing.identity.ean,
      isGtinExempt: listing.identity.isGtinExempt,
      packageDimensions: {
        lengthCm: length || undefined,
        widthCm: width || undefined,
        heightCm: height || undefined,
        weightGrams: deadWeightGrams || undefined,
        volumetricWeightKg,
      },
      legalMetrology: {
        manufacturerName: listing.compliance?.manufacturerName || listing.identity.manufacturer,
        manufacturerAddress: listing.compliance?.manufacturerAddress,
        packerName: listing.compliance?.packerName,
        consumerCareEmail: listing.compliance?.consumerCareEmail,
        consumerCarePhone: listing.compliance?.consumerCarePhone,
        netQuantity: listing.compliance?.netQuantity || "1 N",
        countryOfOrigin: listing.compliance?.countryOfOrigin || "India",
        mfgMonthYear: listing.compliance?.mfgMonthYear,
      },
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

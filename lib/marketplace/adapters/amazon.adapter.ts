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

function amazonIssues(listing: MasterListing): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const marketplace = MarketplaceName.AMAZON;

  if (!listing.identity.productName.trim()) {
    issues.push({
      id: "amazon.title.required",
      severity: ValidationSeverity.ERROR,
      title: "Amazon title required",
      description: "Amazon requires a product title.",
      field: "identity.productName",
      marketplaces: [marketplace],
    });
  } else if (listing.identity.productName.length > 200) {
    issues.push({
      id: "amazon.title.length",
      severity: ValidationSeverity.ERROR,
      title: "Amazon title too long",
      description: "Amazon titles must be 200 characters or fewer.",
      field: "identity.productName",
      marketplaces: [marketplace],
    });
  }

  if (!listing.identity.brand.trim()) {
    issues.push({
      id: "amazon.brand.required",
      severity: ValidationSeverity.ERROR,
      title: "Brand required",
      description: "Amazon requires a brand for catalog listing.",
      field: "identity.brand",
      marketplaces: [marketplace],
    });
  }

  if (!listing.identity.category.trim()) {
    issues.push({
      id: "amazon.category.required",
      severity: ValidationSeverity.ERROR,
      title: "Category required",
      description: "Map the product to an Amazon browse category.",
      field: "identity.category",
      marketplaces: [marketplace],
    });
  }

  const images = listing.media.filter((item) => item.kind === "image");
  if (images.length === 0) {
    issues.push({
      id: "amazon.images.required",
      severity: ValidationSeverity.ERROR,
      title: "Primary image required",
      description: "Amazon requires at least one product image.",
      field: "media",
      marketplaces: [marketplace],
    });
  } else if (images.length < 3) {
    issues.push({
      id: "amazon.images.recommended",
      severity: ValidationSeverity.WARNING,
      title: "Add more gallery images",
      description: "Amazon converts better with 3+ images.",
      field: "media",
      marketplaces: [marketplace],
    });
  }

  if (!listing.identity.hsn?.trim()) {
    issues.push({
      id: "amazon.hsn.required",
      severity: ValidationSeverity.ERROR,
      title: "HSN required",
      description: "Amazon India listings need a valid HSN code.",
      field: "identity.hsn",
      marketplaces: [marketplace],
    });
  }

  if (listing.pricing.sellingPrice <= 0) {
    issues.push({
      id: "amazon.price.invalid",
      severity: ValidationSeverity.ERROR,
      title: "Selling price required",
      description: "Amazon requires a positive selling price.",
      field: "pricing.sellingPrice",
      marketplaces: [marketplace],
    });
  }

  if (
    listing.pricing.mrp > 0 &&
    listing.pricing.sellingPrice > listing.pricing.mrp
  ) {
    issues.push({
      id: "amazon.price.mrp",
      severity: ValidationSeverity.ERROR,
      title: "Price above MRP",
      description: "Selling price cannot exceed MRP on Amazon.",
      field: "pricing.sellingPrice",
      marketplaces: [marketplace],
    });
  }

  if (listing.inventory.available <= 0) {
    issues.push({
      id: "amazon.inventory.zero",
      severity: ValidationSeverity.WARNING,
      title: "Zero inventory",
      description: "Listing can publish but will not be buyable until stock is available.",
      field: "inventory.available",
      marketplaces: [marketplace],
    });
  }

  return issues;
}

export const amazonAdapter: MarketplaceAdapter = {
  marketplace: MarketplaceName.AMAZON,

  validate(listing) {
    return amazonIssues(listing);
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
      item_name: listing.identity.productName,
      brand_name: listing.identity.brand,
      product_description:
        listing.growth?.metaDescription ??
        listing.growth?.seoTitle ??
        listing.description ??
        "",
      bullet_point: listing.growth?.bulletPoints ?? listing.bulletPoints ?? [],
      externally_assigned_product_identifier: listing.identity.sku,
      recommended_browse_nodes: listing.identity.category,
      hsn_code: listing.identity.hsn,
      list_price: listing.pricing.mrp,
      purchasable_offer_price: listing.pricing.sellingPrice,
      fulfillment_availability: listing.inventory?.available ?? 0,
      model_number: listing.identity.modelNumber || undefined,
      model_name: listing.identity.modelName || undefined,
      part_number: listing.identity.mpn || undefined,
      manufacturer_warranty_description: listing.identity.warrantyPeriod || undefined,
      serial_number_tracking: listing.identity.trackingMode === "SERIAL_NUMBER",
      is_gtin_exempt: listing.identity.isGtinExempt || false,
      item_condition: listing.identity.conditionType || "NEW",
      fulfillment_channel: listing.commercials?.fulfillmentChannel || "MERCHANT_FULFILLED",
      package_length: length || undefined,
      package_width: width || undefined,
      package_height: height || undefined,
      package_weight: deadWeightGrams || undefined,
      volumetric_weight_kg: volumetricWeightKg,
      country_of_origin: listing.compliance?.countryOfOrigin || "India",
      manufacturer: listing.compliance?.manufacturerName || listing.identity.manufacturer,
      packer: listing.compliance?.packerName,
      consumer_care_email: listing.compliance?.consumerCareEmail,
      consumer_care_phone: listing.compliance?.consumerCarePhone,
      net_quantity: listing.compliance?.netQuantity || "1 N",
      ...Object.fromEntries(
        listing.attributes.map((attribute) => [
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
      marketplace: MarketplaceName.AMAZON,
      externalSku: listing.identity.sku,
      title: listing.identity.productName.slice(0, 200),
      price: listing.pricing.sellingPrice,
      mrp: listing.pricing.mrp,
      quantity: listing.inventory.available,
      category: listing.identity.category,
      subCategory: listing.identity.subCategory,
      brand: listing.identity.brand,
      hsn: listing.identity.hsn,
      taxPercentage: listing.pricing.taxPercentage,
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
      images: listing.media
        .filter((item) => item.kind === "image")
        .map((item) => item.url),
      attributes: amazonAdapter.mapAttributes(listing),
    };
  },

  readiness(listing): MarketplaceReadiness {
    const issues = amazonIssues(listing);
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

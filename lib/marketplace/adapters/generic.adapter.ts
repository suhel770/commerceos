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
      const length = Number(listing.commercials?.packageLengthCm) || 0;
      const width = Number(listing.commercials?.packageWidthCm) || 0;
      const height = Number(listing.commercials?.packageHeightCm) || 0;
      const deadWeightGrams = Number(listing.commercials?.weightGrams) || 0;
      const volumetricWeightKg = length > 0 && width > 0 && height > 0
        ? Number(((length * width * height) / 5000).toFixed(3))
        : undefined;

      const baseAttrs = this.mapAttributes(listing);

      return {
        marketplace,
        externalSku: listing.identity.sku,
        title: listing.identity.productName,
        price: listing.pricing.sellingPrice,
        mrp: listing.pricing.mrp,
        quantity: listing.inventory?.available || 0,
        category: listing.identity.category,
        subCategory: listing.identity.subCategory,
        brand: listing.identity.brand,
        hsn: listing.identity.hsn,
        taxPercentage: listing.pricing.taxPercentage,
        description: listing.description,
        bulletPoints: listing.bulletPoints || listing.growth?.bulletPoints,
        barcode: listing.identity.barcode || listing.identity.ean || listing.identity.upc,
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
        attributes: {
          ...baseAttrs,
          model_number: listing.identity.modelNumber,
          model_name: listing.identity.modelName,
          part_number: listing.identity.mpn,
          condition: listing.identity.conditionType || "NEW",
          handling_time_days: listing.identity.handlingTimeDays || 2,
          item_package_quantity: listing.identity.itemPackageQuantity || 1,
          fulfillment_channel: listing.commercials?.fulfillmentChannel || "MERCHANT_FULFILLED",
          volumetric_weight_kg: volumetricWeightKg,
        },
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

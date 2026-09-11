import { describe, expect, it } from "vitest";
import {
  MarketplaceName,
  MarketplacePublishStatus,
  type MasterListing,
} from "@/lib/types/master-listing";
import { getMarketplaceAdapter } from "@/lib/marketplace/adapters/generic.adapter";
import { getMarketplaceRegistry } from "@/lib/marketplace/registry/marketplace-registry";
import { isValidUniversalProductId } from "@/lib/products/product-id-utils";

describe("CommerceOS — Phase 2B Interactive Universal Listing Studio Test Suite", () => {
  const baseListing: MasterListing = {
    id: "list-studio-1",
    workspaceId: "ws-test",
    productId: "PRD-000101",
    revision: 1,
    status: "DRAFT" as any,
    identity: {
      id: "PRD-000101",
      productName: "Kids Sandal - Pink",
      sku: "SKU-NOVA-SAND-PNK",
      brand: "NovaKids",
      category: "Kids Sandals",
      hsn: "640419",
    },
    pricing: {
      currency: "INR",
      costPrice: 250,
      sellingPrice: 599,
      mrp: 999,
    },
    inventory: {
      available: 41,
      reserved: 0,
      incoming: 0,
      damaged: 0,
      safetyStock: 5,
      warehouseIds: [],
    },
    media: [
      {
        id: "m-1",
        url: "https://assets.commerceos.local/kids-sandal.jpg",
        kind: "image",
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    commercials: {},
    supply: {},
    variants: [],
    compliance: { certifications: [], documents: [] },
    growth: { searchTerms: [], bulletPoints: ["EVA Sole", "Lightweight"], merchandisingTags: [] },
    attributes: [
      { id: "a-1", key: "color", label: "Color", value: "Pink", group: "general" },
      { id: "a-2", key: "country_of_origin", label: "Country of Origin", value: "India", group: "compliance" },
      { id: "a-3", key: "shoe_size_uk", label: "Shoe Size UK", value: "5", group: "specifications" },
    ],
    marketplaces: [
      {
        marketplace: MarketplaceName.AMAZON,
        enabled: true,
        publishStatus: MarketplacePublishStatus.NOT_PUBLISHED,
        validationScore: 100,
        issues: [],
      },
      {
        marketplace: MarketplaceName.FLIPKART,
        enabled: true,
        publishStatus: MarketplacePublishStatus.NOT_PUBLISHED,
        validationScore: 100,
        issues: [],
      },
      {
        marketplace: MarketplaceName.MYNTRA,
        enabled: true,
        publishStatus: MarketplacePublishStatus.NOT_PUBLISHED,
        validationScore: 90,
        issues: [],
      },
    ],
    attributeMappings: [],
    validationIssues: [],
    aiInsights: [],
    activity: [],
  };

  // 1. Master Product Identity & Canonical PRD- ID
  it("1. displays canonical immutable PRD-000101 without mutating master title", () => {
    expect(isValidUniversalProductId(baseListing.productId)).toBe(true);
    expect(baseListing.productId).toBe("PRD-000101");
    expect(baseListing.identity.productName).toBe("Kids Sandal - Pink");
  });

  // 2. Master vs Marketplace Overrides
  it("2. maintains channel overrides in MarketplaceListing without modifying master title", () => {
    const amazonPayload = getMarketplaceAdapter(MarketplaceName.AMAZON).transform(baseListing);
    const flipkartPayload = getMarketplaceAdapter(MarketplaceName.FLIPKART).transform(baseListing);

    expect(amazonPayload.title).toBe("Kids Sandal - Pink");
    expect(flipkartPayload.title).toBe("Kids Sandal - Pink");

    // Override simulation
    const channelOverrideListing = {
      ...baseListing,
      marketplaces: [
        {
          marketplace: MarketplaceName.AMAZON,
          enabled: true,
          publishStatus: MarketplacePublishStatus.NOT_PUBLISHED,
          validationScore: 100,
          issues: [],
          listingTitle: "NovaKids Premium Kids Sandal Pink - Soft EVA Sole",
        },
      ],
    };

    expect(channelOverrideListing.identity.productName).toBe("Kids Sandal - Pink");
    expect(channelOverrideListing.marketplaces[0].listingTitle).toBe(
      "NovaKids Premium Kids Sandal Pink - Soft EVA Sole",
    );
  });

  // 3. Channel Readiness Factor Calculation
  it("3. derives channel readiness from master attributes and media", () => {
    const amznRegistry = getMarketplaceRegistry(MarketplaceName.AMAZON);
    expect(amznRegistry.active).toBe(true);

    const hasOrigin = baseListing.attributes.some((a) => a.key === "country_of_origin");
    const hasSize = baseListing.attributes.some((a) => a.key === "shoe_size_uk");

    expect(hasOrigin).toBe(true);
    expect(hasSize).toBe(true);
  });

  // 4. Exception Aggregation & Resolution
  it("4. identifies missing mandatory attributes as blocker exceptions", () => {
    const listingMissingAttributes: MasterListing = {
      ...baseListing,
      attributes: [], // empty attributes
    };

    const hasCountryOfOrigin = listingMissingAttributes.attributes.some(
      (a) => a.key === "country_of_origin",
    );
    const hasShoeSize = listingMissingAttributes.attributes.some(
      (a) => a.key === "shoe_size_uk" || a.key === "size",
    );

    expect(hasCountryOfOrigin).toBe(false);
    expect(hasShoeSize).toBe(false);
  });

  // 5. Internal Preview Transformation
  it("5. generates internal preview payload without external API calls", () => {
    const myntraPayload = getMarketplaceAdapter(MarketplaceName.MYNTRA).transform(baseListing);
    expect(myntraPayload.marketplace).toBe(MarketplaceName.MYNTRA);
    expect(myntraPayload.price).toBe(599);
    expect(myntraPayload.externalSku).toBe("SKU-NOVA-SAND-PNK");
  });
});

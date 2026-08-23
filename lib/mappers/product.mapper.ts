import type {
  AIInsight,
  ListingMedia,
  MasterAttribute,
  MasterListing,
  MarketplaceConnection,
  ValidationIssue,
} from "@/lib/types/master-listing";

import {
  AttributeRequirement,
  ListingStatus,
  MarketplaceName,
  MarketplacePublishStatus,
  ValidationSeverity,
} from "@/lib/types/master-listing";

import type {
  MarketplaceListing,
  Product,
} from "@/lib/types/product";

const WORKSPACE_ID = "ws-default";

export class ProductMapper {
  static toMasterListing(
    product?: Product | null,
  ): MasterListing {
    const safeProduct: Product = product ?? ({
      id: "prod-mock",
      sku: "SKU-MOCK",
      name: "Mock Product",
      brand: "Brand",
      category: "Category",
      status: "Active",
      image: "https://example.com/hero.jpg",
      gallery: ["https://example.com/1.jpg", "https://example.com/2.jpg", "https://example.com/3.jpg", "https://example.com/4.jpg"],
      hsn: "6403",
      pricing: { mrp: 1999, sellingPrice: 1499, costPrice: 799, profit: 700, margin: 46 },
      inventory: { available: 50, reserved: 5, incoming: 20 },
      listings: [
        {
          id: "lst-amazon",
          marketplace: "amazon",
          title: "Mock Amazon Listing",
          marketplaceSku: "SKU-AMZ-001",
          listingIdLabel: "ASIN",
          listingId: "B08N5WRWNW",
          sellingPrice: 1499,
          availableStock: 50,
          orders30Days: 120,
          revenue30Days: 179880,
          status: "Active",
          listingStatus: "Live",
          stockSync: true,
          lastSync: new Date().toISOString(),
          healthScore: 95,
        },
        {
          id: "lst-flipkart",
          marketplace: "flipkart",
          title: "Mock Flipkart Listing",
          marketplaceSku: "SKU-FK-001",
          listingIdLabel: "FSN",
          listingId: "FSNB08N5WRWNW",
          sellingPrice: 1499,
          availableStock: 50,
          orders30Days: 80,
          revenue30Days: 119920,
          status: "Active",
          listingStatus: "Live",
          stockSync: true,
          lastSync: new Date().toISOString(),
          healthScore: 92,
        },
      ],
    } as any);

    const media = this.mapMedia(safeProduct);
    const marketplaces = this.mapMarketplaces(safeProduct.listings ?? []);
    const attributes = this.mapAttributes(safeProduct);
    const validationIssues = this.buildValidationIssues(
      safeProduct,
      media,
      attributes,
    );

    return {
      id: safeProduct.id,
      organizationId:
        "org-commerceos",
      workspaceId: WORKSPACE_ID,
      revision: 0,

      identity: {
        id: safeProduct.id,
        sku: safeProduct.sku,
        productName: safeProduct.name,
        brand: safeProduct.brand,
        manufacturer: safeProduct.manufacturer,
        category: safeProduct.category,
        subCategory: safeProduct.subCategory,
        productType: safeProduct.productType,
        hsn: safeProduct.hsn,
        taxCode: safeProduct.gstRate
          ? `GST${safeProduct.gstRate}`
          : undefined,
      },

      status: this.mapStatus(safeProduct.status),

      media,
      pricing: {
        mrp: safeProduct.pricing?.mrp ?? 0,
        sellingPrice: safeProduct.pricing?.sellingPrice ?? 0,
        costPrice: safeProduct.pricing?.costPrice ?? 0,
        currency: "INR",
        taxPercentage: safeProduct.gstRate,
      },
      commercials: {
        minimumPrice:
          safeProduct.pricing?.costPrice ?? 0,
        maximumPrice:
          safeProduct.pricing?.mrp ?? 0,
      },

      inventory: {
        available: safeProduct.inventory?.available ?? 0,
        reserved: safeProduct.inventory?.reserved ?? 0,
        incoming: safeProduct.inventory?.incoming ?? 0,
        safetyStock: 25,
        warehouseIds: ["wh-delhi", "wh-mumbai"],
      },
      supply: {
        leadTimeDays: 7,
        minimumOrderQuantity: 1,
        reorderQuantity: 50,
      },
      variants: [
        {
          id: `${safeProduct.id}-variant-base`,
          sku: safeProduct.sku,
          title: safeProduct.name,
          optionValues: {},
          sellingPrice:
            safeProduct.pricing?.sellingPrice ?? 0,
          available:
            safeProduct.inventory?.available ?? 0,
          mediaIds: media
            .filter(
              (item) =>
                item.kind === "image",
            )
            .map((item) => item.id),
          active: true,
        },
      ],
      compliance: {
        countryOfOrigin:
          safeProduct.countryOfOrigin,
        certifications: [],
        documents: [],
      },
      growth: {
        seoTitle: safeProduct.name,
        metaDescription:
          safeProduct.shortDescription ??
          safeProduct.description,
        searchTerms:
          safeProduct.tags ?? [],
        bulletPoints:
          safeProduct.bulletPoints ?? [],
        merchandisingTags:
          safeProduct.tags ?? [],
      },

      attributes,
      attributeMappings: this.mapAttributeMappings(attributes),

      marketplaces,
      validationIssues,
      aiInsights: [],
      aiEntitlement: {
        enabled: true,
        creditsRemaining: 25,
        plan: "trial",
      },
      activity: [
        {
          id: `${safeProduct.id}-created`,
          type: "product.created",
          title:
            "Master product created",
          description:
            "Master product initialized in CommerceOS.",
          actorId: "system",
          actorName: "System",
          timestamp:
            safeProduct.createdAt ??
            new Date().toISOString(),
        },
      ],

      permissions: {
        canView: true,
        canEdit: true,
        canPublish: true,
        canArchive: true,
        canDelete: true,
        canManagePricing: true,
        canManageInventory: true,
        canUseAI: true,
      },

      audit: {
        createdAt: safeProduct.createdAt ?? new Date().toISOString(),
        updatedAt: safeProduct.updatedAt ?? new Date().toISOString(),
        createdBy: "system",
        updatedBy: "system",
        version: 1,
      },
    };
  }

  private static mapStatus(
    status: Product["status"],
  ): ListingStatus {
    switch (status) {
      case "Active":
        return ListingStatus.READY;

      case "Draft":
        return ListingStatus.DRAFT;

      case "Archived":
        return ListingStatus.ARCHIVED;

      default:
        return ListingStatus.DRAFT;
    }
  }

  private static mapMedia(
    product: Product,
  ): ListingMedia[] {
    if (!product) return [];
    const gallery = Array.isArray(product.gallery) ? product.gallery : [];
    const items: ListingMedia[] = [
      {
        id: `${product.id || "prod"}-primary`,
        kind: "image",
        url: product.image || "",
        thumbnail: product.image || "",
        alt: product.name || "",
        isPrimary: true,
        tags: ["hero", "marketplace"],
        sortOrder: 0,
      },
    ];

    gallery.forEach((url, index) => {
      items.push({
        id: `${product.id}-img-${index}`,
        kind: "image",
        url,
        thumbnail: url,
        alt: `${product.name} ${index + 1}`,
        isPrimary: false,
        tags: ["gallery"],
        sortOrder: index + 1,
      });
    });

    if (product.video) {
      items.push({
        id: `${product.id}-video`,
        kind: "video",
        url: product.video,
        alt: `${product.name} video`,
        isPrimary: false,
        tags: ["video"],
        sortOrder: items.length,
      });
    }

    return items;
  }

  private static mapMarketplaces(
    listings: MarketplaceListing[],
  ): MarketplaceConnection[] {
    return listings.map((listing) => ({
      marketplace: this.normalizeMarketplace(listing.marketplace),
      enabled: true,
      publishStatus: this.mapPublishStatus(listing.listingStatus),
      listingId: listing.listingId,
      externalId: listing.marketplaceSku,
      listingUrl: listing.marketplaceUrl,
      lastSyncedAt: listing.lastSync,
      validationScore: listing.healthScore ?? 90,
      issues: [],
    }));
  }

  private static normalizeMarketplace(
    name: string,
  ): MarketplaceName {
    const normalized = name.toLowerCase();

    if (normalized.includes("amazon")) {
      return MarketplaceName.AMAZON;
    }

    if (normalized.includes("flipkart")) {
      return MarketplaceName.FLIPKART;
    }

    if (normalized.includes("meesho")) {
      return MarketplaceName.MEESHO;
    }

    if (normalized.includes("shopify")) {
      return MarketplaceName.SHOPIFY;
    }

    if (
      normalized.includes("own website") ||
      normalized.includes("woocommerce")
    ) {
      return MarketplaceName.WOOCOMMERCE;
    }

    if (normalized.includes("ajio")) {
      return MarketplaceName.AJIO;
    }

    if (normalized.includes("myntra")) {
      return MarketplaceName.MYNTRA;
    }

    return MarketplaceName.SHOPIFY;
  }

  private static mapPublishStatus(
    status: string,
  ): MarketplacePublishStatus {
    const normalized = status.toLowerCase();

    if (normalized.includes("live") || normalized.includes("published")) {
      return MarketplacePublishStatus.PUBLISHED;
    }

    if (normalized.includes("sync")) {
      return MarketplacePublishStatus.SYNCING;
    }

    return MarketplacePublishStatus.NOT_PUBLISHED;
  }

  private static mapAttributes(
    product: Product,
  ): MasterAttribute[] {
    const entries: Array<[string, string, string, unknown]> = [
      ["category", "Category", "General", product.category],
      ["subCategory", "Sub Category", "General", product.subCategory ?? ""],
      ["productType", "Product Type", "General", product.productType ?? ""],
      ["department", "Department", "General", product.department ?? ""],
      ["collection", "Collection", "General", product.collection ?? ""],
      ["hsn", "HSN", "Compliance", product.hsn ?? ""],
      ["gstRate", "GST", "Compliance", product.gstRate ?? ""],
      [
        "countryOfOrigin",
        "Country Of Origin",
        "Compliance",
        product.countryOfOrigin ?? "",
      ],
      ["color", "Color", "Variants", "Green"],
      [
        "size",
        "Size",
        "Variants",
        ["5C", "6C", "7C", "8C", "9C", "10C", "11C", "12C", "13C", "1Y", "2Y", "3Y"],
      ],
    ];

    return entries.map(([key, label, group, value], index) => ({
      id: `${product.id}-attr-${index}`,
      key,
      label,
      value,
      group,
      searchable: true,
      filterable: true,
    }));
  }

  private static mapAttributeMappings(
    attributes: MasterAttribute[],
  ) {
    const color = attributes.find((item) => item.key === "color");

    if (!color) {
      return [];
    }

    return [
      {
        marketplace: MarketplaceName.AMAZON,
        marketplaceField: "color_name",
        masterAttributeKey: "color",
        required: AttributeRequirement.REQUIRED,
      },
      {
        marketplace: MarketplaceName.FLIPKART,
        marketplaceField: "colour",
        masterAttributeKey: "color",
        required: AttributeRequirement.REQUIRED,
      },
      {
        marketplace: MarketplaceName.MEESHO,
        marketplaceField: "color",
        masterAttributeKey: "color",
        required: AttributeRequirement.RECOMMENDED,
      },
    ];
  }

  private static buildValidationIssues(
    product: Product,
    media: ListingMedia[],
    attributes: MasterAttribute[],
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (media.length < 10) {
      issues.push({
        id: `${product.id}-issue-media`,
        severity: ValidationSeverity.WARNING,
        title: "Lifestyle images recommended",
        description:
          "Adding 2 lifestyle images may improve marketplace conversions.",
        field: "media",
        marketplaces: [
          MarketplaceName.AMAZON,
          MarketplaceName.FLIPKART,
        ],
      });
    }

    const missingAttributes = attributes.filter((attribute) => {
      const value = attribute.value;
      return value === "" || value === null || value === undefined;
    }).length;

    if (missingAttributes > 0) {
      issues.push({
        id: `${product.id}-issue-attributes`,
        severity: ValidationSeverity.WARNING,
        title: "Attributes incomplete",
        description:
          `${missingAttributes} recommended attributes are missing for full marketplace coverage.`,
        field: "attributes",
        marketplaces: [
          MarketplaceName.AJIO,
          MarketplaceName.MEESHO,
        ],
      });
    }

    if (!product.hsn) {
      issues.push({
        id: `${product.id}-issue-hsn`,
        severity: ValidationSeverity.WARNING,
        title: "HSN code missing",
        description:
          "HSN is required for GST compliance on Indian marketplaces.",
        field: "hsn",
        marketplaces: [
          MarketplaceName.AMAZON,
          MarketplaceName.FLIPKART,
          MarketplaceName.MEESHO,
        ],
      });
    }

    return issues;
  }

  private static mapAIRecommendations(
    recommendations: Product["aiRecommendations"],
  ): AIInsight[] {
    return recommendations.map((item) => ({
      id: item.id,
      type: this.mapInsightType(item.type),
      title: item.type.charAt(0).toUpperCase() + item.type.slice(1),
      description: item.message,
      applied: false,
      creditRequired: false,
    }));
  }

  private static mapInsightType(
    type: string,
  ): AIInsight["type"] {
    switch (type) {
      case "pricing":
        return "pricing";

      case "inventory":
        return "inventory";

      case "seo":
        return "seo";

      case "image":
        return "image";

      default:
        return "description";
    }
  }
}

export default ProductMapper;

import { describe, expect, it } from "vitest";
import { AttributeRequirement, MarketplaceName, ValidationSeverity, type MasterListing } from "@/lib/types/master-listing";
import {
  getMarketplaceRegistry,
  getAllMarketplaceRegistries,
} from "@/lib/marketplace/registry/marketplace-registry";
import { categoryMappingService } from "@/lib/marketplace/taxonomy/category-mapping.service";
import {
  getAllUniversalAttributes,
  getUniversalAttribute,
} from "@/lib/marketplace/attributes/universal-attributes";
import { evaluateConditionalRule } from "@/lib/marketplace/attributes/conditional-rules";
import { applyTransformation } from "@/lib/marketplace/attributes/transformations";
import { evaluateAttribute } from "@/lib/marketplace/attributes/attribute-engine";
import { getMarketplaceAdapter } from "@/lib/marketplace/adapters/generic.adapter";
import { channelReadinessService } from "@/lib/marketplace/readiness/channel-readiness.service";
import {
  formatUniversalProductId,
  isValidUniversalProductId,
} from "@/lib/products/product-id-utils";

describe("CommerceOS — Phase 1: Universal Product + Marketplace Intelligence Engine", () => {
  // --------------------------------------------------------------------------
  // 1. Universal Product Identity
  // --------------------------------------------------------------------------
  describe("1. Universal Product Identity", () => {
    it("validates and formats canonical CommerceOS Universal Product IDs", () => {
      expect(isValidUniversalProductId("PRD-000101")).toBe(true);
      expect(isValidUniversalProductId("PRD-000201")).toBe(true);
      expect(isValidUniversalProductId("ASIN-B08XXXX")).toBe(false);
      expect(isValidUniversalProductId("FSN-123456")).toBe(false);

      expect(formatUniversalProductId(101)).toBe("PRD-000101");
      expect(formatUniversalProductId("PRD-000101")).toBe("PRD-000101");
    });
  });

  // --------------------------------------------------------------------------
  // 2. Marketplace Registry & Channels
  // --------------------------------------------------------------------------
  describe("2. Marketplace Registry", () => {
    it("registers all production Indian and Global marketplaces with capability specs", () => {
      const registries = getAllMarketplaceRegistries();
      expect(registries.length).toBeGreaterThanOrEqual(10);

      const amazon = getMarketplaceRegistry(MarketplaceName.AMAZON);
      expect(amazon.name).toBe("Amazon India");
      expect(amazon.capabilities).toContain("CATALOG_PUBLISH");
      expect(amazon.capabilities).toContain("PRICE_SYNC");
      expect(amazon.capabilities).toContain("INVENTORY_SYNC");
      expect(amazon.requiresGstCompliance).toBe(true);

      const flipkart = getMarketplaceRegistry(MarketplaceName.FLIPKART);
      expect(flipkart.name).toBe("Flipkart");
      expect(flipkart.authType).toBe("OAUTH2");

      const meesho = getMarketplaceRegistry(MarketplaceName.MEESHO);
      expect(meesho.name).toBe("Meesho");

      const ondc = getMarketplaceRegistry(MarketplaceName.ONDC);
      expect(ondc.name).toContain("ONDC");
      expect(ondc.category).toBe("NETWORK");
    });
  });

  // --------------------------------------------------------------------------
  // 3. Category Mapping & Taxonomy Engine
  // --------------------------------------------------------------------------
  describe("3. Category Mapping Engine", () => {
    it("resolves baseline taxonomy mapping for Kids Sandals across channels", async () => {
      const amznMapping = await categoryMappingService.resolveMapping(
        "ws-test",
        "Kids Sandals",
        MarketplaceName.AMAZON,
      );
      expect(amznMapping).toBeDefined();
      expect(amznMapping?.marketplaceCategoryId).toBe("amzn.cat.shoes.sandals.kids");
      expect(amznMapping?.marketplaceVertical).toBe("SHOES");

      const flipMapping = await categoryMappingService.resolveMapping(
        "ws-test",
        "Kids Sandals",
        MarketplaceName.FLIPKART,
      );
      expect(flipMapping?.marketplaceCategoryId).toBe("flip.cat.footwear.kids_sandals");

      const myntraMapping = await categoryMappingService.resolveMapping(
        "ws-test",
        "Kids Sandals",
        MarketplaceName.MYNTRA,
      );
      expect(myntraMapping?.marketplaceCategoryId).toBe("myn.cat.sandals_kids");
    });
  });

  // --------------------------------------------------------------------------
  // 4. Universal Attribute System & Conditional Rules
  // --------------------------------------------------------------------------
  describe("4. Universal Attribute System & Conditional Rules", () => {
    it("provides standard catalog attributes with data types and groups", () => {
      const attributes = getAllUniversalAttributes();
      expect(attributes.length).toBeGreaterThanOrEqual(8);

      const colorAttr = getUniversalAttribute("color");
      expect(colorAttr?.label).toBe("Primary Color");
      expect(colorAttr?.allowedValues).toContain("Pink");
      expect(colorAttr?.group).toBe("general");

      const shoeSize = getUniversalAttribute("shoe_size_uk");
      expect(shoeSize?.dataType).toBe("number");
      expect(shoeSize?.group).toBe("variant");
    });

    it("evaluates conditional rules dynamically based on product context", () => {
      const footwearRule = {
        id: "rule-1",
        targetField: "category",
        operator: "CONTAINS" as const,
        expectedValue: "footwear",
        thenRequirement: "REQUIRED" as const,
      };

      // When category contains footwear -> isTriggered true & requirement REQUIRED
      const res1 = evaluateConditionalRule(footwearRule, { category: "Kids Footwear" });
      expect(res1.isTriggered).toBe(true);
      expect(res1.requirement).toBe(AttributeRequirement.REQUIRED);

      // When category is electronics -> isTriggered false
      const res2 = evaluateConditionalRule(footwearRule, { category: "Consumer Electronics" });
      expect(res2.isTriggered).toBe(false);
      expect(res2.requirement).toBe(AttributeRequirement.OPTIONAL);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Value & Unit Transformation Engine
  // --------------------------------------------------------------------------
  describe("5. Value & Unit Transformations", () => {
    it("transforms enum values and converts measurement units deterministically", () => {
      // 1. Enum map: "Pink" -> "baby_pink"
      const enumTransformed = applyTransformation("Pink", [
        {
          type: "MAP_ENUM",
          params: {
            mapping: {
              Pink: "baby_pink",
              Blue: "navy_blue",
            },
          },
        },
      ]);
      expect(enumTransformed).toBe("baby_pink");

      // 2. Unit conversion: 10 cm -> 3.94 inches
      const unitTransformed = applyTransformation(10, [
        {
          type: "UNIT_CONVERT",
          params: {
            fromUnit: "cm",
            toUnit: "inches",
          },
        },
      ]);
      expect(unitTransformed).toBe(3.94);

      // 3. Text case: "kids sandal" -> "KIDS SANDAL"
      const caseTransformed = applyTransformation("kids sandal", [
        {
          type: "TEXT_CASE",
          params: { case: "UPPERCASE" },
        },
      ]);
      expect(caseTransformed).toBe("KIDS SANDAL");
    });

    it("evaluates attribute against schema definition with full validation", () => {
      const definition = {
        attributeKey: "color_name",
        label: "Color Name",
        dataType: "string" as const,
        isRequired: true,
        requirementLevel: "REQUIRED" as const,
        allowedValues: ["Black", "White", "Pink", "Blue"],
      };

      // Valid value
      const validRes = evaluateAttribute(definition, "Pink", {});
      expect(validRes.valid).toBe(true);
      expect(validRes.errors.length).toBe(0);

      // Invalid unpermitted value
      const invalidRes = evaluateAttribute(definition, "Neon Green", {});
      expect(invalidRes.valid).toBe(false);
      expect(invalidRes.errors[0]).toContain("not permitted");

      // Missing value
      const missingRes = evaluateAttribute(definition, "", {});
      expect(missingRes.valid).toBe(false);
      expect(missingRes.errors[0]).toContain("mandatory");
    });
  });

  // --------------------------------------------------------------------------
  // 6. Extensible Channel Adapters
  // --------------------------------------------------------------------------
  describe("6. Channel Adapters", () => {
    const mockListing: MasterListing = {
      id: "list-1",
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
        updatedAt: new Date().toISOString(),
      },
      media: [
        {
          id: "m-1",
          url: "https://assets.commerceos.local/kids-sandal.jpg",
          kind: "image",
          position: 0,
        },
        {
          id: "m-2",
          url: "https://assets.commerceos.local/kids-sandal-side.jpg",
          kind: "image",
          position: 1,
        },
        {
          id: "m-3",
          url: "https://assets.commerceos.local/kids-sandal-sole.jpg",
          kind: "image",
          position: 2,
        },
      ],
      attributes: [
        { key: "color", label: "Color", value: "Pink" },
        { key: "material", label: "Material", value: "EVA" },
      ],
      marketplaces: [],
      permissions: {
        canEdit: true,
        canPublish: true,
        canSync: true,
        canUseAI: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it("generates valid marketplace publish payloads for Amazon, Flipkart, and Meesho", () => {
      const amznAdapter = getMarketplaceAdapter(MarketplaceName.AMAZON);
      const amznPayload = amznAdapter.transform(mockListing);
      expect(amznPayload.marketplace).toBe(MarketplaceName.AMAZON);
      expect(amznPayload.externalSku).toBe("SKU-NOVA-SAND-PNK");
      expect(amznPayload.price).toBe(599);

      const meeshoAdapter = getMarketplaceAdapter(MarketplaceName.MEESHO);
      const meeshoPayload = meeshoAdapter.transform(mockListing);
      expect(meeshoPayload.marketplace).toBe(MarketplaceName.MEESHO);
      expect(meeshoPayload.attributes.price).toBe(599);

      const myntraAdapter = getMarketplaceAdapter(MarketplaceName.MYNTRA);
      const myntraPayload = myntraAdapter.transform(mockListing);
      expect(myntraPayload.attributes.baseColour).toBe("Pink");
    });
  });

  // --------------------------------------------------------------------------
  // 7. Channel Readiness Calculation
  // --------------------------------------------------------------------------
  describe("7. Channel Readiness Calculation", () => {
    it("computes genuine readiness scores based on database attributes and category mappings", async () => {
      const mockListing: MasterListing = {
        id: "list-1",
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
          updatedAt: new Date().toISOString(),
        },
        media: [
          {
            id: "m-1",
            url: "https://assets.commerceos.local/kids-sandal.jpg",
            kind: "image",
            position: 0,
          },
          {
            id: "m-2",
            url: "https://assets.commerceos.local/kids-sandal-side.jpg",
            kind: "image",
            position: 1,
          },
          {
            id: "m-3",
            url: "https://assets.commerceos.local/kids-sandal-sole.jpg",
            kind: "image",
            position: 2,
          },
        ],
        attributes: [
          { key: "color", label: "Color", value: "Pink" },
          { key: "material", label: "Material", value: "EVA" },
        ],
        marketplaces: [],
        permissions: {
          canEdit: true,
          canPublish: true,
          canSync: true,
          canUseAI: false,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const readinessList = await channelReadinessService.computeAllChannelsReadiness(
        "ws-test",
        mockListing,
      );

      expect(readinessList.length).toBeGreaterThanOrEqual(5);

      const amzn = readinessList.find((r) => r.marketplace === MarketplaceName.AMAZON);
      expect(amzn).toBeDefined();
      expect(amzn?.categoryMapped).toBe(true);
      expect(amzn?.score).toBeGreaterThan(80);
      expect(amzn?.status).toBe("NOT_CONNECTED"); // Honest state when seller has not connected Amazon account
    });
  });
});

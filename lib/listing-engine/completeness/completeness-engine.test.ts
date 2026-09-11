import { describe, expect, it } from "vitest";
import ProductMapper from "@/lib/mappers/product.mapper";
import { products } from "@/lib/mocks/products";
import { evaluateMasterCompleteness } from "./completeness-engine";

describe("master product completeness engine", () => {
  it("evaluates master completeness across all dimensions", () => {
    const listing = ProductMapper.toMasterListing(products[0]);
    const result = evaluateMasterCompleteness(listing, products[0]);

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["COMPLETE", "ACTION_REQUIRED", "INCOMPLETE"]).toContain(result.status);
    expect(Array.isArray(result.dimensions)).toBe(true);
    expect(result.dimensions.length).toBeGreaterThanOrEqual(6);

    const identityDim = result.dimensions.find((d) => d.dimension === "identity");
    expect(identityDim).toBeDefined();
    expect(identityDim!.weight).toBe(0.20);
  });

  it("does not penalize standalone products for absence of variants", () => {
    const listing = ProductMapper.toMasterListing(products[0]);
    // Ensure no variants
    listing.variants = [];
    const result = evaluateMasterCompleteness(listing, products[0]);

    const variantDim = result.dimensions.find((d) => d.dimension === "variants");
    expect(variantDim).toBeDefined();
    expect(variantDim!.status).toBe("COMPLETE");
    expect(variantDim!.score).toBe(100);
  });
});

import { describe, expect, it } from "vitest";
import ProductMapper from "@/lib/mappers/product.mapper";
import { products } from "@/lib/mocks/products";
import { buildConsolidatedExceptions } from "./exception-intelligence";
import { MarketplaceName } from "@/lib/types/master-listing";

describe("exception intelligence & consolidation", () => {
  it("consolidates multi-channel duplicate requirements into single master exception", () => {
    const listing = ProductMapper.toMasterListing(products[0]);
    // Clear country of origin attribute
    listing.attributes = listing.attributes.filter((a) => a.key !== "country_of_origin");

    const exceptions = buildConsolidatedExceptions(listing);
    const originException = exceptions.find((e) => e.fieldKey === "country_of_origin");

    expect(originException).toBeDefined();
    expect(originException!.severity).toBe("BLOCKER");
    expect(originException!.affectedMarketplaces.length).toBeGreaterThanOrEqual(2);
    expect(originException!.affectedMarketplaces).toContain(MarketplaceName.AMAZON);
    expect(originException!.affectedMarketplaces).toContain(MarketplaceName.FLIPKART);
  });

  it("distinguishes blockers, warnings, and info items", () => {
    const listing = ProductMapper.toMasterListing(products[0]);
    const exceptions = buildConsolidatedExceptions(listing);

    for (const ex of exceptions) {
      expect(["BLOCKER", "WARNING", "INFO"]).toContain(ex.severity);
      expect(ex.fieldKey).toBeDefined();
      expect(ex.reason).toBeDefined();
      expect(ex.targetWorkspace).toBeDefined();
    }
  });
});

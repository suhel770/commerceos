import { describe, expect, it } from "vitest";

import ProductMapper from "@/lib/mappers/product.mapper";
import { products } from "@/lib/mocks/products";
import { MarketplaceName } from "@/lib/types/master-listing";

import {
  computeChannelReadiness,
  computePublishingReadinessScore,
  validateListingPipeline,
} from "./compute-readiness";

describe("listing readiness", () => {
  it("produces distinct channel readiness scores", () => {
    const listing = ProductMapper.toMasterListing(products[0]);
    const channels = computeChannelReadiness(listing);

    expect(channels.length).toBeGreaterThan(0);

    const amazon = channels.find(
      (channel) => channel.marketplace === MarketplaceName.AMAZON,
    );
    const flipkart = channels.find(
      (channel) => channel.marketplace === MarketplaceName.FLIPKART,
    );

    expect(amazon).toBeDefined();
    expect(flipkart).toBeDefined();
    expect(typeof amazon?.score).toBe("number");
    expect(amazon!.score).toBeGreaterThanOrEqual(0);
    expect(amazon!.score).toBeLessThanOrEqual(100);
  });

  it("returns a unified publishing readiness score", () => {
    const listing = ProductMapper.toMasterListing(products[0]);
    const score = computePublishingReadinessScore(listing);
    const pipeline = validateListingPipeline(listing);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(pipeline.productId).toBe(listing.id);
    expect(Array.isArray(pipeline.channels)).toBe(true);
  });
});

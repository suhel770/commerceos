import { describe, expect, it } from "vitest";

import ProductMapper from "@/lib/mappers/product.mapper";
import { products } from "@/lib/mocks/products";
import { MarketplaceName } from "@/lib/types/master-listing";

import {
  computeDetailedChannelReadiness,
  computePublishingReadinessScore,
  validateListingPipeline,
} from "./compute-readiness";

describe("listing readiness engine", () => {
  it("produces distinct channel readiness with discrete states and factors", () => {
    const listing = ProductMapper.toMasterListing(products[0]);
    const channels = computeDetailedChannelReadiness(listing);

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
    expect(["READY", "ACTION_REQUIRED", "NOT_CONNECTED", "NOT_CONFIGURED", "BLOCKED", "ERROR"]).toContain(amazon!.state);
    expect(amazon!.factors).toHaveProperty("identity");
    expect(amazon!.factors).toHaveProperty("category");
    expect(amazon!.factors).toHaveProperty("commercials");
    expect(amazon!.factors).toHaveProperty("media");
    expect(amazon!.factors).toHaveProperty("compliance");
  });

  it("returns a unified publishing readiness score and pipeline validation", () => {
    const listing = ProductMapper.toMasterListing(products[0]);
    const score = computePublishingReadinessScore(listing);
    const pipeline = validateListingPipeline(listing);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(typeof pipeline.isMasterValid).toBe("boolean");
    expect(Array.isArray(pipeline.channelReadiness)).toBe(true);
    expect(typeof pipeline.eligiblePublishCount).toBe("number");
  });
});

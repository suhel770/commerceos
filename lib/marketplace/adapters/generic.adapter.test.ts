import {
  describe,
  expect,
  it,
} from "vitest";

import ProductMapper from "@/lib/mappers/product.mapper";
import { products } from "@/lib/mocks/products";
import { MarketplaceName } from "@/lib/types/master-listing";

import { getMarketplaceAdapter } from "./generic.adapter";

describe("marketplace adapters", () => {
  it("keeps marketplace transforms outside the core listing model", () => {
    const listing =
      ProductMapper.toMasterListing(
        products[0],
      );
    const adapter =
      getMarketplaceAdapter(
        MarketplaceName.AMAZON,
      );
    const payload =
      adapter.transform(listing);

    expect(payload.marketplace).toBe(
      MarketplaceName.AMAZON,
    );
    expect(payload.externalSku).toBe(
      listing.identity.sku,
    );
    expect(payload.title).toBe(
      listing.identity.productName,
    );
    expect(adapter.readiness(listing).score).toBeGreaterThanOrEqual(
      0,
    );
    expect(Object.keys(adapter.mapAttributes(listing)).length).toBeGreaterThanOrEqual(
      0,
    );
  });
});

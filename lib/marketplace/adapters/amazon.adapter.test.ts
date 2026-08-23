import { describe, expect, it } from "vitest";

import ProductMapper from "@/lib/mappers/product.mapper";
import { products } from "@/lib/mocks/products";
import { MarketplaceName } from "@/lib/types/master-listing";

import { amazonAdapter } from "./amazon.adapter";
import { getMarketplaceAdapter } from "./generic.adapter";

describe("amazon adapter", () => {
  it("maps and transforms amazon-specific fields", () => {
    const listing = ProductMapper.toMasterListing(products[0]);
    const payload = amazonAdapter.transform(listing);
    const mapped = amazonAdapter.mapAttributes(listing);

    expect(payload.marketplace).toBe(MarketplaceName.AMAZON);
    expect(payload.title).toBe(listing.identity.productName);
    expect(mapped.brand_name).toBe(listing.identity.brand);
    expect(mapped.hsn_code).toBe(listing.identity.hsn);
  });

  it("is registered through the adapter registry", () => {
    const adapter = getMarketplaceAdapter(MarketplaceName.AMAZON);
    expect(adapter.marketplace).toBe(MarketplaceName.AMAZON);
    expect(adapter.readiness).toBeTypeOf("function");
  });
});

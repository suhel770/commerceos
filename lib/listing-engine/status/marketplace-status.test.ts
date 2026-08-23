import { describe, expect, it } from "vitest";

import ProductMapper from "@/lib/mappers/product.mapper";
import { products } from "@/lib/mocks/products";
import {
  MarketplacePublishStatus,
} from "@/lib/types/master-listing";

import {
  buildMarketplaceStatusCards,
  deriveOperationalStatus,
  operationalStatusLabel,
} from "./marketplace-status";

describe("marketplace status tracking", () => {
  it("maps published in-stock channels to Active", () => {
    const listing = ProductMapper.toMasterListing(products[0]);
    const connection = {
      ...listing.marketplaces[0],
      enabled: true,
      publishStatus: MarketplacePublishStatus.PUBLISHED,
      validationScore: 96,
      externalId: "B0TESTASIN",
    };

    expect(
      deriveOperationalStatus({
        connection,
        availableStock: 20,
        openErrors: 0,
      }),
    ).toBe("active");

    expect(operationalStatusLabel("partial_active")).toBe(
      "Partial Active",
    );
  });

  it("flags out of stock and error states", () => {
    const listing = ProductMapper.toMasterListing(products[0]);
    const connection = listing.marketplaces[0];

    expect(
      deriveOperationalStatus({
        connection: {
          ...connection,
          enabled: true,
          publishStatus: MarketplacePublishStatus.PUBLISHED,
        },
        availableStock: 0,
        openErrors: 0,
      }),
    ).toBe("out_of_stock");

    expect(
      deriveOperationalStatus({
        connection: {
          ...connection,
          enabled: true,
          publishStatus: MarketplacePublishStatus.FAILED,
        },
        availableStock: 10,
        openErrors: 1,
      }),
    ).toBe("error");
  });

  it("builds status cards for unified management", () => {
    const listing = ProductMapper.toMasterListing(products[0]);
    const cards = buildMarketplaceStatusCards(listing);

    expect(cards.length).toBe(listing.marketplaces.length);
    expect(cards[0]).toHaveProperty("visibility");
    expect(cards[0]).toHaveProperty("health");
    expect(cards[0]).toHaveProperty("operationalStatus");
  });
});

import {
  describe,
  expect,
  it,
} from "vitest";

import { products } from "@/lib/mocks/products";
import { defaultProductFilters } from "@/lib/types/product-filter";

import { filterProducts } from "./productFilter.service";

describe("filterProducts", () => {
  it("applies advanced price and health filters", () => {
    const filtered =
      filterProducts(products, {
        ...defaultProductFilters,
        sellingPrice: {
          min: 500,
        },
        productHealth: [
          "excellent",
        ],
      });

    expect(
      filtered.every(
        (product) =>
          product.pricing
            .sellingPrice >=
            500 &&
          product.performance
            .healthScore >=
            90,
      ),
    ).toBe(true);
  });
});

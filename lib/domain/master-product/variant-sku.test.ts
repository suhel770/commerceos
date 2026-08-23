import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildVariantSku,
  regenerateVariantSkus,
} from "./variant-sku";

describe("variant SKU helpers", () => {
  it("builds SKUs from option values", () => {
    expect(
      buildVariantSku(
        "LW-001",
        {
          Color: "Green",
          Size: "5C",
        },
        0,
      ),
    ).toBe("LW-001-GREEN-5C");
  });

  it("regenerates every variant SKU", () => {
    const variants =
      regenerateVariantSkus(
        "LW-001",
        [
          {
            id: "1",
            sku: "OLD",
            title: "Green / 5C",
            optionValues: {
              Color: "Green",
              Size: "5C",
            },
            mediaIds: [],
            active: true,
          },
        ],
      );

    expect(variants[0]?.sku).toBe(
      "LW-001-GREEN-5C",
    );
  });
});

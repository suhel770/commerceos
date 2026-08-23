import {
  describe,
  expect,
  it,
} from "vitest";

import { masterListingPatchSchema } from "./master-listing.schema";

describe("masterListingPatchSchema", () => {
  it("requires a revision for conflict-safe updates", () => {
    const result =
      masterListingPatchSchema.safeParse(
        {
          pricing: {
            mrp: 999,
            sellingPrice: 699,
            costPrice: 350,
            currency: "INR",
          },
        },
      );

    expect(result.success).toBe(
      false,
    );
  });

  it("rejects unknown fields at the API boundary", () => {
    const result =
      masterListingPatchSchema.safeParse(
        {
          revision: 1,
          unsafe: true,
        },
      );

    expect(result.success).toBe(
      false,
    );
  });
});

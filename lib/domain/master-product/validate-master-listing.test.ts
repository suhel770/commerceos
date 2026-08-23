import {
  describe,
  expect,
  it,
} from "vitest";

import ProductMapper from "@/lib/mappers/product.mapper";
import { products } from "@/lib/mocks/products";
import { ValidationSeverity } from "@/lib/types/master-listing";

import { validateMasterListing } from "./validate-master-listing";

function listingFixture() {
  return ProductMapper.toMasterListing(
    products[0],
  );
}

describe("validateMasterListing", () => {
  it("returns deterministic issues for an invalid title", () => {
    const listing =
      listingFixture();
    listing.identity.productName =
      "";

    const result =
      validateMasterListing(
        listing,
      );

    expect(result.valid).toBe(
      false,
    );
    expect(
      result.issues,
    ).toContainEqual(
      expect.objectContaining({
        id: "identity.productName.required",
        severity:
          ValidationSeverity.ERROR,
      }),
    );
  });

  it("allows advisory issues without blocking publish readiness", () => {
    const listing =
      listingFixture();
    listing.identity.hsn =
      undefined;

    const result =
      validateMasterListing(
        listing,
      );

    expect(
      result.issues.some(
        (issue) =>
          issue.id ===
          "compliance.hsn.required",
      ),
    ).toBe(true);
    expect(
      result.issues.some(
        (issue) =>
          issue.severity ===
          ValidationSeverity.ERROR,
      ),
    ).toBe(false);
    expect(result.valid).toBe(
      true,
    );
  });
});

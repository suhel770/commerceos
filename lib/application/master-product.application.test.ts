import {
  describe,
  expect,
  it,
} from "vitest";

import ProductMapper from "@/lib/mappers/product.mapper";
import { products } from "@/lib/mocks/products";
import {
  AuthorizationError,
} from "@/lib/platform/authorization";
import {
  createMockCommerceContext,
  type ProductPermission,
} from "@/lib/platform/commerce-context";
import { masterListingRepository } from "@/lib/repositories/masterListing.repository";

import {
  masterProductApplication,
} from "./master-product.application";

describe("masterProductApplication", () => {
  it("denies updates without edit permission", async () => {
    const listing =
      ProductMapper.toMasterListing(
        products[0],
      );
    await masterListingRepository.create(
      listing,
    );

    const viewOnly: readonly ProductPermission[] =
      ["products.view"];
    const context = {
      ...createMockCommerceContext(
        "deny-edit",
      ),
      actor: {
        ...createMockCommerceContext()
          .actor,
        permissions: viewOnly,
      },
    };

    await expect(
      masterProductApplication.update(
        context,
        listing.id,
        {
          identity: {
            ...listing.identity,
            productName: "Denied",
          },
        },
        listing.revision,
      ),
    ).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });
});

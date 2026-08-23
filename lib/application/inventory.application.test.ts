import { describe, expect, it } from "vitest";

import { AuthorizationError } from "@/lib/platform/authorization";
import {
  createMockCommerceContext,
  type ProductPermission,
} from "@/lib/platform/commerce-context";
import { products } from "@/lib/mocks/products";

import { inventoryApplication } from "./inventory.application";

describe("inventoryApplication", () => {
  it("denies adjust without inventory.adjust permission", async () => {
    const viewOnly: readonly ProductPermission[] = ["inventory.view"];
    const context = {
      ...createMockCommerceContext("deny-adjust"),
      actor: {
        ...createMockCommerceContext().actor,
        permissions: viewOnly,
      },
    };

    await expect(
      inventoryApplication.adjust(context, {
        productId: products[0].id,
        delta: 1,
        reason: "Denied",
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("adjusts stock when permitted", async () => {
    const context = createMockCommerceContext("allow-adjust");
    const before = await inventoryApplication.get(
      context,
      products[0].id,
    );

    const result = await inventoryApplication.adjust(context, {
      productId: products[0].id,
      delta: 2,
      reason: "Test restock",
    });

    expect(result.balance.available).toBeGreaterThanOrEqual(0);
    expect(result.movement.type).toBe("Adjustment");

    const after = await inventoryApplication.get(
      context,
      products[0].id,
    );
    expect(after.totals.available).toBe(before.totals.available + 2);
  });
});

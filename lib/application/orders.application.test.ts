import { describe, expect, it } from "vitest";

import { inventoryApplication } from "@/lib/application/inventory.application";
import { OrderError } from "@/lib/orders";
import { AuthorizationError } from "@/lib/platform/authorization";
import {
  createMockCommerceContext,
  type ProductPermission,
} from "@/lib/platform/commerce-context";
import { products } from "@/lib/mocks/products";

import { ordersApplication } from "./orders.application";

describe("ordersApplication OMS lifecycle", () => {
  it("denies fulfil without orders.fulfil permission", async () => {
    const viewOnly: readonly ProductPermission[] = [
      "orders.view",
      "orders.create",
    ];
    const context = {
      ...createMockCommerceContext("deny-fulfil"),
      actor: {
        ...createMockCommerceContext().actor,
        permissions: viewOnly,
      },
    };

    const owner = createMockCommerceContext("seed-for-deny");
    const order = await ordersApplication.create(owner, {
      channel: "Manual",
      lines: [
        {
          productId: products[0].id,
          sku: products[0].sku,
          productName: products[0].name,
          quantity: 1,
          unitPrice: 499,
        },
      ],
    });

    await expect(
      ordersApplication.pick(context, order.id),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("holds pending payment without reserving stock", async () => {
    const context = createMockCommerceContext("pending-hold");
    const product = products[0];
    const before = await inventoryApplication.get(context, product.id);

    const order = await ordersApplication.create(context, {
      channel: "Amazon",
      paymentStatus: "pending",
      lines: [
        {
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          quantity: 1,
          unitPrice: product.listings[0]?.sellingPrice ?? 499,
        },
      ],
    });

    expect(order.status).toBe("OnHold");
    const after = await inventoryApplication.get(context, product.id);
    expect(after.totals.available).toBe(before.totals.available);
    expect(after.totals.reserved).toBe(before.totals.reserved);
  });

  it("runs paid create through close and consumes stock on ship", async () => {
    const context = createMockCommerceContext("full-lifecycle");
    const product = products[1] ?? products[0];
    const before = await inventoryApplication.get(context, product.id);

    let order = await ordersApplication.create(context, {
      channel: "Manual",
      paymentStatus: "paid",
      lines: [
        {
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          quantity: 1,
          unitPrice: product.listings[0]?.sellingPrice ?? 399,
        },
      ],
    });
    expect(order.status).toBe("Allocated");
    expect(order.warehouseId).toBeTruthy();
    expect(order.lines[0]?.reservationId).toBeTruthy();

    const afterAlloc = await inventoryApplication.get(context, product.id);
    expect(afterAlloc.totals.available).toBe(before.totals.available - 1);
    expect(afterAlloc.totals.reserved).toBe(before.totals.reserved + 1);

    order = await ordersApplication.pick(context, order.id);
    expect(order.status).toBe("Picked");
    order = await ordersApplication.pack(context, order.id);
    expect(order.status).toBe("Packed");
    order = await ordersApplication.ship(context, order.id, {
      courier: "BlueDart",
    });
    expect(order.status).toBe("Shipped");
    expect(order.shipping?.awb).toBeTruthy();
    expect(order.lines[0]?.reservationId).toBeUndefined();

    const afterShip = await inventoryApplication.get(context, product.id);
    expect(afterShip.totals.available).toBe(before.totals.available - 1);
    expect(afterShip.totals.reserved).toBe(before.totals.reserved);

    order = await ordersApplication.deliver(context, order.id);
    expect(order.status).toBe("Delivered");
    order = await ordersApplication.close(context, order.id);
    expect(order.status).toBe("Closed");
  });

  it("settles marketplace orders then closes; rejects invalid transition", async () => {
    const context = createMockCommerceContext("settle-path");
    const product = products[2] ?? products[0];

    let order = await ordersApplication.create(context, {
      channel: "Flipkart",
      paymentStatus: "paid",
      lines: [
        {
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          quantity: 1,
          unitPrice: product.listings[0]?.sellingPrice ?? 299,
        },
      ],
    });

    order = await ordersApplication.pick(context, order.id);
    order = await ordersApplication.pack(context, order.id);
    order = await ordersApplication.ship(context, order.id);
    order = await ordersApplication.deliver(context, order.id);

    await expect(
      ordersApplication.close(context, order.id),
    ).rejects.toBeInstanceOf(OrderError);

    order = await ordersApplication.settle(context, order.id);
    expect(order.status).toBe("Settled");
    expect(order.settlement?.netSettlement).toBeGreaterThan(0);
    expect(order.settlement?.settlementStatus).toBe("reconciled");

    order = await ordersApplication.close(context, order.id);
    expect(order.status).toBe("Closed");
  });

  it("triggers RTO after 3 failed delivery attempts and completes restock", async () => {
    const context = createMockCommerceContext("rto-path");
    const product = products[4] ?? products[0];

    await inventoryApplication.adjust(context, {
      productId: product.id,
      delta: 5,
      reason: "Test restock for RTO path",
    });
    const before = await inventoryApplication.get(context, product.id);

    let order = await ordersApplication.create(context, {
      channel: "Amazon",
      paymentStatus: "paid",
      lines: [
        {
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          quantity: 1,
          unitPrice: product.listings[0]?.sellingPrice ?? 199,
        },
      ],
    });

    order = await ordersApplication.pick(context, order.id);
    order = await ordersApplication.pack(context, order.id);
    order = await ordersApplication.ship(context, order.id);
    expect(order.shipping?.trackingStatus).toBe("in_transit");

    order = await ordersApplication.advanceTracking(
      context,
      order.id,
      "out_for_delivery",
    );
    expect(order.shipping?.trackingStatus).toBe("out_for_delivery");

    order = await ordersApplication.recordFailedAttempt(
      context,
      order.id,
      "No response",
    );
    expect(order.status).toBe("Shipped");
    expect(order.shipping?.deliveryAttempts).toBe(1);

    order = await ordersApplication.recordFailedAttempt(context, order.id);
    expect(order.shipping?.deliveryAttempts).toBe(2);

    order = await ordersApplication.recordFailedAttempt(context, order.id);
    expect(order.status).toBe("Shipped");
    expect(order.returnCase?.kind).toBe("rto");
    expect(
      order.shipments.some((shipment) => shipment.event === "rto_in_transit"),
    ).toBe(true);
    expect(order.shipping?.trackingStatus).toBe("rto_in_transit");

    order = await ordersApplication.receiveReturn(context, order.id);
    expect(order.returnCase?.status).toBe("received");

    order = await ordersApplication.disposeReturn(context, order.id, "restock");
    expect(
      order.shipments.some((shipment) => shipment.event === "rto_completed"),
    ).toBe(true);
    expect(order.returnCase?.disposition).toBe("restock");

    const after = await inventoryApplication.get(context, product.id);
    expect(after.totals.available).toBe(before.totals.available);
  });

  it("downloads marketplace label after pack", async () => {
    const context = createMockCommerceContext("label-download");
    const product = products[0];

    await inventoryApplication.adjust(context, {
      productId: product.id,
      delta: 3,
      reason: "Test stock for label",
    });

    let order = await ordersApplication.create(context, {
      channel: "Amazon",
      paymentStatus: "paid",
      lines: [
        {
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          quantity: 1,
          unitPrice: product.listings[0]?.sellingPrice ?? 499,
        },
      ],
    });

    order = await ordersApplication.pick(context, order.id);
    order = await ordersApplication.pack(context, order.id);
    expect(order.shipments.length).toBeGreaterThan(0);

    const { order: labeled, document } = await ordersApplication.downloadLabel(
      context,
      order.id,
    );
    expect(labeled.shipping?.labelUrl).toContain("/label");
    expect(document.channel).toBe("Amazon");
    expect(document.awb).toBeTruthy();
    expect(document.body).toContain("SHIPPING LABEL");
    expect(document.filename).toContain("Amazon");
  });

  it("opens return and restocks inventory", async () => {
    const context = createMockCommerceContext("return-restock");
    const product = products[3] ?? products[0];
    const before = await inventoryApplication.get(context, product.id);

    let order = await ordersApplication.create(context, {
      channel: "Amazon",
      paymentStatus: "paid",
      lines: [
        {
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          quantity: 1,
          unitPrice: product.listings[0]?.sellingPrice ?? 199,
        },
      ],
    });

    order = await ordersApplication.pick(context, order.id);
    order = await ordersApplication.pack(context, order.id);
    order = await ordersApplication.ship(context, order.id);
    order = await ordersApplication.deliver(context, order.id);

    const afterShip = await inventoryApplication.get(context, product.id);
    expect(afterShip.totals.available).toBe(before.totals.available - 1);

    order = await ordersApplication.openReturn(context, order.id, {
      kind: "return",
      reason: "Damaged in transit",
    });
    expect(order.returnCase?.status).toBe("requested");

    order = await ordersApplication.approveReturn(context, order.id);
    expect(order.returnCase?.status).toBe("approved");

    order = await ordersApplication.markReturnInTransit(context, order.id);
    expect(order.returnCase?.status).toBe("in_transit");

    order = await ordersApplication.receiveReturn(context, order.id);
    expect(order.returnCase?.status).toBe("received");

    order = await ordersApplication.disposeReturn(context, order.id, "restock");
    expect(order.returnCase?.status).toBe("disposed");
    expect(order.returnCase?.disposition).toBe("restock");

    const afterRestock = await inventoryApplication.get(context, product.id);
    expect(afterRestock.totals.available).toBe(before.totals.available);
  });
});

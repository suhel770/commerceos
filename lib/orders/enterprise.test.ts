import { describe, expect, it } from "vitest";

import { orderRepository } from "./repository";
import { orderService } from "./service";
import { PRE_SHIP_CANCELABLE } from "./types";

describe("enterprise orders domain", () => {
  it("creates and lists orders cleanly", async () => {
    const draft = await orderService.createDraft({
      organizationId: "org-commerceos",
      workspaceId: "ws-default",
      channel: "Amazon",
      customer: { name: "Test Customer", city: "Mumbai" },
      lines: [
        {
          productId: "STRIDE-KIDS-KID-402",
          sku: "STRIDE-KIDS-KID-402",
          productName: "Test Shoe",
          quantity: 2,
          unitPrice: 499,
        },
      ],
    });

    expect(draft.id).toBeTruthy();
    expect(draft.customer.name).toBe("Test Customer");

    const orders = await orderRepository.list({
      organizationId: "org-commerceos",
      workspaceId: "ws-default",
    });
    expect(orders.length).toBeGreaterThanOrEqual(1);
  });

  it("cancels a pre-ship order and records activity-safe status", async () => {
    const draft = await orderService.createDraft({
      organizationId: "org-commerceos",
      workspaceId: "ws-default",
      channel: "Shopify",
      customer: { name: "Cancel Test Customer", city: "Delhi" },
      lines: [
        {
          productId: "STRIDE-KIDS-KID-402",
          sku: "STRIDE-KIDS-KID-402",
          productName: "Test Shoe",
          quantity: 1,
          unitPrice: 299,
        },
      ],
    });

    const cancelled = await orderService.cancel(
      draft.id,
      "Vitest cancel",
    );
    expect(cancelled.status).toBe("Cancelled");
    expect(cancelled.cancelReason).toContain("Vitest");
  });

  it("adds an internal note", async () => {
    const draft = await orderService.createDraft({
      organizationId: "org-commerceos",
      workspaceId: "ws-default",
      channel: "Manual",
      customer: { name: "Note Test Customer", city: "Bengaluru" },
      lines: [
        {
          productId: "STRIDE-KIDS-KID-402",
          sku: "STRIDE-KIDS-KID-402",
          productName: "Test Shoe",
          quantity: 1,
          unitPrice: 199,
        },
      ],
    });

    const next = await orderService.addInternalNote(
      draft.id,
      "Ops note from test",
      "tester",
    );
    expect(next.internalNotes[0]?.body).toBe("Ops note from test");
  });
});

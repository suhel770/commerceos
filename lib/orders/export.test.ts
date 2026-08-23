import { describe, expect, it } from "vitest";

import { buildOrdersExcel, orderCreatedInRange } from "./export";
import type { Order } from "./types";

const sample: Order = {
  id: "ord-1",
  orderNumber: "ORD-2001",
  organizationId: "org-commerceos",
  workspaceId: "ws-default",
  channel: "Amazon",
  status: "Allocated",
  paymentStatus: "paid",
  shippingMode: "marketplace",
  priority: "normal",
  tags: ["Prepaid"],
  customer: { name: "Test Buyer", city: "Bengaluru" },
  lines: [
    {
      id: "line-1",
      productId: "prd_001",
      sku: "LW-001",
      productName: "LilWalk Dino Clogs",
      quantity: 2,
      unitPrice: 499,
    },
  ],
  totals: { subtotal: 998, currency: "INR" },
  shipments: [],
  holds: [],
  timeline: [],
  documents: [],
  claims: [],
  internalNotes: [],
  activity: [],
  createdAt: "2026-07-20T10:00:00.000Z",
  updatedAt: "2026-07-20T10:00:00.000Z",
};

describe("orders export", () => {
  it("builds Excel SpreadsheetML with order rows", () => {
    const excel = buildOrdersExcel([sample]);
    expect(excel.filename).toContain("commerceos-orders-");
    expect(excel.contentType).toContain("excel");
    expect(excel.body).toContain("ORD-2001");
    expect(excel.body).toContain("LW-001");
    expect(excel.body).toContain("Amazon");
  });

  it("filters by created date range", () => {
    expect(orderCreatedInRange(sample, "2026-07-01", "2026-07-31")).toBe(true);
    expect(orderCreatedInRange(sample, "2026-07-21", "2026-07-31")).toBe(false);
    expect(orderCreatedInRange(sample, undefined, "2026-07-19")).toBe(false);
  });
});

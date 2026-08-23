import { describe, expect, it } from "vitest";

import { isInterstateSupply, splitGst } from "@/lib/purchase/gst";

import {
  DEMO_ANCHOR_DATE,
  DEMO_BILLS,
  DEMO_BUSINESS,
  DEMO_CATALOG,
  DEMO_VENDORS,
} from "./index";

describe("StrideKids demo-business SSOT", () => {
  it("has expected vendor and catalog scale", () => {
    expect(DEMO_VENDORS.length).toBeGreaterThanOrEqual(15);
    expect(DEMO_CATALOG.length).toBe(0);
    expect(DEMO_BILLS.length).toBe(0);
    expect(DEMO_BUSINESS.buyerStateCode).toBe("27");
  });

  it("uses unique stable IDs", () => {
    const vendorIds = DEMO_VENDORS.map((v) => v.id);
    const productIds = DEMO_CATALOG.map((p) => p.id);
    const billIds = DEMO_BILLS.map((b) => b.id);
    expect(new Set(vendorIds).size).toBe(vendorIds.length);
    expect(new Set(productIds).size).toBe(productIds.length);
    expect(new Set(billIds).size).toBe(billIds.length);
  });

  it("links every catalog SKU to a known vendor", () => {
    const vendors = new Set(DEMO_VENDORS.map((v) => v.id));
    for (const product of DEMO_CATALOG) {
      expect(product.vendorId).toBeTruthy();
      expect(vendors.has(product.vendorId!)).toBe(true);
      expect(product.sku).toBeTruthy();
      expect(product.hsn).toBeTruthy();
      expect(product.pricing.costPrice).toBeGreaterThan(0);
    }
  });

  it("links every bill to a known vendor and keeps dates in window", () => {
    const vendors = new Set(DEMO_VENDORS.map((v) => v.id));
    for (const bill of DEMO_BILLS) {
      expect(vendors.has(bill.vendorId)).toBe(true);
      expect(bill.billDate <= DEMO_ANCHOR_DATE).toBe(true);
      expect(bill.billDate >= "2026-01-01").toBe(true);
      expect(bill.lines.length).toBeGreaterThan(0);
    }
  });

  it("resolves productId on inventory and packaging lines", () => {
    const products = new Map(DEMO_CATALOG.map((p) => [p.id, p]));
    for (const bill of DEMO_BILLS) {
      if (
        bill.purchaseType !== "inventory_product" &&
        bill.purchaseType !== "packaging_material"
      ) {
        continue;
      }
      for (const line of bill.lines) {
        if (!line.productId) continue;
        const product = products.get(line.productId);
        expect(product).toBeTruthy();
        expect(line.sku).toBe(product!.sku);
      }
    }
  });

  it("applies CGST+SGST vs IGST correctly and balances totals", () => {
    const vendors = new Map(DEMO_VENDORS.map((v) => [v.id, v]));
    for (const bill of DEMO_BILLS) {
      const vendor = vendors.get(bill.vendorId)!;
      const expectedInterstate = isInterstateSupply(
        vendor.gstin,
        DEMO_BUSINESS.buyerStateCode,
      );
      expect(bill.interstate).toBe(expectedInterstate);
      if (expectedInterstate) {
        expect(bill.cgstAmount).toBe(0);
        expect(bill.sgstAmount).toBe(0);
      } else if (bill.taxAmount > 0 && vendor.gstin) {
        expect(bill.igstAmount).toBe(0);
      }

      const recomputedTax = bill.lines.reduce((sum, line) => {
        const taxable = Number(
          (
            line.amount *
            (bill.subtotal > 0
              ? 1 - bill.discountAmount / bill.subtotal
              : 1)
          ).toFixed(2),
        );
        return (
          sum +
          splitGst({
            taxable,
            gstRate: line.gstRate,
            interstate: bill.interstate,
          }).taxAmount
        );
      }, 0);

      expect(Math.abs(recomputedTax - bill.taxAmount)).toBeLessThan(0.05);

      const beforeRound =
        bill.subtotal -
        bill.discountAmount +
        bill.taxAmount +
        bill.freightAmount +
        bill.otherCharges;
      expect(
        Math.abs(beforeRound + bill.roundOff - bill.totalAmount),
      ).toBeLessThan(0.02);
    }
  });

  it("includes open credit / unpaid bills for Level-1 dues", () => {
    const open = DEMO_BILLS.filter(
      (bill) =>
        bill.paymentStatus === "unpaid" || bill.paymentStatus === "partial",
    );
    expect(open.length).toBeGreaterThan(0);
    expect(
      DEMO_BILLS.some(
        (bill) =>
          bill.status === "ordered" && bill.paymentStatus !== "paid",
      ),
    ).toBe(true);
  });

  it("covers the major purchase types", () => {
    const types = new Set(DEMO_BILLS.map((b) => b.purchaseType));
    for (const required of [
      "inventory_product",
      "packaging_material",
      "office_expense",
      "asset",
      "software",
      "marketing",
      "courier",
      "utilities",
      "rent",
      "professional_fees",
    ] as const) {
      expect(types.has(required)).toBe(true);
    }
  });
});

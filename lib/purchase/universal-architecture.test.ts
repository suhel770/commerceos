import { describe, expect, it } from "vitest";

import { purchaseRepository } from "./repository";
import {
  canRequireQC,
  determineLineDestination,
  resolveIntentFromPurchaseType,
} from "./routing";

describe("Universal Purchase Architecture v2", () => {
  describe("Business Intent Resolution", () => {
    it("maps legacy purchase types to accurate default business intents", () => {
      expect(resolveIntentFromPurchaseType("inventory_product")).toBe("sellable");
      expect(resolveIntentFromPurchaseType("packaging_material")).toBe("consumable");
      expect(resolveIntentFromPurchaseType("asset")).toBe("asset");
      expect(resolveIntentFromPurchaseType("office_expense")).toBe("expense");
      expect(resolveIntentFromPurchaseType("marketing")).toBe("marketing");
      expect(resolveIntentFromPurchaseType("software")).toBe("service");
      expect(resolveIntentFromPurchaseType("service")).toBe("service");
      expect(resolveIntentFromPurchaseType("professional_fees")).toBe("service");
      expect(resolveIntentFromPurchaseType("courier")).toBe("freight");
      expect(resolveIntentFromPurchaseType("rent")).toBe("other");
    });
  });

  describe("Line Destination Engine", () => {
    it("routes sellable goods to sellable_inventory", () => {
      const dest = determineLineDestination({ intent: "sellable" });
      expect(dest).toBe("sellable_inventory");
    });

    it("routes consumable packaging materials to consumable_inventory", () => {
      const dest = determineLineDestination({ intent: "consumable" });
      expect(dest).toBe("consumable_inventory");
    });

    it("routes assets to asset_register and never into inventory", () => {
      const dest = determineLineDestination({ intent: "asset" });
      expect(dest).toBe("asset_register");
    });

    it("routes expenses, services, and marketing to finance_expense", () => {
      expect(determineLineDestination({ intent: "expense" })).toBe("finance_expense");
      expect(determineLineDestination({ intent: "service" })).toBe("finance_expense");
      expect(determineLineDestination({ intent: "marketing" })).toBe("finance_expense");
      expect(determineLineDestination({ intent: "other" })).toBe("finance_expense");
    });

    it("handles freight in expense mode vs landed_cost mode", () => {
      const expenseFreight = determineLineDestination({
        intent: "freight",
        freightMode: "expense",
      });
      expect(expenseFreight).toBe("finance_expense");

      const landedCostFreight = determineLineDestination({
        intent: "freight",
        freightMode: "landed_cost",
      });
      expect(landedCostFreight).toBe("landed_cost_allocation");
    });
  });

  describe("Quality Check (QC) Eligibility", () => {
    it("allows Quality Check ONLY for physical inventory lines (sellable, consumable)", () => {
      expect(canRequireQC("sellable")).toBe(true);
      expect(canRequireQC("consumable")).toBe(true);
    });

    it("disallows Quality Check for non-inventory lines (asset, expense, service, marketing, freight)", () => {
      expect(canRequireQC("asset")).toBe(false);
      expect(canRequireQC("expense")).toBe(false);
      expect(canRequireQC("service")).toBe(false);
      expect(canRequireQC("marketing")).toBe(false);
      expect(canRequireQC("freight")).toBe(false);
      expect(canRequireQC("other")).toBe(false);
    });
  });

  describe("Purchase Repository Bill Creation with Universal Line Intents", () => {
    it("creates a purchase bill containing mixed line intents", async () => {
      const vendors = await purchaseRepository.listVendors("org-commerceos", "ws-default");
      expect(vendors.length).toBeGreaterThan(0);
      const vendor = vendors[0]!;

      const bill = await purchaseRepository.createBill(
        "org-commerceos",
        "ws-default",
        {
          vendorId: vendor.id,
          purchaseType: "inventory_product",
          billDate: "2026-07-28",
          lines: [
            {
              description: "Running Shoes (Sellable)",
              quantity: 100,
              unitPrice: 1500,
              intent: "sellable",
            },
            {
              description: "Bubble Wrap & Tape (Consumable)",
              quantity: 50,
              unitPrice: 200,
              intent: "consumable",
            },
            {
              description: "Barcode Label Printer (Asset)",
              quantity: 2,
              unitPrice: 12000,
              intent: "asset",
            },
            {
              description: "Freight Delivery to Warehouse",
              quantity: 1,
              unitPrice: 3500,
              intent: "freight",
            },
            {
              description: "GST Filing & Audit Fee",
              quantity: 1,
              unitPrice: 5000,
              intent: "service",
            },
          ],
        },
        "usr-test-runner",
      );

      expect(bill).toBeDefined();
      expect(bill.lines).toHaveLength(5);
      expect(bill.lines[0]!.intent).toBe("sellable");
      expect(bill.lines[0]!.qcStatus).toBe("pending");
      expect(bill.lines[1]!.intent).toBe("consumable");
      expect(bill.lines[1]!.qcStatus).toBe("pending");
      expect(bill.lines[2]!.intent).toBe("asset");
      expect(bill.lines[2]!.qcStatus).toBe("not_applicable");
      expect(bill.lines[3]!.intent).toBe("freight");
      expect(bill.lines[3]!.qcStatus).toBe("not_applicable");
      expect(bill.lines[4]!.intent).toBe("service");
      expect(bill.lines[4]!.qcStatus).toBe("not_applicable");
    });

    it("verifies seeded demo bills automatically carry valid line intents", async () => {
      const bills = await purchaseRepository.listBills("org-commerceos", "ws-default");
      expect(bills.length).toBeGreaterThan(0);
      for (const bill of bills) {
        for (const line of bill.lines) {
          expect(line.intent).toBeDefined();
          expect(line.qcStatus).toBeDefined();
        }
      }
    });
  });
});

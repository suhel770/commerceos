import { describe, it, expect, beforeEach } from "vitest";
import { consumableRulesService, ConsumableRuleError } from "../consumable-rules.service";
import { consumableUsageRuleRepository } from "../consumable-rules.repository";
import { locationStockRepository } from "@/lib/storage/engine/receiving.engine";
import { inventoryConsumptionLedger } from "@/lib/inventory/consumption-ledger";

describe("CommerceOS — Product Consumable Usage Rules & BOM Specification", () => {
  const orgA = "org-merchant-alpha";
  const wsA = "ws-alpha";
  const orgB = "org-merchant-beta";
  const wsB = "ws-beta";

  beforeEach(() => {
    consumableUsageRuleRepository.clearForTesting();
    locationStockRepository.clearForTesting();
    inventoryConsumptionLedger.clearForTesting();

    // Set a known stock baseline for physical storage (100 boxes in inventory)
    locationStockRepository.addStock({
      storageLocationId: "loc-wh-main",
      productId: "SKU-BOX-S",
      sku: "SKU-BOX-S",
      productName: "Courier Box Small",
      intent: "consumable",
      availableQty: 100,
      receivedFromBillId: "BILL-001",
    });
  });

  it("creates valid consumable usage rules and retrieves them by product and SKU", () => {
    const rule1 = consumableRulesService.createRule({
      organizationId: orgA,
      workspaceId: wsA,
      productId: "prod-sandal-01",
      productSku: "SKU-NOVA-SAND-PNK",
      consumableSku: "SKU-BOX-S",
      consumableName: "Courier Box Small",
      quantity: 1,
      unit: "pcs",
      consumptionMode: "PER_UNIT",
      notes: "Primary box",
    });

    const rule2 = consumableRulesService.createRule({
      organizationId: orgA,
      workspaceId: wsA,
      productId: "prod-sandal-01",
      productSku: "SKU-NOVA-SAND-PNK",
      consumableSku: "SKU-POLY-M",
      consumableName: "Polybag Medium",
      quantity: 1,
      unit: "pcs",
      consumptionMode: "PER_UNIT",
    });

    expect(rule1.id).toBeDefined();
    expect(rule1.active).toBe(true);

    const productRules = consumableRulesService.getRulesForProduct("prod-sandal-01", {
      organizationId: orgA,
      workspaceId: wsA,
    });
    expect(productRules.length).toBe(2);

    const skuRules = consumableRulesService.getRulesForSku("SKU-NOVA-SAND-PNK", {
      organizationId: orgA,
      workspaceId: wsA,
    });
    expect(skuRules.length).toBe(2);
  });

  it("validates rule quantities and rejects zero, negative, or invalid numbers", () => {
    expect(() =>
      consumableRulesService.createRule({
        productId: "prod-1",
        productSku: "SKU-TEST",
        consumableSku: "SKU-BOX-S",
        quantity: 0,
      })
    ).toThrowError(ConsumableRuleError);

    expect(() =>
      consumableRulesService.createRule({
        productId: "prod-1",
        productSku: "SKU-TEST",
        consumableSku: "SKU-BOX-S",
        quantity: -2.5,
      })
    ).toThrowError(ConsumableRuleError);
  });

  it("rejects duplicate active rules for the same consumable + variant + mode", () => {
    consumableRulesService.createRule({
      organizationId: orgA,
      workspaceId: wsA,
      productId: "prod-1",
      productSku: "SKU-SHOE-01",
      consumableSku: "SKU-BOX-S",
      quantity: 1,
      consumptionMode: "PER_UNIT",
    });

    expect(() =>
      consumableRulesService.createRule({
        organizationId: orgA,
        workspaceId: wsA,
        productId: "prod-1",
        productSku: "SKU-SHOE-01",
        consumableSku: "SKU-BOX-S",
        quantity: 2,
        consumptionMode: "PER_UNIT",
      })
    ).toThrowError(/already exists/i);
  });

  it("calculates PER_UNIT consumption mode (scaled directly with order quantity)", () => {
    consumableRulesService.createRule({
      organizationId: orgA,
      workspaceId: wsA,
      productId: "prod-sandal",
      productSku: "SKU-KIDS-SANDAL",
      consumableSku: "SKU-BOX-S",
      consumableName: "Box S",
      quantity: 1,
      unit: "pcs",
      consumptionMode: "PER_UNIT",
    });

    consumableRulesService.createRule({
      organizationId: orgA,
      workspaceId: wsA,
      productId: "prod-sandal",
      productSku: "SKU-KIDS-SANDAL",
      consumableSku: "SKU-TAPE",
      consumableName: "Packing Tape",
      quantity: 0.15,
      unit: "meters",
      consumptionMode: "PER_UNIT",
    });

    const proposals = consumableRulesService.calculateExpectedUsage({
      productSku: "SKU-KIDS-SANDAL",
      orderQuantity: 5,
      tenantScope: { organizationId: orgA, workspaceId: wsA },
    });

    expect(proposals.length).toBe(2);
    const box = proposals.find((p) => p.consumableSku === "SKU-BOX-S");
    expect(box?.calculatedQuantity).toBe(5); // 5 * 1

    const tape = proposals.find((p) => p.consumableSku === "SKU-TAPE");
    expect(tape?.calculatedQuantity).toBe(0.75); // 5 * 0.15
  });

  it("calculates PER_ORDER consumption mode (fixed once per order regardless of item count)", () => {
    consumableRulesService.createRule({
      organizationId: orgA,
      workspaceId: wsA,
      productId: "prod-furniture",
      productSku: "SKU-TABLE-WOOD",
      consumableSku: "SKU-THANKYOU-CARD",
      consumableName: "Thank You Note & Care Guide",
      quantity: 1,
      unit: "pcs",
      consumptionMode: "PER_ORDER",
    });

    const proposals = consumableRulesService.calculateExpectedUsage({
      productSku: "SKU-TABLE-WOOD",
      orderQuantity: 10, // Customer bought 10 tables
      tenantScope: { organizationId: orgA, workspaceId: wsA },
    });

    expect(proposals.length).toBe(1);
    expect(proposals[0].calculatedQuantity).toBe(1); // Exactly 1 per order!
  });

  it("calculates PER_SHIPMENT consumption mode (scaled by parcel count)", () => {
    consumableRulesService.createRule({
      organizationId: orgA,
      workspaceId: wsA,
      productId: "prod-large",
      productSku: "SKU-FURNITURE-CHAIR",
      consumableSku: "SKU-FLYER-BAG",
      consumableName: "Outer Waterproof Bag",
      quantity: 1,
      unit: "pcs",
      consumptionMode: "PER_SHIPMENT",
    });

    const singleShipment = consumableRulesService.calculateExpectedUsage({
      productSku: "SKU-FURNITURE-CHAIR",
      orderQuantity: 6,
      shipmentCount: 1,
      tenantScope: { organizationId: orgA, workspaceId: wsA },
    });
    expect(singleShipment[0].calculatedQuantity).toBe(1);

    const splitShipment = consumableRulesService.calculateExpectedUsage({
      productSku: "SKU-FURNITURE-CHAIR",
      orderQuantity: 6,
      shipmentCount: 3, // Split into 3 separate parcel boxes
      tenantScope: { organizationId: orgA, workspaceId: wsA },
    });
    expect(splitShipment[0].calculatedQuantity).toBe(3);
  });

  it("applies variant-specific override over master default rule", () => {
    // 1. Master default: Box Small
    consumableRulesService.createRule({
      organizationId: orgA,
      workspaceId: wsA,
      productId: "prod-shoe",
      productSku: "SKU-NOVA-RUNNER",
      consumableSku: "SKU-BOX-S",
      consumableName: "Courier Box Small",
      quantity: 1,
      consumptionMode: "PER_UNIT",
    });

    // 2. Variant override for XL size: Box Large
    consumableRulesService.createRule({
      organizationId: orgA,
      workspaceId: wsA,
      productId: "prod-shoe",
      productSku: "SKU-NOVA-RUNNER",
      variantSku: "SKU-NOVA-RUNNER-XL",
      consumableSku: "SKU-BOX-L",
      consumableName: "Courier Box Large XL",
      quantity: 1,
      consumptionMode: "PER_UNIT",
    });

    // Case A: Standard size order (no variant specified) uses master default (Box Small)
    const stdProposals = consumableRulesService.calculateExpectedUsage({
      productSku: "SKU-NOVA-RUNNER",
      orderQuantity: 2,
      tenantScope: { organizationId: orgA, workspaceId: wsA },
    });
    expect(stdProposals.length).toBe(1);
    expect(stdProposals[0].consumableSku).toBe("SKU-BOX-S");
    expect(stdProposals[0].calculatedQuantity).toBe(2);
    expect(stdProposals[0].variantOverride).toBe(false);

    // Case B: XL size order specifies variantSku -> triggers override (Box Large)
    const xlProposals = consumableRulesService.calculateExpectedUsage({
      productSku: "SKU-NOVA-RUNNER",
      variantSku: "SKU-NOVA-RUNNER-XL",
      orderQuantity: 2,
      tenantScope: { organizationId: orgA, workspaceId: wsA },
    });
    expect(xlProposals.length).toBe(1);
    expect(xlProposals[0].consumableSku).toBe("SKU-BOX-L");
    expect(xlProposals[0].calculatedQuantity).toBe(2);
    expect(xlProposals[0].variantOverride).toBe(true);
  });

  it("strictly enforces multi-tenant boundaries", () => {
    consumableRulesService.createRule({
      organizationId: orgA,
      workspaceId: wsA,
      productId: "prod-1",
      productSku: "SKU-ALPHA-SHOE",
      consumableSku: "SKU-BOX-S",
      quantity: 1,
    });

    consumableRulesService.createRule({
      organizationId: orgB,
      workspaceId: wsB,
      productId: "prod-2",
      productSku: "SKU-BETA-SHOE",
      consumableSku: "SKU-BOX-M",
      quantity: 1,
    });

    // Tenant Alpha only sees Alpha rules
    const alphaRules = consumableRulesService.getRulesForProduct("prod-1", {
      organizationId: orgA,
      workspaceId: wsA,
    });
    expect(alphaRules.length).toBe(1);
    expect(alphaRules[0].productSku).toBe("SKU-ALPHA-SHOE");

    // Tenant Alpha cannot see Beta rules
    const crossCheck = consumableRulesService.getRulesForProduct("prod-2", {
      organizationId: orgA,
      workspaceId: wsA,
    });
    expect(crossCheck.length).toBe(0);
  });

  it("guarantees that saving product consumable rules does NOT mutate physical inventory stock", () => {
    const beforeBalances = locationStockRepository.getAllBalances();
    const boxStockBefore = beforeBalances.find((b) => b.sku === "SKU-BOX-S")?.availableQty;
    expect(boxStockBefore).toBe(100);

    // Create 3 packaging rules
    consumableRulesService.createRule({
      productId: "prod-test",
      productSku: "SKU-TEST-01",
      consumableSku: "SKU-BOX-S",
      quantity: 10,
    });

    consumableRulesService.createRule({
      productId: "prod-test",
      productSku: "SKU-TEST-01",
      consumableSku: "SKU-POLY-M",
      quantity: 20,
    });

    // Verify physical inventory is still exactly 100
    const afterBalances = locationStockRepository.getAllBalances();
    const boxStockAfter = afterBalances.find((b) => b.sku === "SKU-BOX-S")?.availableQty;
    expect(boxStockAfter).toBe(100); // 100% UNTOUCHED

    // Verify usage ledger has 0 consumption events
    const ledgerHistory = inventoryConsumptionLedger.getLedgerHistory();
    expect(ledgerHistory.totalCount).toBe(0);
  });
});

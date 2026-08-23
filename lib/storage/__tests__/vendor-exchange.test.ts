import { describe, it, expect, beforeEach } from "vitest";
import { vendorExchangeEngine } from "../engine/vendor-exchange.engine";
import { locationStockRepository } from "../engine/receiving.engine";
import type { SecurityContext } from "../domain/types";

const mockSecurity: SecurityContext = {
  tenantId: "tenant-test",
  organizationId: "org-test",
  workspaceId: "ws-test",
  actorId: "usr-tester",
  actorName: "Test Officer",
};

describe("Damaged Stock Lifecycle + Vendor Exchange Engine", () => {
  beforeEach(() => {
    // Clear storage keys if test env
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  it("TEST 1: Creates Vendor Exchange with valid quantity validation", () => {
    const res = vendorExchangeEngine.createExchange({
      billId: "BILL-2001",
      billNumber: "BILL-2001",
      lineId: "line-sku-alpha",
      sku: "SKU-ALPHA-1",
      productName: "Alpha Widget",
      storageLocationId: "LOC-TEST-1",
      storageLocationName: "Main Test Warehouse",
      originalReceivedQty: 50,
      originalDamagedQty: 3,
      exchangeQty: 3,
      reason: "Damaged / Broken during transit from vendor",
      securityContext: mockSecurity,
    });

    expect(res.success).toBe(true);
    expect(res.exchange).toBeDefined();
    expect(res.exchange?.status).toBe("awaiting_replacement");
    expect(res.exchange?.unresolvedQty).toBe(3);
    expect(res.exchange?.exchangeQty).toBe(3);
  });

  it("TEST 2: Rejects exchange quantity greater than damaged units", () => {
    const res = vendorExchangeEngine.createExchange({
      billId: "BILL-2002",
      billNumber: "BILL-2002",
      lineId: "line-sku-beta",
      sku: "SKU-BETA-2",
      productName: "Beta Widget",
      originalReceivedQty: 50,
      originalDamagedQty: 3,
      exchangeQty: 4, // Invalid: exceeds 3
      reason: "Damaged during transit",
      securityContext: mockSecurity,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("cannot exceed total damaged units");
  });

  it("TEST 3: Full Replacement: 3 requested -> 3 received & accepted -> available increases by 3, exchange resolved", () => {
    const created = vendorExchangeEngine.createExchange({
      billId: "BILL-2003",
      billNumber: "BILL-2003",
      lineId: "line-sku-gamma",
      sku: "SKU-GAMMA-3",
      productName: "Gamma Widget",
      storageLocationId: "LOC-TEST-1",
      storageLocationName: "Main Test Warehouse",
      originalReceivedQty: 50,
      originalDamagedQty: 3,
      exchangeQty: 3,
      reason: "Broken glass",
      securityContext: mockSecurity,
    });

    expect(created.success).toBe(true);
    const exchangeId = created.exchange!.id;

    // Receive full 3 replacement units with 100% QC pass
    const recvRes = vendorExchangeEngine.receiveReplacement({
      exchangeId,
      receivedQty: 3,
      acceptedQty: 3,
      damagedQty: 0,
      storageLocationId: "LOC-TEST-1",
      storageLocationName: "Main Test Warehouse",
      securityContext: mockSecurity,
    });

    expect(recvRes.success).toBe(true);
    expect(recvRes.acceptedAddedToAvailable).toBe(3);
    expect(recvRes.remainingUnresolvedDamaged).toBe(0);
    expect(recvRes.exchange?.status).toBe("resolved");
  });

  it("TEST 4: Partial Replacement: 3 requested -> 2 received & accepted -> available increases by 2, 1 remains outstanding", () => {
    const created = vendorExchangeEngine.createExchange({
      billId: "BILL-2004",
      billNumber: "BILL-2004",
      lineId: "line-sku-delta",
      sku: "SKU-DELTA-4",
      productName: "Delta Widget",
      storageLocationId: "LOC-TEST-1",
      originalReceivedQty: 50,
      originalDamagedQty: 3,
      exchangeQty: 3,
      reason: "Defective packaging",
      securityContext: mockSecurity,
    });

    const exchangeId = created.exchange!.id;

    // Vendor only sent 2 units initially
    const recvRes = vendorExchangeEngine.receiveReplacement({
      exchangeId,
      receivedQty: 2,
      acceptedQty: 2,
      damagedQty: 0,
      storageLocationId: "LOC-TEST-1",
      securityContext: mockSecurity,
    });

    expect(recvRes.success).toBe(true);
    expect(recvRes.acceptedAddedToAvailable).toBe(2);
    expect(recvRes.remainingUnresolvedDamaged).toBe(1);
    expect(recvRes.exchange?.status).toBe("awaiting_replacement");
  });

  it("TEST 5: Replacement QC Defect: 3 requested -> 3 received -> QC finds 2 Good + 1 Damaged -> available increases by 2 only, 1 remains unresolved", () => {
    const created = vendorExchangeEngine.createExchange({
      billId: "BILL-2005",
      billNumber: "BILL-2005",
      lineId: "line-sku-epsilon",
      sku: "SKU-EPSILON-5",
      productName: "Epsilon Widget",
      storageLocationId: "LOC-TEST-1",
      originalReceivedQty: 50,
      originalDamagedQty: 3,
      exchangeQty: 3,
      reason: "Defective batch",
      securityContext: mockSecurity,
    });

    const exchangeId = created.exchange!.id;

    // 3 units arrived, but QC rejects 1 unit as defective again
    const recvRes = vendorExchangeEngine.receiveReplacement({
      exchangeId,
      receivedQty: 3,
      acceptedQty: 2,
      damagedQty: 1,
      storageLocationId: "LOC-TEST-1",
      securityContext: mockSecurity,
    });

    expect(recvRes.success).toBe(true);
    expect(recvRes.acceptedAddedToAvailable).toBe(2);
    expect(recvRes.remainingUnresolvedDamaged).toBe(1);
    expect(recvRes.exchange?.status).toBe("awaiting_replacement");
    expect(recvRes.exchange?.replacementDamagedQty).toBe(1);
  });

  it("TEST 6: Rejects duplicate replacements once exchange is resolved", () => {
    const created = vendorExchangeEngine.createExchange({
      billId: "BILL-2006",
      billNumber: "BILL-2006",
      lineId: "line-sku-zeta",
      sku: "SKU-ZETA-6",
      productName: "Zeta Widget",
      storageLocationId: "LOC-TEST-1",
      originalReceivedQty: 20,
      originalDamagedQty: 2,
      exchangeQty: 2,
      reason: "Defective",
      securityContext: mockSecurity,
    });

    const exchangeId = created.exchange!.id;

    vendorExchangeEngine.receiveReplacement({
      exchangeId,
      receivedQty: 2,
      acceptedQty: 2,
      damagedQty: 0,
      storageLocationId: "LOC-TEST-1",
      securityContext: mockSecurity,
    });

    // Attempt duplicate receive
    const dupRes = vendorExchangeEngine.receiveReplacement({
      exchangeId,
      receivedQty: 1,
      acceptedQty: 1,
      damagedQty: 0,
      storageLocationId: "LOC-TEST-1",
      securityContext: mockSecurity,
    });

    expect(dupRes.success).toBe(false);
    expect(dupRes.error).toContain("already fully resolved");
  });

  it("TEST 7: Non-Returnable Vendor policy blocks Exchange unless authorized override is applied", () => {
    // 1. Without override: BLOCKED
    const blockedRes = vendorExchangeEngine.createExchange({
      billId: "BILL-2007",
      billNumber: "BILL-2007",
      lineId: "line-sku-eta",
      sku: "SKU-ETA-7",
      productName: "Eta Widget",
      vendorId: "VEN-NONRET-1",
      vendorName: "Strict Non-Return Vendor",
      vendorPolicy: "NON_RETURNABLE",
      isAuthorizedOverride: false,
      originalReceivedQty: 10,
      originalDamagedQty: 2,
      exchangeQty: 2,
      reason: "Defective seal",
      securityContext: mockSecurity,
    });

    expect(blockedRes.success).toBe(false);
    expect(blockedRes.error).toContain("Non-Returnable");

    // 2. With override: PERMITTED
    const overrideRes = vendorExchangeEngine.createExchange({
      billId: "BILL-2007",
      billNumber: "BILL-2007",
      lineId: "line-sku-eta",
      sku: "SKU-ETA-7",
      productName: "Eta Widget",
      vendorId: "VEN-NONRET-1",
      vendorName: "Strict Non-Return Vendor",
      vendorPolicy: "NON_RETURNABLE",
      isAuthorizedOverride: true,
      originalReceivedQty: 10,
      originalDamagedQty: 2,
      exchangeQty: 2,
      reason: "Defective seal",
      securityContext: mockSecurity,
    });

    expect(overrideRes.success).toBe(true);
    expect(overrideRes.exchange?.disposition).toBe("vendor_exchange");
  });

  it("TEST 8: Scrap / Destroy permanently writes off damaged units and generates Finance write-off record", () => {
    const scrapRes = vendorExchangeEngine.scrapDamagedStock({
      billId: "BILL-2008",
      billNumber: "BILL-2008",
      lineId: "line-sku-theta",
      sku: "SKU-THETA-8",
      productName: "Theta Widget",
      vendorId: "VEN-THETA",
      vendorName: "Theta Supplier",
      storageLocationId: "LOC-TEST-1",
      originalDamagedQty: 4,
      scrapQty: 4,
      unitCost: 750,
      damageReason: "Manufacturing physical defect (QC Fail)",
      disposalReason: "Unsalvageable internal breakage",
      disposalMethod: "Incineration / Destruction",
      securityContext: mockSecurity,
    });

    expect(scrapRes.success).toBe(true);
    expect(scrapRes.record).toBeDefined();
    expect(scrapRes.record?.scrappedQty).toBe(4);
    expect(scrapRes.record?.totalWriteOffAmount).toBe(3000); // 4 * 750
    expect(scrapRes.record?.financeStatus).toBe("posted_write_off");
    expect(scrapRes.record?.financeEventId).toContain("fin-wo-");

    // Attempt to scrap beyond remaining damaged units
    const dupScrapRes = vendorExchangeEngine.scrapDamagedStock({
      billId: "BILL-2008",
      billNumber: "BILL-2008",
      lineId: "line-sku-theta",
      sku: "SKU-THETA-8",
      productName: "Theta Widget",
      originalDamagedQty: 4,
      scrapQty: 1,
      damageReason: "Further damage",
      disposalReason: "Scrap",
      securityContext: mockSecurity,
    });

    expect(dupScrapRes.success).toBe(false);
    expect(dupScrapRes.error).toContain("Only 0 damaged units remaining");
  });

  it("TEST 9: Remaining unclaimed damaged units calculation tracks mixed Exchanges and Scraps", () => {
    const lineId = "line-sku-iota";
    const originalDamaged = 5;

    // 1. Initiate exchange for 2 units
    vendorExchangeEngine.createExchange({
      billId: "BILL-2009",
      billNumber: "BILL-2009",
      lineId,
      sku: "SKU-IOTA-9",
      productName: "Iota Widget",
      originalReceivedQty: 20,
      originalDamagedQty: originalDamaged,
      exchangeQty: 2,
      reason: "Broken glass",
      securityContext: mockSecurity,
    });

    // 2. Scrap 2 units
    vendorExchangeEngine.scrapDamagedStock({
      billId: "BILL-2009",
      billNumber: "BILL-2009",
      lineId,
      sku: "SKU-IOTA-9",
      productName: "Iota Widget",
      originalDamagedQty: originalDamaged,
      scrapQty: 2,
      damageReason: "Water damage",
      disposalReason: "Biohazard Disposal",
      securityContext: mockSecurity,
    });

    // 3. Inspect balance: 1 unresolved remaining
    const balance = vendorExchangeEngine.getUnresolvedDamagedQuantity(lineId, originalDamaged);
    expect(balance.totalDamaged).toBe(5);
    expect(balance.activeExchangeQty).toBe(2);
    expect(balance.scrappedQty).toBe(2);
    expect(balance.unresolvedRemaining).toBe(1);
  });
});

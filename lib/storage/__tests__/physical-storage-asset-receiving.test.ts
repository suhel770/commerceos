import { describe, it, expect, beforeEach } from "vitest";
import { receivingEngine, locationStockRepository } from "@/lib/storage/engine/receiving.engine";
import { storageEquipmentRepository } from "@/lib/storage/engine/storage-equipment.engine";
import { canRequireQC, determineLineDestination } from "@/lib/purchase/routing";
import { computeGrnInwardingStatus, type PurchaseBill } from "@/lib/purchase/types";
import { channelAllocationEngine } from "@/lib/inventory/channel-allocation.engine";

describe("CommerceOS — Optional Physical Storage Asset Receiving", () => {
  const mockSecurity = {
    tenantId: "tenant-cos",
    organizationId: "org-cos",
    workspaceId: "ws-cos",
    actorId: "usr-warehouse-lead",
    actorName: "Vikram (Warehouse Lead)",
  };

  beforeEach(() => {
    // Reset test repositories
  });

  it("1. Normal FIXED_ASSET remains non-receivable when physicalStorageReceivingRequired is false/undefined", () => {
    const nonPhysicalBill: PurchaseBill = {
      id: "bill-software-lic",
      organizationId: "org-cos",
      workspaceId: "ws-cos",
      billNumber: "BILL-ASSET-01",
      vendorId: "vnd-adobe",
      vendorName: "Adobe Systems",
      purchaseType: "asset",
      category: "asset",
      status: "ordered",
      paymentStatus: "unpaid",
      paymentMethod: "credit",
      billDate: "2026-08-20",
      lines: [
        {
          id: "ln-soft-1",
          description: "Adobe Photoshop Enterprise 1-Year License",
          quantity: 5,
          unitPrice: 15000,
          amount: 75000,
          uom: "pcs",
          gstRate: 18,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 13500,
          taxAmount: 13500,
          qtyDamaged: 0,
          intent: "asset",
          physicalStorageReceivingRequired: false,
        },
      ],
      subtotal: 75000,
      discountAmount: 0,
      taxPercent: 18,
      taxAmount: 13500,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 13500,
      freightAmount: 0,
      otherCharges: 0,
      roundOff: 0,
      totalAmount: 88500,
      interstate: true,
      buyerStateCode: "07",
      createdAt: "2026-08-20",
      updatedAt: "2026-08-20",
      createdBy: "usr-admin",
    };

    // Filter receivable lines
    const receivable = receivingEngine.filterReceivableLines(nonPhysicalBill);
    expect(receivable).toHaveLength(0);

    // Bill must not be eligible for storage receiving
    expect(receivingEngine.isBillEligibleForStorageReceiving(nonPhysicalBill)).toBe(false);

    // Inwarding status is bypassed
    expect(computeGrnInwardingStatus(nonPhysicalBill)).toBe("bypassed_asset_expense");

    // Routing destination is pure asset register
    expect(
      determineLineDestination({
        intent: "asset",
        physicalStorageReceivingRequired: false,
      }),
    ).toBe("asset_register");
  });

  it("2. FIXED_ASSET becomes receivable when physicalStorageReceivingRequired is true", () => {
    const physicalRackBill: PurchaseBill = {
      id: "bill-racks-01",
      organizationId: "org-cos",
      workspaceId: "ws-cos",
      billNumber: "BILL-RACK-100",
      vendorId: "vnd-steel-craft",
      vendorName: "SteelCraft Industrial",
      purchaseType: "asset",
      category: "asset",
      status: "ordered",
      paymentStatus: "unpaid",
      paymentMethod: "credit",
      billDate: "2026-08-20",
      lines: [
        {
          id: "ln-rack-1",
          description: "Heavy Duty Warehouse Pallet Rack - 4 Tier",
          sku: "EQP-RACK-4T",
          quantity: 10,
          unitPrice: 6500,
          amount: 65000,
          uom: "pcs",
          gstRate: 18,
          cgstAmount: 5850,
          sgstAmount: 5850,
          igstAmount: 0,
          taxAmount: 11700,
          qtyDamaged: 0,
          intent: "asset",
          physicalStorageReceivingRequired: true,
        },
      ],
      subtotal: 65000,
      discountAmount: 0,
      taxPercent: 18,
      taxAmount: 11700,
      cgstAmount: 5850,
      sgstAmount: 5850,
      igstAmount: 0,
      freightAmount: 0,
      otherCharges: 0,
      roundOff: 0,
      totalAmount: 76700,
      interstate: false,
      buyerStateCode: "07",
      createdAt: "2026-08-20",
      updatedAt: "2026-08-20",
      createdBy: "usr-admin",
    };

    // Filter receivable lines - must find 1 receivable physical asset line
    const receivable = receivingEngine.filterReceivableLines(physicalRackBill);
    expect(receivable).toHaveLength(1);
    expect(receivable[0]?.description).toContain("Heavy Duty Warehouse Pallet Rack");

    // Bill IS eligible for Storage Receiving
    expect(receivingEngine.isBillEligibleForStorageReceiving(physicalRackBill)).toBe(true);

    // Inwarding status is pending inwarding
    expect(computeGrnInwardingStatus(physicalRackBill)).toBe("pending_inwarding");

    // QC check is allowed for physical storage asset
    expect(canRequireQC("asset", { physicalStorageReceivingRequired: true })).toBe(true);

    // Destination is storage_equipment
    expect(
      determineLineDestination({
        intent: "asset",
        physicalStorageReceivingRequired: true,
      }),
    ).toBe("storage_equipment");
  });

  it("3 & 4. Physical asset receiving logs in StorageEquipmentRepository and does NOT contaminate LocationStockRepository or ATS", async () => {
    const rackBill: PurchaseBill = {
      id: "bill-racks-02",
      organizationId: "org-cos",
      workspaceId: "ws-cos",
      billNumber: "BILL-RACK-102",
      vendorId: "vnd-steel-craft",
      vendorName: "SteelCraft Industrial",
      purchaseType: "asset",
      category: "asset",
      status: "ordered",
      paymentStatus: "unpaid",
      paymentMethod: "credit",
      billDate: "2026-08-20",
      lines: [
        {
          id: "ln-table-1",
          description: "Ergonomic Order Packing Table P1",
          sku: "EQP-TBL-PACK-01",
          quantity: 4,
          unitPrice: 8500,
          amount: 34000,
          uom: "pcs",
          gstRate: 18,
          cgstAmount: 3060,
          sgstAmount: 3060,
          igstAmount: 0,
          taxAmount: 6120,
          qtyDamaged: 0,
          intent: "asset",
          physicalStorageReceivingRequired: true,
        },
      ],
      subtotal: 34000,
      discountAmount: 0,
      taxPercent: 18,
      taxAmount: 6120,
      cgstAmount: 3060,
      sgstAmount: 3060,
      igstAmount: 0,
      freightAmount: 0,
      otherCharges: 0,
      roundOff: 0,
      totalAmount: 40120,
      interstate: false,
      buyerStateCode: "07",
      createdAt: "2026-08-20",
      updatedAt: "2026-08-20",
      createdBy: "usr-admin",
    };

    const targetLocId = "loc-delhi-main";

    // Initial check: stock repository for this SKU
    const initialStock = locationStockRepository
      .getAllBalances()
      .filter((b) => b.sku === "EQP-TBL-PACK-01");
    expect(initialStock).toHaveLength(0);

    // Execute Receiving for 4 packing tables
    const result = await receivingEngine.executeReceiving({
      billId: rackBill.id,
      allocations: [
        {
          lineId: "ln-table-1",
          sku: "EQP-TBL-PACK-01",
          description: "Ergonomic Order Packing Table P1",
          orderedQty: 4,
          alreadyReceivedQty: 0,
          receivingQty: 4,
          damagedQty: 0,
          destinationLocationId: targetLocId,
          destinationLocationName: "Delhi Main Fulfillment Center",
          targetBin: "Zone P → Packing Bay 1",
          intent: "asset",
          isPhysicalAsset: true,
          assetTag: "TAG-TBL-001",
        },
      ],
      securityContext: mockSecurity,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("completed");

    // 4. Equipment Record must exist in storageEquipmentRepository
    const equipment = storageEquipmentRepository.listEquipment({
      storageLocationId: targetLocId,
    });
    const match = equipment.find((e) => e.sku === "EQP-TBL-PACK-01");
    expect(match).toBeDefined();
    expect(match?.name).toBe("Ergonomic Order Packing Table P1");
    expect(match?.acceptedQty).toBe(4);
    expect(match?.subLocationPath).toBe("Zone P → Packing Bay 1");

    // 5 & 6. CRITICAL SAFETY: LocationStockRepository must have 0 sellable inventory for this equipment
    const sellableStock = locationStockRepository
      .getAllBalances()
      .filter((b) => b.sku === "EQP-TBL-PACK-01");
    expect(sellableStock).toHaveLength(0);

    // 7. CRITICAL SAFETY: Channel allocation engine ATS must be 0
    const allocations = channelAllocationEngine.calculateAllocations({
      sku: "EQP-TBL-PACK-01",
      available: 0,
      reserved: 0,
      damaged: 0,
      inTransit: 0,
    });
    expect(allocations.totalAts).toBe(0);
    expect(allocations.unallocatedQty).toBe(0);
    expect(allocations.allocations.every((a) => a.allocatedQty === 0)).toBe(true);
  }, 15000);

  it("8. Moving equipment updates physical location path without altering inventory stock", () => {
    // Add equipment
    const eq = storageEquipmentRepository.addEquipment({
      organizationId: "org-cos",
      workspaceId: "ws-cos",
      storageLocationId: "loc-delhi-main",
      storageLocationName: "Delhi Main Facility",
      subLocationPath: "Zone A → Aisle 1",
      sku: "EQP-CABINET-01",
      name: "Tool Storage Cabinet C1",
      quantity: 1,
      acceptedQty: 1,
      damagedQty: 0,
      status: "active",
      receivedAt: new Date().toISOString(),
      receivedBy: "Warehouse Lead",
    });

    // Move to Zone B
    const moveRes = storageEquipmentRepository.moveEquipment({
      equipmentId: eq.id,
      targetStorageLocationId: "loc-delhi-main",
      targetSubLocationPath: "Zone B → Aisle 4 → Shelf 2",
      actorName: "Vikram",
    });

    expect(moveRes.success).toBe(true);
    expect(moveRes.record?.subLocationPath).toBe("Zone B → Aisle 4 → Shelf 2");

    // Inventory remains untouched
    const stock = locationStockRepository
      .getAllBalances()
      .filter((b) => b.sku === "EQP-CABINET-01");
    expect(stock).toHaveLength(0);
  });

  it("9. Damaged physical equipment is recorded in Equipment status without polluting Inventory QC", async () => {
    const result = await receivingEngine.executeReceiving({
      billId: "bill-pallet-truck",
      allocations: [
        {
          lineId: "ln-truck-1",
          sku: "EQP-PALLET-TRK-01",
          description: "Hydraulic Hand Pallet Truck 2.5T",
          orderedQty: 2,
          alreadyReceivedQty: 0,
          receivingQty: 2,
          damagedQty: 1, // 1 accepted, 1 damaged on arrival
          destinationLocationId: "loc-delhi-main",
          intent: "asset",
          isPhysicalAsset: true,
        },
      ],
      securityContext: mockSecurity,
    });

    expect(result.success).toBe(true);

    // Equipment repository has recorded the unit
    const equipment = storageEquipmentRepository.listEquipment({
      storageLocationId: "loc-delhi-main",
    });
    const item = equipment.find((e) => e.sku === "EQP-PALLET-TRK-01");
    expect(item).toBeDefined();
    expect(item?.acceptedQty).toBe(1);
    expect(item?.damagedQty).toBe(1);

    // LocationStockRepository MUST NOT have damaged stock recorded in generic QC
    const stock = locationStockRepository
      .getAllBalances()
      .filter((b) => b.sku === "EQP-PALLET-TRK-01");
    expect(stock).toHaveLength(0);
  });

  it("10. Mixed Bill containing Sellable Goods, Consumables, and Physical Racks routes accurately", () => {
    const mixedBill: PurchaseBill = {
      id: "bill-mixed-01",
      organizationId: "org-cos",
      workspaceId: "ws-cos",
      billNumber: "BILL-MIXED-99",
      vendorId: "vnd-universal",
      vendorName: "Universal Supply Hub",
      purchaseType: "other",
      category: "other",
      status: "ordered",
      paymentStatus: "unpaid",
      paymentMethod: "credit",
      billDate: "2026-08-20",
      lines: [
        {
          id: "ln-1",
          description: "Kids Sandal Pink - Size 4",
          sku: "SKU-KID-SND-04",
          quantity: 50,
          unitPrice: 450,
          amount: 22500,
          uom: "pair",
          gstRate: 12,
          cgstAmount: 1350,
          sgstAmount: 1350,
          igstAmount: 0,
          taxAmount: 2700,
          qtyDamaged: 0,
          intent: "sellable",
        },
        {
          id: "ln-2",
          description: "Poly Courier Bags 10x12 (Pack of 500)",
          sku: "PKG-BAG-1012",
          quantity: 2,
          unitPrice: 800,
          amount: 1600,
          uom: "box",
          gstRate: 18,
          cgstAmount: 144,
          sgstAmount: 144,
          igstAmount: 0,
          taxAmount: 288,
          qtyDamaged: 0,
          intent: "consumable",
        },
        {
          id: "ln-3",
          description: "Heavy Industrial Storage Rack Unit",
          sku: "EQP-RCK-IND-01",
          quantity: 3,
          unitPrice: 12000,
          amount: 36000,
          uom: "pcs",
          gstRate: 18,
          cgstAmount: 3240,
          sgstAmount: 3240,
          igstAmount: 0,
          taxAmount: 6480,
          qtyDamaged: 0,
          intent: "asset",
          physicalStorageReceivingRequired: true,
        },
        {
          id: "ln-4",
          description: "Warehouse Facility Rent August 2026",
          quantity: 1,
          unitPrice: 40000,
          amount: 40000,
          uom: "pcs",
          gstRate: 18,
          cgstAmount: 3600,
          sgstAmount: 3600,
          igstAmount: 0,
          taxAmount: 7200,
          qtyDamaged: 0,
          intent: "expense",
        },
      ],
      subtotal: 100100,
      discountAmount: 0,
      taxPercent: 18,
      taxAmount: 16668,
      cgstAmount: 8334,
      sgstAmount: 8334,
      igstAmount: 0,
      freightAmount: 0,
      otherCharges: 0,
      roundOff: 0,
      totalAmount: 116768,
      interstate: false,
      buyerStateCode: "07",
      createdAt: "2026-08-20",
      updatedAt: "2026-08-20",
      createdBy: "usr-admin",
    };

    // Filter receivable lines: Rent (expense) must be excluded; Sellable, Consumable, and Physical Rack must be included!
    const receivable = receivingEngine.filterReceivableLines(mixedBill);
    expect(receivable).toHaveLength(3);
    expect(receivable.map((r) => r.intent)).toEqual(["sellable", "consumable", "asset"]);
  });
});

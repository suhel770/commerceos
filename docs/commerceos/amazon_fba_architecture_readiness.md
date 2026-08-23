# CommerceOS — Amazon FBA Architecture Readiness Audit Report

**Date:** August 19, 2026  
**Document Status:** FROZEN / APPROVED READINESS AUDIT  
**Integration Status:** ARCHITECTURE-READY (Amazon Selling Partner SP-API NOT Connected Yet)  

---

## 1. Executive Summary

CommerceOS has completed an architectural audit and readiness pass for **Amazon FBA (Fulfillment by Amazon)**. The system isolates **Internal Physical Storage Facilities** from **External Fulfillment Nodes (Amazon FBA / 3PL)** without changing the core business flows, without fabricating fake inventory numbers, and without making real SP-API network calls.

```
+------------------------------------------------------------------------------------------------+
|                                    COMMERCEOS STORAGE NETWORK                                   |
+------------------------------------+-----------------------------------------------------------+
| INTERNAL PHYSICAL STORAGE          | EXTERNAL FULFILLMENT NODES                                |
| (Home Storage, Main Warehouse)     | (Amazon FBA, 3PL Networks)                                |
+------------------------------------+-----------------------------------------------------------+
| • Scope: INTERNAL                  | • Scope: EXTERNAL_FULFILLMENT                             |
| • Type: home_storage / warehouse   | • Provider: AMAZON_FBA                                    |
| • Direct Purchase Receiving: YES   | • Direct Purchase Receiving: DISABLED                     |
| • GRN Generation: YES              | • Internal Manual Adjustment: DISABLED                    |
| • Cycle Count / Move Bins: YES     | • Stock Quantity Source: SP-API FBA Inventory (Pending)   |
| • Current Status: Active (Primary) | • Current Status: NOT_CONNECTED / NOT_SYNCED              |
+------------------------------------+-----------------------------------------------------------+
```

---

## 2. Architecture & Data Model Audit

### 2.1 Existing Storage & Warehouse Architecture
- **`StorageLocation` Model (`prisma/schema.prisma`):**
  - Stores location metadata, scope, hierarchical sub-locations (racks/bins), capabilities, and marketplace connection configurations.
  - Supports `type = "amazon_fba"` alongside physical storage types (`home_storage`, `warehouse`, `factory`).
- **`StorageStock` & `Inventory` Models:**
  - `StorageStock` isolates stock by `storageLocationId` and `sku`.
  - External fulfillment stock does **NOT** blend or corrupt internal sellable balances.
  - No fake stock is generated or hardcoded for Amazon FBA. When not connected via SP-API, UI explicitly renders **`Not Synced`** for fulfillable quantities and SKU counts.

### 2.2 Master Listing & Amazon Marketplace Mapping Readiness
The existing listing architecture in CommerceOS (`prisma/schema.prisma`) already maps the enterprise product hierarchy into marketplace-specific attributes:

```
CommerceOS Master Product (SKU, HSN, Brand, Barcode)
                      ↓
MasterListing (Title, Description, Bullets, Attributes)
                      ↓
MarketplaceListing (Channel: AMAZON, MarketplaceSku: Seller SKU, ExternalListingId: ASIN)
                      ↓
MarketplaceAttributeMapping (FNSKU, Condition, Package Dimensions, FulfillmentCenterId)
```

- **`Product.sku`** $\rightarrow$ Internal Master SKU
- **`MarketplaceListing.marketplaceSku`** $\rightarrow$ Amazon Seller SKU / MSKU
- **`MarketplaceListing.externalListingId`** $\rightarrow$ Amazon Standard Identification Number (ASIN)
- **`MarketplaceAttributeMapping`** $\rightarrow$ Capable of storing fulfillment-specific tokens such as **FNSKU**, **Merchant Shipping Group**, and **Prep Guidance** without schema modifications.

---

## 3. Storage Scope Separation & Protected Actions

### 3.1 Domain Separation Predicates (`lib/storage/domain/types.ts`)
```typescript
export function isInternalLocationType(type: StorageLocationType): boolean {
  return (
    type === "home_storage" ||
    type === "warehouse" ||
    type === "factory" ||
    type === "retail_store" ||
    type === "returns_area" ||
    type === "temporary_storage" ||
    type === "custom"
  );
}

export function isExternalFulfillmentType(type: StorageLocationType): boolean {
  return (
    type === "amazon_fba" ||
    type === "flipkart_fulfillment" ||
    type === "3pl" ||
    type === "transit"
  );
}
```

### 3.2 Operation Protection Rules
1. **Direct Purchase Bill Receiving:**
   - **Internal Facilities:** Fully supported with Goods Received Note (GRN) generation and atomic `StorageStock` $\rightarrow$ `Inventory` synchronization.
   - **Amazon FBA:** Blocked. Inwarding purchase bills directly into Amazon FBA is disallowed because FBA inventory is governed by Amazon's physical inbound receiving centers.
2. **Manual Inventory Adjustments & GRN Reversals:**
   - Internal locations allow cycle counts, damage recording, and reverse receipt corrections.
   - External fulfillment locations disable internal receiving/adjustment operations and display clear *"External Fulfillment Node / SP-API Pending"* status badges.

---

## 4. Intended Future Amazon FBA Workflow (Design Specification)

```
                       [ PURCHASE & INWARDING ]
                                  ↓
                        Supplier Purchase Bill
                                  ↓
                     Internal Facility Receiving (GRN)
                     (e.g., COS Home: 100 Units)
                                  ↓
                        [ FBA SHIPMENT STAGE ]
                                  ↓
                     Create Inbound Plan / Send-to-Amazon
                     (Deduct 40 Units from COS Home)
                                  ↓
                     Transit / Inbound to Amazon FBA
                     (In-Transit Stock: 40 Units)
                                  ↓
                        [ AMAZON FULFILLMENT ]
                                  ↓
                     Amazon Receiving Center Check-in
                                  ↓
                     Amazon SP-API Reports Sync (FBA Inventory API)
                     (FBA Fulfillable Units: 40 Units)
                                  ↓
                     Amazon Multi-Channel / Prime Orders Fulfillment
```

*Note: The above workflow is documented for future integration. No SP-API endpoints or mock transfer workflows have been fabricated in this phase.*

---

## 5. Summary of Files Modified & Configured

| File | Change Scope |
|---|---|
| [`lib/storage/domain/types.ts`](file:///c:/Users/suhel/OneDrive/commerceos/lib/storage/domain/types.ts) | Scope predicates (`isInternalLocationType`, `isExternalFulfillmentType`, `getStorageLocationScope`) and connection states. |
| [`lib/storage/domain/capabilities.ts`](file:///c:/Users/suhel/OneDrive/commerceos/lib/storage/domain/capabilities.ts) | Capability definitions restricting internal receiving on FBA locations. |
| [`lib/storage/services/storage-location.service.ts`](file:///c:/Users/suhel/OneDrive/commerceos/lib/storage/services/storage-location.service.ts) | Primary default location atomicity and scope validation. |
| [`components/storage/StorageLocationCard.tsx`](file:///c:/Users/suhel/OneDrive/commerceos/components/storage/StorageLocationCard.tsx) | "Not Synced" state for FBA cards, "+ Make Primary" action, and footer layout alignment. |
| [`components/storage/StorageLocationGrid.tsx`](file:///c:/Users/suhel/OneDrive/commerceos/components/storage/StorageLocationGrid.tsx) | Category filtering (All, Internal Physical, External Fulfillment) and drag-and-drop reordering. |
| [`components/storage/workspace/StorageLocationWorkspaceView.tsx`](file:///c:/Users/suhel/OneDrive/commerceos/components/storage/workspace/StorageLocationWorkspaceView.tsx) | External fulfillment notice banner, dynamic capabilities, and settings persistence. |
| [`scripts/set-cos-home-primary.ts`](file:///c:/Users/suhel/OneDrive/commerceos/scripts/set-cos-home-primary.ts) | Database migration script ensuring COS Home (`LOC-0846`) is set to Primary. |

---

## 6. Verification & Build Results

1. **Database Verification:**
   - `COS Home (LOC-0846)` $\rightarrow$ **`isDefault: true (PRIMARY)`**, `locationScope: "internal"`.
   - `FBA (LOC-3940)` $\rightarrow$ **`isDefault: false`**, `locationScope: "external_fulfillment"`, `status: "Not Synced"`.
2. **TypeScript Compilation:**
   - Command: `npx tsc --noEmit`
   - Result: **0 Errors**.
3. **Unit Test Suite:**
   - Command: `npx vitest run lib/storage/__tests__/`
   - Result: **4 test files passed, 23/23 tests green (100%)**.
4. **Full Production Bundle Build:**
   - Command: `npm run build`
   - Result: **Compiled successfully in 67s. 67/67 routes generated without errors**.

---

## 7. Missing Pieces Required Before Actual SP-API Integration (Future Phase)

When actual Amazon integration begins in future phases, the following components will be implemented:
1. **Amazon Selling Partner API (SP-API) LWA (Login with Amazon) OAuth & AWS IAM STS Token Exchange**.
2. **Amazon FBA Inventory API Client (`GET /fba/inventory/v1/summaries`)** for real-time fulfillable/reserved stock synchronization.
3. **Amazon Fulfillment Inbound API Client (v2024-03-20)** for Send-to-Amazon inbound shipment plan generation and carton box label generation.
4. **Amazon SP-API Notifications SQS/Webhook consumer** for real-time order and inventory delta events.

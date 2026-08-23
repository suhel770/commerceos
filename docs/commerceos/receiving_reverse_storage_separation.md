# CommerceOS Engineering Report — Storage Receiving Reversal & Scope Separation

**Date:** 2026-08-19  
**Status:** Completed & Validated  
**Test Suite:** 6 Test Files (32 Tests Passing — 100%)  
**Production Build:** Clean (`npm run build` — 67 static & dynamic routes compiled)

---

## 1. Executive Summary

We have fully engineered, tested, and integrated two core enterprise storage capabilities into CommerceOS:

1. **Controlled Storage Receiving Reversal (`reverseReceipt`)**:
   - Allows users to reverse erroneously received quantities or wrong purchase bills without deleting or purging historical audit trails.
   - Enforces physical availability constraints (`reversibleQty = min(originalReceived, availableStock)`). If items were already consumed, reserved, or transferred, reversal is blocked.
   - Atomically decrements `StorageStock.availableQty` and `Inventory.available` within a single database transaction.
   - Updates `PurchaseBillLine.qcRecord` with reversal audit metadata (`reversedQty`, `lastReversedAt`, `lastReversalReason`).
   - Automatically recalculates parent `PurchaseBill.status` (`"completed"`, `"partially_received"`, or restored to `"ordered"` if all received units are undone).
   - Writes an immutable `StorageOperationLog` record with `operationType: "receiving_reversal"`.

2. **Internal Physical vs External Fulfillment Storage Scope Separation**:
   - Cleanly separates **Internal Physical Facilities** (`home_storage`, `warehouse`, `factory`, `retail_store`, `returns_area`, `temporary_storage`, `custom`) from **External Fulfillment Nodes** (`amazon_fba`, `flipkart_fulfillment`, `3pl`, `transit`).
   - Restricts normal Purchase Bill Inwarding / Inflow only to Internal Physical facilities (preventing accidental direct purchase inwarding into FBA/3PL).
   - Shows clear status badges and filters in the Storage UI (`StorageLocationGrid`, `StorageLocationCard`) without displaying fabricated marketplace stock numbers.

---

## 2. Architectural Changes & Key Components

### 2.1 Domain & Entity Layer
- **`lib/storage/domain/types.ts`**:
  - Defined `StorageLocationScope = "internal" | "external_fulfillment"`.
  - Added helper predicates: `isInternalLocationType(type)`, `isExternalFulfillmentType(type)`, and `getStorageLocationScope(type)`.
  - Added `locationScope?: StorageLocationScope` to `StorageLocationProperties`.
- **`lib/storage/domain/location.entity.ts`**:
  - Implemented `locationScope` getter and constructor calculation via `getStorageLocationScope(props.type)`.

### 2.2 Repository & Database Invariants (`PrismaStorageStockRepository`)
- **`reverseReceipt(security, input)`**:
  - Executes inside `prisma.$transaction()`.
  - Validates security context and tenant isolation.
  - Queries `StorageStock` and verifies that requested `reverseQty <= StorageStock.availableQty`.
  - Atomically decrements `StorageStock.availableQty` and updates `Inventory.available` to maintain exact 1:1 synchronization.
  - Restores the pending quantity on `PurchaseBillLine` by decrementing `receivedQty` and appending reversal audit metadata.
  - Recalculates and updates parent `PurchaseBill.status`.
  - Creates an immutable `StorageOperationLog` entry with reason, actor info, and previous/new stock values.

### 2.3 Storage In-Memory Engine (`LocationStockRepository`)
- **`reverseStock(input)`**:
  - Added `reverseStock()` to `LocationStockRepository` to maintain synchronization in development and unit-test environments.
  - Validates remaining available stock and prevents negative inventory states.

### 2.4 API Route Layer
- **`app/api/v1/storage/receipts/reverse/route.ts`**:
  - `POST /api/v1/storage/receipts/reverse`: Validated endpoint requiring `purchaseBillId`, `reason`, and `lines: [{ sku, reverseQty, storageLocationId }]`.

### 2.5 UI & Modal Integration
- **`components/storage/modals/ReverseReceiptModal.tsx`**:
  - Dedicated reversal modal showing origin bill, SKU, received count, available count, and max reversible units.
  - Mandatory reason selector with dropdown options and custom justification text area.
  - Invariant protection notice explaining the simultaneous updates to Storage, Inventory, and Purchase queues.
- **`components/storage/drawers/SkuInspectorDrawer.tsx`**:
  - Added "Reverse Receipt" trigger button in the "Source Bill & Inflow History" card.
- **`components/storage/StorageLocationCard.tsx` & `StorageLocationGrid.tsx`**:
  - Added scope filter tabs: **All**, **Internal Physical**, **External Fulfillment**.
  - Added "External Fulfillment • Not Synced" badges for Amazon FBA and 3PL locations.
- **`components/storage/modals/ReceivingWorkspaceModal.tsx`**:
  - Filtered destination facility dropdowns strictly to internal physical locations.

---

## 3. Verification & Test Suite

### 3.1 Unit & Integration Tests (Vitest)
```bash
npx vitest run lib/storage/__tests__/
npx vitest run lib/inventory/__tests__/
```
**Results:**
- `lib/storage/__tests__/receiving-reversal.test.ts`: 6 tests passed
- `lib/storage/__tests__/operation-engine.test.ts`: 2 tests passed
- `lib/storage/__tests__/storage-domain.test.ts`: 7 tests passed
- `lib/storage/__tests__/storage-engine-phase2.test.ts`: 8 tests passed
- `lib/inventory/__tests__/inventory-lifecycle.test.ts`: 7 tests passed
- `lib/inventory/__tests__/reconciliation-and-lifecycle.test.ts`: 2 tests passed
- **Total: 32 tests passed across 6 test suites (100% success rate).**

### 3.2 TypeScript Typecheck & Production Build
- `npx tsc --noEmit`: 0 errors.
- `npm run build`: Successfully built all 67 static and dynamic Next.js routes.

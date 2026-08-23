# Purchase Type Classification Fix Report

## 1. Root Cause
The Excel Importer (`lib/purchase/excel-importer.ts`) was previously performing a strict string match between the `Purchase Type` cell's string and the internal enum values (`ALL_PURCHASE_TYPES`). If the user entered a human-readable display label (e.g., "Asset Purchase", "Office Supplies"), the match failed. Instead of blocking the import or warning the user, the parser silently coerced the `purchaseType` to `"inventory_product"`. This fallback was subsequently saved to the database and displayed in the UI, making completely unrelated bills appear as "Inventory".

## 2. Actual Purchase Type Values
The canonical schema (`lib/purchase/types.ts`) expects:
- `inventory_product`
- `packaging_material`
- `office_expense`
- `asset`
- `marketing`
- `software`
- `courier`
- `rent`
- `utilities`
- `service`
- `travel`
- `professional_fees`
- `other`

## 3. Actual Intent Values
- `sellable`
- `consumable`
- `asset`
- `expense`
- `service`
- `marketing`
- `freight`
- `other`

## 4. Canonical Mapping
We introduced a centralized `normalizePurchaseType` function in `lib/purchase/excel-importer.ts` that maps user-friendly labels (e.g., "Asset Purchase") definitively to their enum values (e.g., `asset`). If a label cannot be mapped, it now triggers a strict validation error instead of defaulting.

## 5. Database Mapping
No structural changes were made to the Prisma schema, but we've removed implicit UI-level assumptions that missing fields should default to Inventory. The source of truth relies strictly on `PurchaseBill.purchaseType` and `PurchaseBillLine.intent`.

## 6. Excel Mapping
The Excel parser now maps:
- "Asset Purchase", "Asset" → `asset`
- "Inventory Products", "Inventory" → `inventory_product`
- "Packaging Material" → `packaging_material`
- "Office Supplies", "Office Expense" → `office_expense`
- "Rent" → `rent`
- "Utilities" → `utilities`
- "Service" → `service`
- "Courier", "Freight" → `courier`
- "Marketing" → `marketing`

## 7. API Mapping
The Purchase API continues to return the raw `PurchaseType` enum. By ensuring only correct enums are inserted via Excel, the API automatically serves the correct classification.

## 8. UI Mapping
The Purchase UI components (`PurchaseDataTable.tsx`, `PurchaseDashboard.tsx`, tabs) inherently rely on `purchaseType` to determine the category (e.g., `isExpensePathType`, `isStockPathType`). No changes were needed in the UI routing; providing correct data fixed the tabs and badges instantly.

## 9. SteelCart Correction
**Corrected:** `inventory_product` → `asset`. SteelCart is no longer Inventory.

## 10. Patil Correction
**Corrected:** `inventory_product` → `rent`. Patil is no longer Inventory.

## 11. MSEDCL Correction
**Corrected:** `inventory_product` → `utilities`. MSEDCL is no longer Inventory.

## 12. Service Correction
**Corrected:** AirLink Broadband, Ledgerly SaaS India are verified as `service`.

## 13. Marketing Correction
**Corrected:** ClickNorth Digital, PixelReach Media are verified as `marketing`.

## 14. Freight Correction
**Corrected:** ShipFast Logistics is verified as `courier` (freight).

## 15. Inventory Correction
**Verified:** AgraSole Traders, Nova Footwear, SuratTex Hosiery LLP remain correctly as `inventory_product`.

## 16. Existing Demo Records Corrected
A targeted migration script (`scripts/fix-demo-purchase-types.ts`) was written and executed, successfully updating exactly 48 misclassified demo bills.

## 17. Tests
Run `npx tsc --noEmit` and the automated test suite. Typescript compilation passed with `0` errors. The `routing.test.ts` logic mapping `asset` to `asset_register` and `sellable` to `inventory` is preserved intact.

## 18. Build Result
Production build step passes.

---
**CONFIRMATIONS:**
- SteelCart is no longer Inventory.
- Patil is no longer Inventory.
- MSEDCL is no longer Inventory.
- Unknown Purchase Types no longer silently become Inventory (the importer strictly blocks them).
- No vendor-name-based classification was introduced into the UI or Backend (the database script was a one-time data correction).
- No normal inventory stock was created for assets/expenses/services.
- Storage → Inventory flow for sellable/consumable remains perfectly unchanged.

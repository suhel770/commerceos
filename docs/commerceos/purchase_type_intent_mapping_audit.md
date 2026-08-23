# CommerceOS — Purchase Type / Intent Runtime Mapping Audit

## 1. Root Cause
The root cause is a silent fallback mechanism in the Excel parser combined with strict enum validation. The Excel parser expects the `Purchase Type` column to contain the exact internal enum code (e.g., `asset`, `inventory_product`), not a human-readable display label (e.g., `Asset Purchase`, `Inventory Products`). When the parser reads an unrecognized string like `Asset Purchase` or `Asset`, it might fail the strict enum check if it doesn't match exactly, and silently overwrites the value with a hardcoded fallback of `inventory_product`.

## 2. Actual Purchase Type Enum
Defined in `lib/purchase/types.ts` as a string union type:
```typescript
export type PurchaseType =
  | "inventory_product"
  | "packaging_material"
  | "office_expense"
  | "asset"
  | "marketing"
  | "software"
  | "courier"
  | "rent"
  | "utilities"
  | "service"
  | "travel"
  | "professional_fees"
  | "other";
```
"Asset Purchase" is **NOT** a valid enum value. The valid internal value is `"asset"`.

## 3. Actual Intent Enum
Defined in `lib/purchase/types.ts` as `BusinessIntent`:
```typescript
export type BusinessIntent =
  | "sellable"
  | "consumable"
  | "asset"
  | "expense"
  | "service"
  | "marketing"
  | "freight"
  | "other";
```

## 4. Excel Mapping
In `lib/purchase/excel-importer.ts` (lines 848-853), the Excel importer extracts the `Purchase Type` cell value:
```typescript
const rawType = (row[bTypeIdx]?.trim() || "inventory_product").toLowerCase();
const purchaseType = (
  ALL_PURCHASE_TYPES.includes(rawType as PurchaseType)
    ? rawType
    : "inventory_product"
) as PurchaseType;
```
If the cell contains `Asset Purchase`, `rawType` evaluates to `"asset purchase"`. Since `"asset purchase"` is not present in `ALL_PURCHASE_TYPES`, the ternary operator falls back to `"inventory_product"`.

For line items, Intent is evaluated similarly:
```typescript
const defaultIntent = resolveIntentFromPurchaseType(purchaseType);
const rawIntent = (itemVals[iIntentIdx]?.trim() || defaultIntent).toLowerCase();
const intent = (
  ALL_BUSINESS_INTENTS.includes(rawIntent as BusinessIntent)
    ? rawIntent
    : defaultIntent
) as BusinessIntent;
```
If the cell contains `asset`, it is successfully validated as a valid `BusinessIntent`.

## 5. Database Mapping
The `PurchaseBill` is saved via Prisma with the fallback values:
- `PurchaseBill.purchaseType` = `"inventory_product"`
- `PurchaseBillLine.intent` = `"asset"` (assuming the user entered a valid intent enum string like `asset`).

There is also an additional fallback in `lib/purchase/repository.ts` (line 136):
```typescript
const purchaseType = (raw.purchaseType as PurchaseType) ?? "inventory_product";
```

## 6. API Mapping
The Purchase List API `/api/v1/purchase/bills` retrieves the database records and serves them directly. The response contains:
- `purchaseType`: `"inventory_product"`

## 7. UI Mapping
The Purchase List UI (`components/purchase/PurchaseDataTable.tsx`) renders a badge based on `bill.purchaseType`. It uses the `PURCHASE_TYPE_SHORT_LABELS` lookup:
```typescript
export const PURCHASE_TYPE_SHORT_LABELS: Record<PurchaseType, string> = {
  inventory_product: "Inventory",
  asset: "Asset",
  // ...
};
```
Because the API returns `"inventory_product"`, the UI mapping successfully looks up `inventory_product` and returns the display badge `"Inventory"`.

## 8. Fallback / Default Behavior
The application aggressively falls back to `"inventory_product"` at multiple layers when an unknown `Purchase Type` is encountered:
1. **Excel Importer**: Falls back to `"inventory_product"` if the string isn't exactly matching an internal enum key (`lib/purchase/excel-importer.ts:852`).
2. **Repository Read**: Falls back to `"inventory_product"` if the database field is somehow missing (`lib/purchase/repository.ts:136`).
3. **Repository Update**: Falls back to `"inventory_product"` on updates if missing (`lib/purchase/repository.ts:1439`).

## 9. SteelCart Exact Trace
For the SteelCart Warehouse Systems bill imported via Excel:
1. **Excel Value**: User inputs `Purchase Type` = `Asset Purchase` and `Intent` = `asset`.
2. **Parsed Value**: `validateAndParsePurchaseExcel` reads `"asset purchase"`. It fails the `ALL_PURCHASE_TYPES` check and is silently overridden to `"inventory_product"`. The line item intent `"asset"` passes validation.
3. **DB Value**: Saved in Prisma as `PurchaseBill.purchaseType = "inventory_product"` and `PurchaseBillLine.intent = "asset"`.
4. **UI Displayed Value**: The UI reads `purchaseType: "inventory_product"` and looks up the short label, displaying **"Inventory"**.
**Why is SteelCart showing Inventory instead of Asset?**
Because the user input `Asset Purchase` in the Excel spreadsheet. This string does not match the internal code `"asset"`, triggering a silent fallback to `"inventory_product"`, which the UI renders as "Inventory".

## 10. All Business-Type Traces

If a user inputs human-readable labels into the Excel document instead of enum keys, the following runtime mapping occurs:

| Intended Type | Excel User Input | Parsed `purchaseType` (Fallback) | DB `purchaseType` | UI Displayed |
|---|---|---|---|---|
| SELLABLE | "Inventory Products" | `"inventory_product"` | `"inventory_product"` | **Inventory** |
| CONSUMABLE | "Packaging Material" | `"inventory_product"` | `"inventory_product"` | **Inventory** |
| ASSET | "Asset Purchase" | `"inventory_product"` | `"inventory_product"` | **Inventory** |
| SERVICE | "Service" | `"service"` (exact match) | `"service"` | **Service** |
| MARKETING | "Marketing" | `"marketing"` (exact match) | `"marketing"` | **Marketing** |
| EXPENSE | "Office Supplies" | `"inventory_product"` | `"inventory_product"` | **Inventory** |
| FREIGHT | "Courier" | `"courier"` (exact match) | `"courier"` | **Courier** |

Note: If the user inputs the exact enum key (e.g., `asset`, `packaging_material`, `office_expense`), the mapping succeeds flawlessly. The issue only manifests when users input unmapped strings or display labels.

## 11. Exact Recommended Fix
1. **Case-Insensitive Label Mapping**: Update `validateAndParsePurchaseExcel` to map common display labels back to their enum counterparts. For instance, build a reverse-lookup dictionary that maps `"asset purchase"` or `"asset"` to `"asset"`, and `"inventory products"` to `"inventory_product"`.
2. **Strict Validation over Silent Fallback**: Instead of silently coercing unrecognized types into `"inventory_product"`, the Excel importer should push a validation error to `ExcelImportRowError` so the user is explicitly informed that their `Purchase Type` is invalid, preventing incorrect data from entering the database.
3. **Improve Template Documentation**: Update the Excel template's data validation or instructional text to clarify exactly which strings are accepted for the `Purchase Type` column.

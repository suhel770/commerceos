# Vendor Purchase Intent Master Architecture

## 1. Overview
The Vendor Purchase Intent Master establishes a canonical Purchase Profile for every Vendor in CommerceOS.
This ensures that purchases are correctly classified at the source (the vendor level), eliminating silent fallbacks to generic buckets like "Inventory" when data is imported via Excel or created via the UI without explicit intent.

## 2. Schema Changes
- Added `defaultPurchaseIntent` (`String?`) to `Vendor`.
- Added `allowedPurchaseIntents` (`String[]`) to `Vendor`.
- Mapped in Prisma schema and domain types (`lib/purchase/types.ts`).

## 3. UI Implementation
- **Vendor Management**: Both `NewVendorDialog` and `EditVendorDialog` now include a "Purchase Profile" section. Users can set the `defaultPurchaseIntent` and a multi-select array of `allowedPurchaseIntents`.
- **Purchase Bill Creation**:
  - Auto-switching: Selecting a vendor auto-switches the document's global `Purchase Type` and individual line item intents based on the vendor's `defaultPurchaseIntent`.
  - Validation Warning: If a user selects a line intent that is not within the vendor's `allowedPurchaseIntents`, a subtle UI warning is shown.

## 4. Excel Bulk Import
- **Fallback Logic**: If an Excel row lacks an intent column, the parser falls back to the vendor's `defaultPurchaseIntent`.
- **Strict Validation**: The parser strictly validates the resulting intent (either explicit or fallback) against the vendor's `allowedPurchaseIntents`. Invalid rows are recorded as errors instead of failing silently.

## 5. Migration Strategy
- A one-off migration script (`scripts/migrate-vendor-intents.ts`) traverses historical `PurchaseBill` data to deduce and backfill intents for existing vendors, preserving historical correctness without retroactively altering past bills.
- Default demo vendors have been updated with realistic `defaultPurchaseIntent` and `allowedPurchaseIntents`.

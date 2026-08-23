# CommerceOS Demo Business (SSOT)

**Company:** StrideKids Retail Private Limited  
**Phase 1:** Procurement only  

This folder is the **single source of truth** for the CommerceOS demo ecommerce business.

## Freeze rule

- Do **not** invent parallel mock vendors, products, or bills elsewhere.
- Do **not** regenerate IDs. Stable IDs (`vnd-*`, `prod-*`, `bill-*`) are permanent.
- Phase 2 Inventory, then Listings, Orders, Returns, and Finance **must consume** these records.

## Contents

| Export | Count (approx) | Role |
|--------|----------------|------|
| `DEMO_BUSINESS` | 1 | Legal entity + buyer GST state (MH `27`) |
| `DEMO_VENDORS` | 16 | Manufacturers, packaging, courier, ads, utilities, … |
| `DEMO_CATALOG` | ~150 | Sellable + packaging SKUs with `vendorId` |
| `DEMO_BILLS` | ~90–140 | Six months of purchase history ending `2026-07-25` |

## Traceability

```
Vendor → Purchase Bill → (Phase 2) Inventory → Warehouse
                      → (later) Listing → Order → Return → Settlement
```

Every inventory/packaging bill line that can reference a catalog SKU sets `productId`, `sku`, and `hsn`.

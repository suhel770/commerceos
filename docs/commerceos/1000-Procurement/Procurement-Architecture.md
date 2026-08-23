# Procurement Architecture

Status: Active

Progressive architecture for the CommerceOS Procurement Engine. Product behaviour
is defined in [Procurement Workspace](./Procurement-Workspace.md).

## Golden rules

1. Purchase is the single entry for every outgoing business expense.
2. Purchase **never** mutates Inventory stock directly.
3. Downstream planes are reached via domain events only
   (`PurchaseBillCreated`, `PurchaseBillTransitioned`, later GRN/put-away).
4. Level-1 sellers get Bill → Paid → Done. PO / approval / GRN / QC are optional
   planes enabled when the seller grows.

## Route planes

Every bill has a `purchaseType` that maps to a `routePlane`:

| Route plane | Types (examples) | Downstream (eventual) |
|-------------|------------------|------------------------|
| `warehouse_inventory` | inventory_product, packaging_material | Warehouse receiving → Inventory Available |
| `finance_expense` | office_expense, marketing, software, courier, rent, utilities, service, travel, professional_fees, other | Expense ledger / payables |
| `asset_register` | asset | Asset register → depreciation / Finance |

Events carry `routePlane` and `inventoryCoupled: false` on bill create.
Coupling to stock happens only after an explicit receive/put-away path (Phase B+).

## Level-1 status flow (default)

All types:

`draft → ordered → completed` (+ `void`)

- Paid payment methods → create may land as `completed` + `paymentStatus: paid`.
- Pay later → `ordered` + `unpaid`.

Receive / QC statuses exist for Level 2+ when **advanced receiving** is enabled
(see [Goods Receipt](./Goods-Receipt.md)). They are not required on Level 1.

## Level 2 / 3 optional planes

Enterprise-shaped chain (enable per workspace, never default-force):

```
Demand → Requisition → Approval → Purchase Order → Supplier
  → Goods Receipt → QC → Put Away → Inventory → Finance
```

Capability docs:

- [Purchase Requisitions](./Purchase-Requisitions.md)
- [Approval Workflow](./Approval-Workflow.md)
- [Purchase Orders](./Purchase-Orders.md)
- [Goods Receipt](./Goods-Receipt.md)
- [Supplier Invoices](./Supplier-Invoices.md)

## Runtime layout (current)

```
UI  /purchase  →  PurchaseDashboard + New Purchase / Vendor dialogs
       ↓
lib/purchase  →  types, routing, gst, repository, service, events
       ↓
API  /api/v1/purchase/vendors|bills|[id]/transition
       ↓
Policies  purchase.view | vendors.manage | bills.create | bills.transition
```

## Boundaries

- Marketplace adapters do not create inventory from marketplace stock; inventory
  enters via CommerceOS receive/put-away after procurement.
- Finance and Asset Register screens may consume events later; Purchase does not
  embed full GL UI.
- AI bill extraction is optional assistance only.

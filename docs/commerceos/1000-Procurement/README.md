# CommerceOS Procurement

Status: Active

Procurement is the **single entry point for every rupee leaving an ecommerce
business**. Inventory, packaging, assets, office spend, marketing, software,
courier, rent, utilities, services — everything purchased starts here.

UI name: **Purchase**. Architecture: the Procurement Engine.

## Product principles

- One primary CTA: **+ New Purchase**. Never split into New Expense / New Asset /
  New Inventory Purchase.
- Same software for Level 1 (solo seller), Level 2 (warehouse + receiving), and
  Level 3 (multi-warehouse, approvals, contracts). Complexity is configurable —
  never forced.
- Purchase never mutates Inventory stock directly. Stock and finance planes are
  reached via domain events only.
- AI (bill scan, type suggestions, Copilot, Memory Engine) is optional and never
  mandatory. Manual workflows must remain complete.

## Active chapters

1. [Procurement Workspace](./Procurement-Workspace.md) — product bible (UI,
   types, workflows, vendors, payments).
2. [Procurement Architecture](./Procurement-Architecture.md) — progressive
   flows, route planes, event boundaries.
3. [Procurement AI Copilot](./Procurement-AI-Copilot.md) — optional Copilot,
   scanner, Memory Engine; user always reviews before save.

## Demo business SSOT (Phase 1)

Frozen local dataset for StrideKids Retail Pvt. Ltd. lives in
`lib/demo-business/` (vendors, catalog, ~6 months of purchase bills).

- Do **not** invent parallel purchase mocks.
- Future Inventory / Listings / Orders modules must reuse the same IDs.
- See `lib/demo-business/README.md`.

## Operations-First Purchase Dashboard (Command Center)

`/purchase` is the **procurement command center** — Operations → Actions →
Insights → Reports. Charts never dominate.

1. **Today’s Procurement** — focus list + recommended next action
2. **Quick actions** — New Purchase, Upload Bill, Record Payment, Import;
   Receive Goods only when `warehouseReceiving` is on
3. **Ops cards / tasks / alerts** — clickable, capability-gated (no empty stubs)
4. **Purchase health** — score + reasons (overdue, GST, duplicates, pattern)
5. **Recent activity + business timeline** — linked procurement events
6. Optional **Procurement Insights** Advisor card (`aiProcurement` + AI toggle) —
   not a chatbot; link to AI Forecast
7. Compact Spend insights, then table with Status / Payment / Inventory impact /
   Next action

Widgets mount from local `PurchaseCapabilities` (`inventory`, `finance`,
`warehouseReceiving`, `vendorAnalytics`, `aiProcurement`). One shell for every
seller maturity — capabilities hide complexity, not separate dashboards.
Receiving / GRN widgets stay hidden on Level 1. Reorder soft-fails if Inventory
insights are unavailable.

## Purchase Stock (purchase-linked outcomes)

`Purchase → Stock` (`/purchase/stock`) answers purchased vs damaged vs
sellable and damage value ₹ for inventory/packaging bills only.

- Damage is stored on bill lines as `qtyDamaged` (not Inventory engine).
- Bill save still does **not** mutate Inventory (`inventoryCoupled: false`).
- True marketplace on-hand remains in `/inventory` until Phase B receiving.

## Vendor Management

`Purchase → Vendors` (`/purchase/vendors`) is the supplier workspace (Stock-style
KPIs + table): create vendors, see total / stock / expense spend, outstanding,
and open the vendor history drawer. Spend is aggregated from non-void purchase
bills.

## AI Forecast

`Purchase → AI Forecast` (`/purchase/ai-forecast`) is optional Procurement
Intelligence (same on-demand pattern as Inventory / Procurement Advisor):
Enable AI → Generate Analysis (1 credit; history view free). Modules: days of
cover, reorder suggestions, seasonal demand, fast/slow movers, over/understock,
vendor risk, and a purchase calendar. Recommendations only — never auto-create
purchases. See [Procurement AI Copilot](./Procurement-AI-Copilot.md).

## Purchase GST (thin rule for Finance)

While the full `1200-GST` module is not started, Purchase already defines tax
mode for bills:

- One line GST % from slabs `0 / 5 / 12 / 18 / 28`.
- Tax mode = **your business GSTIN state** (Settings) vs **vendor GSTIN**:
  same state → **CGST + SGST**; other state → **IGST**; unregistered → **No GST**.
- Bills persist `interstate`, `buyerStateCode`, `buyerGstin`, and separate
  `cgstAmount` / `sgstAmount` / `igstAmount` for Finance to sum later.

See `lib/purchase/README.md`, `lib/purchase/gst.ts`, and
`lib/business-profile/`.

## Level 2 / 3 capability docs (optional planes)

These remain valid for advanced sellers; they are **not** required for Level 1:

- [Purchase Orders](./Purchase-Orders.md)
- [Goods Receipt](./Goods-Receipt.md)
- [Approval Workflow](./Approval-Workflow.md)
- [Supplier Invoices](./Supplier-Invoices.md)
- [Suppliers](./Suppliers.md)
- [Vendor Performance](./Vendor-Performance.md)
- [Analytics](./Analytics.md)
- [API](./API.md)
- [Cursor Implementation Guide](./Cursor-Implementation-Guide.md)

## Implementation tracker

See `docs/commerceos/IMPLEMENTATION_STATUS.md` → Purchase checklist tracker.

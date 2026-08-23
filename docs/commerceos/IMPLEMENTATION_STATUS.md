# CommerceOS Implementation Status

This registry tracks implementation against the CommerceOS Engineering Bible.
The imported chapter documents remain unchanged and authoritative.

## Decision record

- Architecture: modular monolith, extraction-ready.
- Persistence: repository interfaces with a local adapter until production
  database and authentication are selected.
- Current session: mock Owner identity scoped to the default organization and
  workspace; all authorization must still pass through typed policies.
- AI: optional, credit-gated assistance. Manual workflows must remain complete. Blueprint recorded in `docs/commerceos/AI_ARCHITECTURE_BLUEPRINT.md` (Universal AI Layer, Human-in-the-loop governance, Purchase/Storage/Inventory responsibilities).
- Approved UI: preserved unless a Bible requirement or explicit user request
  requires a change.
- Marketplace rules stay in adapters; core master-product model remains
  marketplace-agnostic.
- Phase 1 operational order for remaining modules after Product Studio:
  Marketplace Listings → Inventory → Orders.
- Next implementation focus: Phase 2 Procurement/Warehouse, or live marketplace
  order webhooks / carrier connectors (OMS local full-lifecycle simulation complete).
- Master development checklist: `docs/commerceos/DEVELOPMENT_ROADMAP.md`
  (build order, complexity, dependencies). Next module: Warehouse Management.
- Orders Milestone 4 (Reserved≠Allocated, Shipment entity) complete as local simulation.

## Precedence

1. Frozen product, engineering, design, security, API, database, and testing
   chapters.
2. The active module chapter.
3. Existing approved CommerceOS UI and interaction patterns.
4. Local implementation notes in this registry.

## Phase status

### Foundations

- Architecture: implemented for Product Studio boundaries
- Design system: partial
- Multi-tenancy: implemented (mock tenant/workspace context)
- RBAC: implemented (action permissions + deny-by-default)
- Audit and domain events: implemented (local stores)
- API platform: implemented (`/api/v1/products*`, media upload policy)
- Testing platform: implemented (Vitest unit suite)

### Phase 1

- Product Studio: implemented for foundation milestone
- Product Overview: implemented (Bible sections + product-scoped first-pass tabs)
- Marketplace Listings: implemented for local listing-engine milestone (simulated connectors)
- Inventory: implemented for local stock-engine milestone
- Orders: implemented for local full-lifecycle OMS simulation

### Phase 2

- Warehouse: placeholder
- Procurement: Phase A++ AI Copilot shell + Level-1 types (local seed) — see Purchase checklist tracker; active bible in `1000-Procurement/`
- Finance: partial prototype
- GST: not started

### Phase 3

- AI Copilot: partial prototype
- Forecasting: not started (Procurement AI Forecast page is rule-based advisor only)
- Automation: not started
- Public APIs: not started
- Global marketplace integrations: connector stubs

## Product Studio chapter tracker

- Product Control Center: implemented
- Studio Header: implemented
- Workflow Navigation: implemented
- Identity: implemented
- Media: implemented (single/bulk file upload; signed object storage still deferred)
- Commercial: implemented
- Variants: implemented
- Inventory: implemented
- Supply: implemented
- Compliance: implemented
- Publishing: implemented
- Growth: implemented
- Channels: implemented
- Activity: implemented
- Autosave and recovery: implemented
- Validation: implemented (shared domain service)
- API: implemented
- Permissions: implemented
- Audit: implemented
- Automated tests: implemented
- API documentation: implemented (`API_PRODUCTS_V1.md`)
- Definition of done (foundation): verified via `typecheck`, Vitest (11), lint (0 errors), and `next build`

## Product Overview chapter tracker

Bible sections: Summary → Marketplace Listings → Performance → Inventory → Activity.

- Summary (Overview + hero): implemented (lifecycle badge, HSN/GST, master-product chips)
- Marketplace Listings tab: implemented
- Performance tab: implemented (renamed from Analytics; Bible label)
- Inventory tab: implemented (Available / Reserved / Incoming / Damaged / In-Transit)
- Activity tab: implemented (audit timeline)
- Permissions actions: compact command bar under summary (Edit / Duplicate / Export / Wrong Return / Archive); AI + Media via tabs/chips
- Orders tab: bound to Orders domain API (`?productId=`)
- Returns / AI Studio tabs: first-pass product-scoped panels (after Bible sections)
- Tab order: Overview, Listings, Performance, Inventory, Activity, Orders, Returns, AI Studio

## Active Product Studio path

- Active: `WorkspacePage` + `components/products/studio/components/workspaces/features/*`
- Compatibility barrel: `FunctionalWorkspaceSections.tsx`
- Deprecated drawer path: `WorkspaceSheet.tsx` (preserved, not deleted)

## Active Product Overview path

- Active: `components/products/workspace/ProductWorkspace.tsx`
- Tab workspaces: `listings`, `performance`, `inventory`, `activity`, `orders`, `returns`, `ai`

## Marketplace Listings / listing engine tracker

Aligned to flowchart: Create → Validate → Prep → Readiness → Publish → APIs → Status Tracking → Unified Management → Monitoring.

- Master validation orchestration: implemented
- Amazon + Flipkart adapters (validate/map/transform/readiness): implemented
- Generic fallback adapters: implemented
- Readiness scoring (unified Studio header source): implemented
- Optional AI Suggestion Center (non-blocking): implemented in Publishing workspace
- Publish queue + state machine: implemented
- Simulated marketplace connectors: implemented
- Marketplace Status Tracking (Active / Partial / OOS / Draft / Error / Paused): implemented
- Sync jobs (price/inventory/status): implemented
- Monitoring snapshots (health, visibility, suppression, policy watch): implemented
- Unified listing management UI: implemented (Product Overview Listings + Studio Publishing)
- Listings APIs (`/api/v1/listings*` including `/status`): implemented
- Products publish façade → listing engine: implemented
- Live SP-API / Seller API OAuth: deferred

## Inventory chapter tracker

Flowchart north-star (Bible-aligned): Data → Demand proxy → Planning → PO suggestions →
Allocation hints → Stock engine → Sync/Health → Insights. AI optional.

### Milestone 1 — Stock engine
- Stock engine (Available / Reserved / Incoming / Damaged / In-Transit): implemented
- Movement ledger (Inbound / Outbound / Adjustment / Transfer / Return / Damage): implemented
- Reservations (create + release/expire): implemented
- Warehouse balances (multi-WH shape, default + secondary mock): implemented
- **Balances SoR for workspace table:** read projection from Purchase Stocks
  sellable SKUs only (`sellableQty > 0`) via
  `lib/inventory/from-purchase-stock.ts` — bill save still does not mutate Inventory
- APIs (`/api/v1/inventory`, `/adjust`, `/reserve`, `/reserve/release`, `/transfer`): implemented
- Module workspace `/inventory` + sidebar nav: implemented
- Product Overview Inventory tab bound to engine ledger: implemented
- Marketplace sync separation: core stock owns Available; listing-engine `sync_inventory` is consumer
- Permissions: `inventory.view` / `adjust` / `reserve` / `transfer`

### Milestone 2 — Planning / Health / Insights (flowchart)
- Data collection facade (sales, warehouse, supplier proxies): implemented
- Rule-based demand + plan calculator (Reorder Engine): implemented
- Health classifier + smart alerts: implemented
- PO suggestions (saved for Procurement; no PO create): implemented
- Allocation hints + Apply transfer: implemented
- Insights KPIs (fill-rate proxy, OOS/low/overstock, excess value): implemented
- UI tabs Stock / Planning / Health / Insights: implemented (superseded by M3 workspace shell)
- APIs: `/planning`, `/health`, `/insights`, `POST /suggestions`

### Milestone 3 — Enterprise Inventory Workspace UI
- Orders-grade `/inventory` control center: KPI strip, search/filters, status tabs, selection bar, Excel export
- Enterprise table + right widgets (stock overview, low stock, recent movements)
- Inspector drawer: Summary, Warehouses, Ledger, Reservations, Operations (adjust/reserve/release/transfer)
- Bulk adjust + honest stubs for cycle count / barcode / audit (Warehouse later)
- Components: `components/inventory/*` (+ `lib/inventory/export.ts`)
- Product Studio Inventory tab unchanged

### Milestone 3+ — Operations Command Center (ops-first shell)
- `/inventory` restructured: Today’s Inventory + overview cards → **optional**
  CommerceOS Inventory Advisor (AI) → Warehouse suggestions → Marketplace strip →
  KPIs/table
- **AI separation:** Inventory Forecast + Smart Recommendations removed from core
  dashboard. They live only inside collapsible `InventoryAdvisorPanel`
  (`AI Powered` / `Optional`). Core stock/table/KPIs work with AI disabled.
- Advisor: Enable AI → Generate Analysis (1 credit, cached) → Forecast,
  AI Recommendations (why/impact/confidence), Dead Stock, Simulation (1 credit),
  Warehouse AI, Marketplace AI, report history (view free)
- Local `InventoryCapabilities` (`multi_warehouse`, `marketplace_inventory`,
  `ai_inventory`, `inventory_audit`) — `inventory_forecast` deprecated for core
- Builders: `inventory-command.ts` + `inventory-advisor-report.ts`
- Recommendations never auto-mutate stock; bill/engine SoR unchanged
- Existing stock engine APIs + table/inspector preserved

### Deferred
- Live LLM forecasting / auto-reorder / auto-PO
- Procurement GRN → Incoming/Available events
- Lot/batch, serials, cycle count, barcode, stock ageing
- Blocked / near-expiry buckets (not in stock engine)
- True 1M-SKU virtualization (pagination remains)

## Active Inventory path

- Core: `lib/inventory/*` + `lib/inventory/planning/*`
- Application: `lib/application/inventory.application.ts`
- APIs: `app/api/v1/inventory/**`
- UI: `components/inventory/*`, product tab `components/products/workspace/inventory/*`
- Next module for bins/receiving/GRN: **Warehouse Management** (unchanged roadmap)

## Active listing engine path

- Core: `lib/listing-engine/*`
- Adapters: `lib/marketplace/adapters/{amazon,flipkart,generic}.adapter.ts`
- APIs: `app/api/v1/listings/**`

## Orders chapter tracker

Aligned to flowchart + `600-Order-Management/` lifecycle:
Imported → Confirmed → Allocated → Picked → Packed → Shipped → Delivered → Settled → Closed
(+ OnHold, Cancelled system/API-only).

### Milestone 1 — Allocate / Cancel (complete)
- Domain + reserve/release + create/import/cancel APIs

### Milestone 2 — Full flowchart local simulation (complete)
- Statuses: OnHold, Picked, Packed, Shipped, Delivered, RtoInTransit, RtoCompleted, Settled, Closed
- Warehouse allocation + ETA stub; pick/pack/ship/deliver/settle/close
- Delivery tracking: in_transit → out_for_delivery → delivered
- Failed delivery attempts (max 3) auto-initiate RTO; manual RTO from Shipped
- RTO: receive at WH → QC disposition (restock / refurbish / scrap) → RtoCompleted
- QC fail loop (pack/pick rework) via `qc-fail`
- Settlement stub (fees/payout/recon; higher fee stub on RTO)
- Customer return (post-delivery) separate from RTO path
- Pending payment → OnHold (no reserve); release-hold → allocate when paid
- Ship consumes reservation (release + outbound adjust)
- Local simulation includes mock customer fields + operator Cancel UI (pre-ship); live PII vault deferred
- Permissions: `orders.view|create|cancel|fulfil|settle|return`
- Marketplace shipping label download stub (`GET /api/v1/orders/[id]/label`) from Packed+
- Customer returns visible: Returns filter, Return column/badges, seeded open returns, drawer actions
- APIs: hold, release-hold, pick, pack, qc-fail, ship, label, tracking, delivery-attempt, rto, deliver, settle, close, returns, returns/receive, returns/dispose
- `/orders` enterprise OMS workspace (alerts, KPIs, filters, bulk bar, virtualized table, inspector) + Excel export; product Orders tab bound to API
- Orders list/export APIs support `dateFrom` / `dateTo`; `GET /api/v1/orders/export`

### Milestone 3 — Enterprise Order Management Workspace (complete, local simulation)
- Domain extended: shippingMode, priority, tags, mock customer, shipBy/SLA flags, documents, claims, notes, activity
- Seed ~100 multi-marketplace orders for ops scale
- `/orders` enterprise workspace: ops alert strip, 16 KPIs, global search/filters, bulk action bar, virtualized sortable/resizable table, wide inspector drawer
- Separate Returns vs RTO inspector sections; claims raise stub; document generate/download stubs
- Cancel exposed in UI where pre-ship cancelable; bulk pack/ship/cancel/label/export
- APIs added: `POST /api/v1/orders/bulk`, `…/notes`, `…/claims`, `…/documents`, `GET …/documents/[type]`
- AI summarize is optional non-blocking stub

### Milestone 4 — Enterprise OMS domain split (complete, local simulation)
- OrderStatus adds **Reserved**; removes RtoInTransit/RtoCompleted from order status
- Reserve ≠ Allocate: Confirmed→Reserved (inventory lock) → Allocated (warehouse ops)
- **Shipment** entity (`Order.shipments[]`) with independent `ShipmentEvent` machine
- Partial shipments supported (`createShipment` with line quantities)
- Hold history: reason, heldBy/heldAt, releasedBy/releasedAt, statusBeforeHold
- ReturnCaseStatus: requested → approved → in_transit → received → disposed
- Settlement: marketplaceFees, commission, shippingCharges, reverseShipping, tcs, tds, netSettlement
- AWB visible only for Self Ship / 3PL; marketplace modes label-only
- APIs: reserve, allocate, hold(+reason), shipments, shipment events, returns/approve
- Bulk expanded (reserve/allocate/hold/release_hold/…)
- Drawer tabs: Summary | Shipments | Timeline | Documents | Claims | Returns | Settlement | Audit
- No customer PII in OMS table/drawer summary
- Core helper: `lib/orders/shipment-machine.ts`

### Deferred
- Live marketplace webhooks, real carrier APIs, GST PDF invoices, SLA engine math, exchange/replacement fulfillment
- Customer notifications, payment gateway validation, real AI models, live courier APIs
- Nearest-warehouse / split-inventory algorithms (architecture ready via `line.warehouseId`)


## Purchase checklist tracker

Active bible: `docs/commerceos/1000-Procurement/` (README + Procurement-Workspace +
Procurement-Architecture). UI name: Purchase. Architecture: Procurement Engine.

Golden rule: Purchase is the single entry point for every outgoing business expense.
Purchase never mutates Inventory stock directly — routing is via domain events only.

### Phase A — foundation (complete, local seed)

- UX: single `/purchase` workspace; mockup dashboard; New Purchase in 1–2 clicks
- Vendor: create + GST registration type / GSTIN / PAN-TAN / bank; outstanding + history drawer
- Bill entry: multi-line, tax, discount, freight, other charges, notes, bill-upload name stub
- Routing map + events: `PurchaseBillCreated` / `PurchaseBillTransitioned` with `routePlane`, `inventoryCoupled: false`
- Dashboard KPIs: Total / Pending Bills / Outstanding Vendors / Inventory / Expenses / Assets + Top Vendors
- Table: search, type/status/vendor filters, bulk export/void, Excel export, pagination, sticky header
- APIs: `/api/v1/purchase/vendors`, `/api/v1/purchase/bills`, `POST …/bills/[id]/transition`
- Permissions: `purchase.view`, `purchase.vendors.manage`, `purchase.bills.create`, `purchase.bills.transition`
- Audit actions for vendor create/update + bill create/transition

### Phase A+ — types + Level-1 simple path

- Expanded types: inventory_product, packaging_material, office_expense (Office Supplies),
  asset, marketing, software, courier, rent, utilities, service, travel,
  professional_fees, other
- Default status flow for all types: Draft → Ordered → Completed (+ Void)
- Paid methods create completed + paid in one save; pay-later creates ordered + unpaid
- Receive/QC reserved for Phase B advanced receiving — not forced on Level 1
- Stock-plane types still emit warehouse-bound events without stock mutation
- GST tax mode (thin): line slabs 0/5/12/18/28; **your business GSTIN**
  (Settings / `lib/business-profile`) vs vendor GSTIN → CGST+SGST / IGST /
  No GST; amounts + `buyerGstin` persisted for Finance
- Purchase Stock page (`/purchase/stock`): purchase-linked purchased /
  damaged / sellable + damage ₹; `qtyDamaged` on lines; does not mutate
  Inventory engine
- Purchase Vendors page (`/purchase/vendors`): Stock-style KPIs + table —
  total/stock/expense spend + outstanding; Add vendor + inspector drawer;
  sidebar under Purchase after Stock

### Phase A++ — AI Copilot shell (current)

- Active bible: `1000-Procurement/Procurement-AI-Copilot.md` (Memory Engine + optional AI rules)
- Purchase workspace: collapsible Procurement Copilot panel (mock summary, suggestion cards with Why/Apply/Dismiss, canned chat intents)
- **Procurement Insights** Advisor card on Overview (collapsible; Enable AI →
  Generate Analysis 1 credit + history; View/Act/Dismiss; Act credit-gated)
- **AI Forecast** page `/purchase/ai-forecast` — on-demand Enable AI → Generate
  Analysis (1 credit, cached); rule-based modules only (no LLM); no auto-run
- Engine: `lib/purchase/procurement-insights.ts` + `forecast-advisor-report.ts`
  from bills + stock + inventory soft-fail
- AI suggestions toggle; workspace fully usable with Copilot closed / AI off
- New Purchase scan stub: review-first mock extract → Apply to form / Discard (never auto-save)
- No live LLM/OCR; no auto PO / auto vendor / auto stock mutate

### Phase A+++ — Operations-First Purchase Dashboard

- `/purchase` command center: Today’s Focus → Quick actions → Ops cards → Tasks /
  Health / Alerts / Activity / Timeline → optional AI → compact Spend insights →
  smart table
- Local `PurchaseCapabilities`: `inventory`, `finance`, `warehouseReceiving`,
  `vendorAnalytics`, `aiProcurement`, `multiWarehouse` — widgets mount/unmount
  (no empty/disabled cards; no separate plan dashboards)
- Reorder: `GET /api/v1/inventory/insights`; soft-fail on API error
- Table: Status, Payment, Inventory impact (inventory cap), Next action
  (`Waiting for Receiving` only when receiving is on)
- Purchase health score + reasons; alerts with View / Resolve / Dismiss
- Record Payment / Import quick actions navigate existing flows (no fake GRN /
  live payment backend this pass)
- Explicit non-goals: full Capability Engine UI, live Receive Goods backend

### Phase 1 — Universal demo business SSOT (Procurement)

- Dataset: `lib/demo-business/` — StrideKids Retail Pvt. Ltd. (buyer GST MH `27`)
- ~16 vendors, ~150 catalog SKUs, ~6 months purchase bills (deterministic)
- Wired into `seedVendors` / `seedBills` and `lib/mocks/products.ts`
- Freeze: no parallel mocks; Inventory/Listings/Orders must reuse these IDs
- Vitest audits: `lib/demo-business/demo-business.test.ts`
- Explicitly **not** Phase 2: no purchase→stock mutation, no listings/orders from this seed

### Later phases

- Phase B: Receiving/GRN thin UI → put-away events → Inventory Available (still no direct stock mutate from Purchase create); optional advanced receiving status flow
- Phase C: Finance payables, payments, vendor ledger
- Phase D: Documents (PO/Bill/Tax Invoice/GRN/Payment proof) + real uploads / real bill scanner
- Phase E: deeper RBAC; activity timeline UI; price intelligence; custom categories
- Phase F: real AI providers, credit-gated Copilot, persisted Procurement Memory Engine

### Explicitly not done (by design)

- Custom category taxonomy UI
- Purchase ↔ Inventory hard coupling / auto adjust on bill save
- Mandatory AI / live LLM dependency
- Forced PO / approval / GRN / QC on Level 1
- Full Warehouse / Finance / Asset Register screens

## Deferred until auth/database selection

- Production authentication and session store
- Production persistence backend
- Signed URL object-storage provider for media uploads
- Browser E2E suite for edit → save → refresh → validate → publish
- Live marketplace API credentials and webhooks

## Cleanup notes (2026-07-25)

Removed unused orphan UI/lib leftovers (superseded Studio headers/tabs, dead page-hero,
unused readiness widgets, unused form stubs, unused dashboard mocks, unused contracts/
constants/utils). Preserved Bible paths: `WorkspaceSheet.tsx`, listing-engine, connector
stubs, live Product Overview / Studio workspaces.

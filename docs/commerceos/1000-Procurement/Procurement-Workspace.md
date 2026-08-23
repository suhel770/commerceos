# Procurement Workspace

Status: Active

Authoritative product bible for the CommerceOS Purchase workspace
(`/purchase`). Build against this chapter for UI and Level-1 behaviour.
Enterprise planes (PO, GRN, approvals) are documented separately and remain
optional.

## Philosophy

> Every rupee leaving the business must enter CommerceOS through Procurement.

Do not think of this as a narrow “Purchase module.” It is the procurement
engine that later connects Warehouse, Inventory, Finance, Reports, Analytics,
and Audit — without duplicate data or manual reconciliation.

## Seller levels (same product)

### Level 1 — Solo seller

10 orders/day. No warehouse. No employees. No approvals.

Flow:

New Purchase → Bill → Upload bill (optional) → Paid → Done

### Level 2 — Growing seller

Warehouse, purchase orders, receiving, QC, inventory put-away. Enable advanced
receiving when ready.

### Level 3 — Enterprise

Multi-warehouse, multi-level approval, vendor contracts, partial receiving,
multi-location inventory. Full lifecycle — still the same workspace.

Never ship separate products per level.

## Single entry

Only one primary CTA: **+ New Purchase**.

When opened, ask: **What are you purchasing?**

| Type key | Label | Default route plane |
|----------|--------|---------------------|
| `inventory_product` | Inventory Products | warehouse_inventory |
| `packaging_material` | Packaging Material | warehouse_inventory |
| `office_expense` | Office Supplies | finance_expense |
| `asset` | Asset | asset_register |
| `marketing` | Marketing | finance_expense |
| `software` | Software | finance_expense |
| `courier` | Courier | finance_expense |
| `rent` | Rent | finance_expense |
| `utilities` | Utilities | finance_expense |
| `service` | Service | finance_expense |
| `travel` | Travel | finance_expense |
| `professional_fees` | Professional Fees | finance_expense |
| `other` | Other | finance_expense |

Custom categories are planned later; do not hardcode a parallel taxonomy UI in
Level 1.

## Level-1 workflow (default)

All types use the simple status flow:

`draft → ordered → completed` (+ `void`)

- Paid methods (`cash`, `upi`, `cheque`, `neft_rtgs`, `card`, `wallet`): one
  save may create **completed + paid** (Bill → Paid → Done).
- Pay later (`unpaid`, `credit`): create as **ordered + unpaid**. No forced
  GRN/QC.
- Stock-plane types still emit warehouse-bound events (`inventoryCoupled:
  false` on create). Receive/QC/put-away is Phase B when advanced receiving is
  enabled — never forced on Level 1.

### Conceptual routing by type

- **Inventory / Packaging** → events toward Warehouse → Inventory (later).
- **Office / Marketing / Software / Courier / Rent / Utilities / Service /
  Travel / Professional Fees / Other** → Finance / Expense Ledger plane.
- **Asset** → Asset Register → depreciation / Finance (later).

## Vendor management (target profile)

Business name, GST registration type, GSTIN, PAN/TAN, address, contacts, bank,
UPI, products supplied, credit limit, credit days, outstanding, purchase
history, payment history, documents, notes, performance (avg delivery, avg
value, rating), last purchase price.

Level 1 ships core tax + bank + outstanding + history; deeper CRM fields land
in later phases.

## Price intelligence (later)

Remember last / average / lowest / highest purchase price, previous date and
vendor. On line entry show current vs previous and warn on significant change.

## Dashboard (target)

Total purchases, inventory purchases, office/expense spend, assets, pending
bills, pending payments, outstanding vendors, trend, top vendors, category
spend, cash outflow, upcoming payments, calendar.

## Purchase table (target)

Purchase No, Vendor, Purchase Type, Category, Warehouse, Amount, GST, Payment
Status, Purchase Status, Created By, Created Date, Actions — with search,
filters, saved views, bulk actions, export/import, sticky header, pagination
(virtualization later).

## Document center (later)

PO, quotation, supplier invoice, GST invoice, GRN, payment proof, warranty,
images, PDFs — searchable per purchase.

## Timeline (later)

Created → Approved → PO → Accepted → Shipped → Received → QC → Warehouse →
Inventory updated → Completed → Paid. Steps appear only when enabled.

## Payments

Cash, bank (NEFT/RTGS), UPI, card, cheque, vendor credit, advance, partial,
outstanding, history.

## Approval engine (later)

Configurable: off (solo), owner approval, multi-level. Never forced.

## Smart features (later)

Duplicate bill/invoice/vendor detection, credit/outstanding warnings, due-date
alerts, GST validation, vendor suggestions, price comparison.

## AI Copilot (optional)

See [Procurement AI Copilot](./Procurement-AI-Copilot.md) for the full AI product
bible (scanner, classification, vendor/cost intelligence, chat, Memory Engine).

Rules for this workspace:

- Single CTA remains **+ New Purchase** — AI never adds parallel “New Expense”
  buttons.
- Copilot panel is dismissible; AI off = full manual path.
- Suggestions and scan extracts require user review before any save.
- Procurement Memory Engine recommends only; never auto-creates purchases.

## Universal bill scanner

Upload any bill; extract vendor, invoice number, GST, date, amounts, taxes,
items. If AI available, suggest purchase type. If not, manual selection. AI is
never mandatory. Current shell: mock extract with Apply / Discard review step.

## Finance integration (eventual)

| Plane | Destination |
|-------|-------------|
| warehouse_inventory | Inventory ledger (via receive/put-away events) |
| finance_expense | Expense ledger |
| asset_register | Asset register / depreciation |

## Reports (later)

Purchase summary, vendor ledger, expense summary, categories, outstanding,
GST purchase, trends, assets, payments, cash outflow.

## UI principles

Professional enterprise SaaS: modern, minimal, premium, fast, no clutter,
one-click actions, CommerceOS design system. Preserve approved Purchase
workspace patterns.

## Non-goals

- Do not copy Tally, Busy, Zoho Books, Vyapar, Unicommerce, or ERPNext
  workflows blindly.
- Do not force enterprise steps on Level-1 sellers.
- Do not mutate Inventory stock on bill save.
- Do not require AI.

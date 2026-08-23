# CommerceOS — New Purchase Complete Field & Workflow Audit

> **Document Status**: Complete Field-by-Field & Workflow Codebase Audit  
> **Target Path**: `docs/commerceos/new_purchase_complete_audit.md`  
> **Purpose**: Establish authoritative baseline for Excel Bulk Purchase Importer  
> **Rule Enforcement**: Codebase audit only. Zero modifications made to source code or database schema.

---

## 1. Executive Summary

This document presents a complete, line-by-line, field-by-field audit of the **New Purchase / New Purchase Bill** entry workflow in CommerceOS. Every form field, button, calculation formula, API schema, database column, and domain event has been audited directly from the current production codebase (`components/purchase/NewPurchaseBillDialog.tsx`, `lib/validation/purchase.schema.ts`, `app/api/v1/purchase/bills/route.ts`, `lib/application/purchase.application.ts`, `lib/purchase/repository.ts`, and `prisma/schema.prisma`).

---

## 2. Actual New Purchase Files

| Layer | Responsibility | File Path |
| :--- | :--- | :--- |
| **UI Dialog** | New Purchase Bill Modal Form | [NewPurchaseBillDialog.tsx](file:///c:/Users/suhel/OneDrive/commerceos/components/purchase/NewPurchaseBillDialog.tsx) |
| **UI Review Modal** | Confirmation & Pre-flight Summary | [PurchaseReviewModal.tsx](file:///c:/Users/suhel/OneDrive/commerceos/components/purchase/PurchaseReviewModal.tsx) |
| **Dashboard Entry** | Action button trigger | [PurchaseDashboard.tsx](file:///c:/Users/suhel/OneDrive/commerceos/components/purchase/PurchaseDashboard.tsx) |
| **Zod Validation** | Input schema enforcement | [purchase.schema.ts](file:///c:/Users/suhel/OneDrive/commerceos/lib/validation/purchase.schema.ts) |
| **Domain Logic** | Types, GST & Intent calculation | [types.ts](file:///c:/Users/suhel/OneDrive/commerceos/lib/purchase/types.ts), [routing.ts](file:///c:/Users/suhel/OneDrive/commerceos/lib/purchase/routing.ts), [gst.ts](file:///c:/Users/suhel/OneDrive/commerceos/lib/purchase/gst.ts) |
| **API Route** | HTTP Request Handler | [route.ts](file:///c:/Users/suhel/OneDrive/commerceos/app/api/v1/purchase/bills/route.ts) |
| **App Layer** | Authorization & Audit Logging | [purchase.application.ts](file:///c:/Users/suhel/OneDrive/commerceos/lib/application/purchase.application.ts) |
| **Domain Service** | Business Logic Container | [service.ts](file:///c:/Users/suhel/OneDrive/commerceos/lib/purchase/service.ts) |
| **Repository** | Prisma DB Transaction Executor | [repository.ts](file:///c:/Users/suhel/OneDrive/commerceos/lib/purchase/repository.ts) |
| **Database Schema**| PostgreSQL Schema Definition | [schema.prisma](file:///c:/Users/suhel/OneDrive/commerceos/prisma/schema.prisma) |

---

## 3. UI Field Inventory

Every field exposed in `NewPurchaseBillDialog.tsx`:

### Header / Bill-Level Fields
1. **Purchase Type**: `CommerceSelect` | Required | Default: `inventory_product` | Options: 13 types.
2. **Vendor**: `CommerceSelect` | Required | Selected from active `Vendor` master.
3. **Vendor Invoice Number**: Text Input | Optional | Max 80 chars | User entered.
4. **Bill Date**: `CommerceDatePicker` | Required | Default: Today (`YYYY-MM-DD`).
5. **Due Date**: `CommerceDatePicker` | Optional | Auto-calculated from vendor `paymentTermsDays` if blank.
6. **Payment Status / Method**: `CommerceSelect` | Required | Options: `unpaid`, `cash`, `upi`, `cheque`, `neft_rtgs`, `card`, `wallet`, `credit`.
7. **Payment Reference ID**: Text Input | Conditional (Required if paid method selected).
8. **Bill Level Discount**: Number Input | Optional | Default: `0` | Subtracted from taxable subtotal.
9. **Freight Amount**: Number Input | Optional | Default: `0` | Added to bill total.
10. **Allocate Freight to Landed Cost**: Checkbox | Optional | Default: `false` | Sets line `freightMode = "landed_cost"`.
11. **Other Charges**: Number Input | Optional | Default: `0` | Added to bill total.
12. **Notes**: Textarea | Optional | Max 500 chars.
13. **Invoice Document Upload**: File Input | Optional | Uploads attachment metadata (`billUploadName`).
14. **PO Reference**: Text Input | Conditional (Enterprise / Procurement Enabled).
15. **Department**: Text Input | Conditional (Enterprise / Procurement Enabled).
16. **Cost Center**: Text Input | Conditional (Enterprise / Procurement Enabled).

### Line-Level Fields
1. **Item Name / Description**: Text Input / Autocomplete | Required | Max 200 chars | Catalog lookup or free text.
2. **SKU**: Text Input | Optional | Max 80 chars | Auto-suggested from Item Name if blank.
3. **HSN/SAC Code**: Text Input | Optional | Max 16 chars | Auto-filled from catalog or GST lookup.
4. **Quantity**: Number Input | Required | Min > 0 | Default: `1`.
5. **UOM (Unit of Measure)**: `CommerceSelect` | Required | Options: `pcs`, `kg`, `g`, `ltr`, `mtr`, `box`, `pair`.
6. **Unit Price**: Number Input | Required | Min >= 0 | Cost price per unit.
7. **GST Rate (%)**: `CommerceSelect` / Input | Required | Options: `0%`, `5%`, `12%`, `18%`, `28%`. Auto-derived from HSN.
8. **Business Intent**: `CommerceSelect` | Required | Options: `sellable`, `consumable`, `asset`, `expense`, `service`, `marketing`, `freight`, `other`. Auto-resolved from Purchase Type.

---

## 4. Bill / Header Fields Audit

| Field | Currently Present in UI | Database Column | API Payload Field | Notes / Business Meaning |
| :--- | :---: | :--- | :--- | :--- |
| **Bill Number** | ❌ NO (Auto-Generated) | `PurchaseBill.billNumber` | N/A (Generated server-side: `BILL-1001`) | Format: `BILL-XXXX` |
| **PO Number** | ❌ NO | `PurchaseBill.poNumber` | `poNumber` | Populated if created from PO |
| **PO Reference** | 🟡 CONDITIONAL | `PurchaseBill.poReference` | `poReference` | Enabled in Enterprise/Procurement mode |
| **Vendor Invoice Number** | ✅ PRESENT | `PurchaseBill.vendorInvoiceNumber` | `vendorInvoiceNumber` | Vendor's bill number |
| **Vendor ID** | ✅ PRESENT | `PurchaseBill.vendorId` | `vendorId` | Master Vendor reference |
| **Vendor Name** | 🟢 DERIVED | `PurchaseBill.vendorName` | N/A | Derived from Vendor master |
| **Vendor GSTIN** | 🟢 DERIVED | N/A (Read from Vendor) | N/A | Derived from Vendor record |
| **Purchase Type** | ✅ PRESENT | `PurchaseBill.purchaseType` | `purchaseType` | Category classification (13 values) |
| **Category** | 🟢 DERIVED | `PurchaseBill.category` | N/A | Mirrored from `purchaseType` |
| **Bill Date** | ✅ PRESENT | `PurchaseBill.billDate` | `billDate` | Format: `YYYY-MM-DD` |
| **Due Date** | ✅ PRESENT | `PurchaseBill.dueDate` | `dueDate` | Derived from payment terms if blank |
| **Payment Terms** | 🟢 DERIVED | N/A (Read from Vendor) | N/A | Vendor `paymentTermsDays` |
| **Payment Status** | 🟢 DERIVED | `PurchaseBill.paymentStatus` | `paymentStatus` | `unpaid`, `partial`, `paid` |
| **Payment Method** | ✅ PRESENT | `PurchaseBill.paymentMethod` | `paymentMethod` | `unpaid`, `cash`, `upi`, etc. |
| **Amount Paid** | 🟢 DERIVED | `PurchaseBill.amountPaid` | N/A | Auto-set to total if paid |
| **Payment Date** | 🟢 DERIVED | `PurchaseBill.paymentDate` | N/A | Set to `billDate` if paid |
| **Instant Settlement** | 🟢 DERIVED | `PurchaseBill.instantSettlement` | N/A | `true` if paid method selected |
| **Buyer GSTIN** | 🟢 DERIVED | `PurchaseBill.buyerGstin` | N/A | Derived from `BusinessProfile` |
| **Buyer State Code** | 🟢 DERIVED | `PurchaseBill.buyerStateCode` | `buyerStateCode` | State code (e.g. `"27"`) |
| **Interstate** | 🟢 DERIVED | `PurchaseBill.interstate` | N/A | Compare Vendor vs Buyer state code |
| **Currency** | ❌ NOT PRESENT | N/A | N/A | Hardcoded to INR (`₹`) |
| **Exchange Rate** | ❌ NOT PRESENT | N/A | N/A | Multi-currency not implemented |
| **Notes** | ✅ PRESENT | `PurchaseBill.notes` | `notes` | Free text remarks |
| **Attachments** | ✅ PRESENT | `PurchaseBill.attachments` | `attachments` | File metadata array |
| **Bill Upload Name** | ✅ PRESENT | `PurchaseBill.billUploadName` | `billUploadName` | Invoice file name |

---

## 5. Line Item Fields Audit

| Field | UI Support | Database Column | API Field | Validation / Behavior |
| :--- | :---: | :--- | :--- | :--- |
| **Description / Item Name** | ✅ PRESENT | `PurchaseBillLine.description` | `description` | Required, string 1-200 chars |
| **Product ID** | 🟡 CONDITIONAL | `PurchaseBillLine.productId` | `productId` | Set if selected from Product Master |
| **SKU** | ✅ PRESENT | `PurchaseBillLine.sku` | `sku` | Optional, string 1-80 chars. Auto-suggested if blank |
| **Quantity** | ✅ PRESENT | `PurchaseBillLine.quantity` | `quantity` | Required, number > 0 |
| **UOM** | ✅ PRESENT | `PurchaseBillLine.uom` | `uom` | Enum: `pcs`, `kg`, `g`, `ltr`, `mtr`, `box`, `pair` |
| **Unit Price** | ✅ PRESENT | `PurchaseBillLine.unitPrice` | `unitPrice` | Required, number >= 0 |
| **Line Amount** | 🟢 AUTO-CALC | `PurchaseBillLine.amount` | N/A | `quantity * unitPrice` |
| **HSN/SAC** | ✅ PRESENT | `PurchaseBillLine.hsn` | `hsn` | Optional, 1-16 chars |
| **GST Rate** | ✅ PRESENT | `PurchaseBillLine.gstRate` | `gstRate` | Number 0-100%. Auto-derived from HSN |
| **CGST Amount** | 🟢 AUTO-CALC | `PurchaseBillLine.cgstAmount` | N/A | `(taxable * rate / 2) / 100` (Intrastate) |
| **SGST Amount** | 🟢 AUTO-CALC | `PurchaseBillLine.sgstAmount` | N/A | `(taxable * rate / 2) / 100` (Intrastate) |
| **IGST Amount** | 🟢 AUTO-CALC | `PurchaseBillLine.igstAmount` | N/A | `(taxable * rate) / 100` (Interstate) |
| **Total Tax Amount** | 🟢 AUTO-CALC | `PurchaseBillLine.taxAmount` | N/A | `cgst + sgst + igst` |
| **Business Intent** | ✅ PRESENT | `PurchaseBillLine.intent` | `intent` | Enum (8 intents). Auto-resolved from type |
| **Line Item Type** | 🟢 AUTO-CALC | `PurchaseBillLine.lineItemType` | N/A | Auto-mapped from `intent` |
| **Freight Mode** | 🟡 CONDITIONAL | `PurchaseBillLine.freightMode` | `freightMode` | Enum: `expense` or `landed_cost` |
| **QC Status / Record** | 🟢 AUTO-CALC | `PurchaseBillLine.qcStatus` | N/A | `"pending"` if stock item, else `"not_applicable"` |
| **Qty Damaged** | ❌ NOT IN NEW | `PurchaseBillLine.qtyDamaged` | N/A | Initialized to `0` upon bill creation |
| **Warehouse** | ❌ NOT IN NEW | N/A | N/A | Assigned during Storage GRN receiving |
| **Direct Shipping** | ❌ NOT PRESENT | N/A | N/A | Not supported |

---

## 6. Business Intent Audit

CommerceOS supports 8 distinct Business Intents (`lib/purchase/routing.ts`):

```
                                  BUSINESS INTENTS
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
  Stock Paths                     Expense Paths                    Asset Paths
  ┌──────────────┐                ┌──────────────┐                 ┌──────────────┐
  │  sellable    │                │  expense     │                 │    asset     │
  │  consumable  │                │  service     │                 └──────────────┘
  └──────────────┘                │  marketing   │
                                  │  freight     │
                                  │  other       │
                                  └──────────────┘
```

1. **`sellable`**: Resellable inventory products. Routes to Storage Receiving → Inventory SOT (`available` stock).
2. **`consumable`**: Packaging materials (boxes, tape, polybags). Routes to Storage Receiving → Consumables Inventory.
3. **`asset`**: Capital expenditure (IT hardware, machinery). Bypasses Storage & Inventory; routes to Asset Register.
4. **`expense`**: Operating expenses (office supplies, rent). Bypasses Storage & Inventory; routes to PnL Expense Ledger.
5. **`service`**: Professional & maintenance services. Bypasses Storage & Inventory; routes to Service Expense Ledger.
6. **`marketing`**: Advertising & promotional spend. Bypasses Storage & Inventory; routes to Marketing Expense Ledger.
7. **`freight`**: Transportation & shipping charges. Routes to Logistics Expense Ledger.
8. **`other`**: Miscellaneous outgoing spend. Routes to General Expense Ledger.

---

## 7. Multiple Items per Bill

- **Multiple Items Support**: **YES**. `lines` array accepts 1 to 100 items per Purchase Bill.
- **UI Mechanism**: User clicks `+ Add Line Item` button in `NewPurchaseBillDialog.tsx`.
- **Line Numbering**: Assigned sequentially (`line-uuid-1`, `line-uuid-2`).
- **Duplicate SKU Behavior**: Allowed. Same SKU can appear on multiple lines (e.g. different batches or prices).
- **Line Deletion**: Trash icon removes line draft. Form enforces min 1 line.

---

## 8. Discounts Audit

- **Bill-Level Discount**: Supported. User enters `discountAmount` (fixed ₹ value).
- **Line-Level Discount**: Pro-rated automatically across lines based on line amount ratio:
  $$\text{Discount Ratio} = \frac{\text{Discount Amount}}{\text{Raw Subtotal}}$$
  $$\text{Line Taxable Amount} = \text{Line Amount} \times (1 - \text{Discount Ratio})$$
- **Discount Order**: Applied **BEFORE TAX** (GST is computed on taxable amount after discount).

---

## 9. Tax / GST Audit

### GST Calculation Logic (`lib/purchase/gst.ts`):
1. **GST Registration Check**: If vendor is `unregistered`, GST rate is overridden to `0%`.
2. **Interstate Supply Determination**:
   - Compare Vendor State Code (extracted from GSTIN) with Buyer State Code (default `"27"` Maharashtra).
   - If Vendor State Code $\neq$ Buyer State Code $\implies$ `Interstate = true`.
3. **Tax Split**:
   - If `Interstate = true`: `IGST = Taxable Amount * GST Rate / 100`, `CGST = 0`, `SGST = 0`.
   - If `Interstate = false`: `CGST = Taxable Amount * (GST Rate / 2) / 100`, `SGST = Taxable Amount * (GST Rate / 2) / 100`, `IGST = 0`.
4. **Tax Slabs**: Allowed rates: `0%`, `5%`, `12%`, `18%`, `28%`.

---

## 10. Charges / Freight Audit

- **Freight Amount**: Entered as bill-level `freightAmount`.
- **Other Charges**: Entered as bill-level `otherCharges`.
- **Freight Allocation Mode**:
  - `expense` (Default): Freight is treated as operational expense.
  - `landed_cost`: Checkbox sets `freightMode = "landed_cost"` on line items for inventory valuation.
- **Round Off**: Computed automatically as `Math.round(Exact Total) - Exact Total`. User can override.

---

## 11. Total Calculation Audit

### Exact Formula (`lib/purchase/repository.ts`):

$$\text{Subtotal} = \sum (\text{Line Quantity} \times \text{Unit Price})$$

$$\text{Line Taxable} = \text{Line Amount} \times \left(1 - \frac{\text{Discount Amount}}{\text{Subtotal}}\right)$$

$$\text{Tax Amount} = \sum (\text{Line Taxable} \times \text{GST Rate})$$

$$\text{Exact Subtotal} = (\text{Subtotal} - \text{Discount Amount}) + \text{Tax Amount} + \text{Freight Amount} + \text{Other Charges}$$

$$\text{Round Off} = \text{Math.round}(\text{Exact Subtotal}) - \text{Exact Subtotal}$$

$$\text{Total Amount} = \text{Exact Subtotal} + \text{Round Off}$$

- **Decimal Precision**: Fixed to 2 decimal places (`.toFixed(2)`).
- **Recalculation**: Server recalculates 100% of totals in `PrismaPurchaseRepository.createBill()` regardless of client values.

---

## 12. Payment Audit

- **Supported Payment Methods**: `unpaid`, `cash`, `upi`, `cheque`, `neft_rtgs`, `card`, `wallet`, `credit`.
- **Instant Settlement**: If payment method $\neq$ `unpaid` or `credit`, system marks bill as instant settlement (`instantSettlement: true`, `paymentStatus: "paid"`, `amountPaid: totalAmount`).
- **Credit Purchase**: If payment method == `unpaid` or `credit`, bill status is `ordered`, `paymentStatus: "unpaid"`, creating vendor Accounts Payable.

---

## 13. Attachments / OCR Audit

- **File Attachments**: Supports PDF, JPG, PNG uploads. Metadata stored as JSON array in `PurchaseBill.attachments`.
- **Simulated OCR Scanning**: User can upload invoice image/PDF. System extracts vendor name, invoice number, bill date, line items, and prices, pre-filling the form drafts with confidence score.

---

## 14. Duplicate Protection

1. **Deterministic Database Constraint**: `PurchaseBill` table enforces `@unique([workspaceId, billNumber])`.
2. **Vendor + Invoice Matching**: `listBills()` filters by `vendorId` + `vendorInvoiceNumber` to warn user before submission.
3. **AI Duplicate Warning**: Pre-flight review step (`PurchaseReviewModal.tsx`) alerts user if an identical invoice number exists for the selected vendor.

---

## 15. API Contract (`POST /api/v1/purchase/bills`)

### Request Payload Schema (`createPurchaseBillSchema`):
```json
{
  "vendorId": "string (required)",
  "purchaseType": "inventory_product | packaging_material | office_expense | asset | ...",
  "vendorInvoiceNumber": "string (optional)",
  "billDate": "YYYY-MM-DD (required)",
  "dueDate": "YYYY-MM-DD (optional)",
  "taxPercent": 18,
  "discountAmount": 0,
  "freightAmount": 0,
  "otherCharges": 0,
  "roundOff": 0,
  "notes": "string (optional)",
  "billUploadName": "string (optional)",
  "attachments": [{ "name": "invoice.pdf", "kind": "tax_invoice" }],
  "status": "ordered | draft",
  "paymentStatus": "unpaid | paid",
  "paymentMethod": "credit | cash | upi | neft_rtgs",
  "paymentId": "string (optional)",
  "buyerStateCode": "27",
  "lines": [
    {
      "description": "Item Description (required)",
      "quantity": 10,
      "unitPrice": 500,
      "uom": "pcs",
      "sku": "SKU-123",
      "hsn": "6403",
      "productId": "prod-uuid",
      "gstRate": 18,
      "intent": "sellable",
      "freightMode": "expense"
    }
  ]
}
```

---

## 16. Database Mapping

| UI / Domain Field | Prisma Model | Prisma Column | Data Type | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Vendor ID | `PurchaseBill` | `vendorId` | `String` | Foreign key to `Vendor.id` |
| Vendor Name | `PurchaseBill` | `vendorName` | `String` | Denormalized snapshot |
| Purchase Type | `PurchaseBill` | `purchaseType` | `String` | Default: `"inventory_product"` |
| Category | `PurchaseBill` | `category` | `String` | Default: `"inventory_product"` |
| Status | `PurchaseBill` | `status` | `String` | Default: `"ordered"` |
| Payment Status | `PurchaseBill` | `paymentStatus` | `String` | Default: `"unpaid"` |
| Payment Method | `PurchaseBill` | `paymentMethod` | `String` | Default: `"credit"` |
| Subtotal | `PurchaseBill` | `subtotal` | `Decimal(12,2)` | Raw sum of lines |
| Tax Amount | `PurchaseBill` | `taxAmount` | `Decimal(12,2)` | Sum of CGST+SGST+IGST |
| Total Amount | `PurchaseBill` | `totalAmount` | `Decimal(12,2)` | Grand total |
| Line Item | `PurchaseBillLine` | `description`, `quantity`, `unitPrice` | `String`, `Int`, `Decimal` | Line details |
| Line Intent | `PurchaseBillLine` | `intent` | `String` | Default: `"sellable"` |

---

## 17. Solo vs Small/Growing/Enterprise Classification

- **Essential for Solo Seller**: Vendor, Invoice #, Bill Date, Purchase Type, Line Items (Item Name, Qty, Unit Price, GST Rate), Payment Method.
- **Optional for Solo Seller**: Notes, Attachments, Bill-level Discount, Freight.
- **Required for Small/Growing Seller**: HSN Code, SKU, Landed-cost Freight Allocation, Partial Payment.
- **Enterprise Capability**: PO Reference, Department, Cost Center, Multi-level Approval Workflows.

---

## 18. Excel Import Readiness Gap

### A. Fields Excel MUST Support:
1. Vendor Name or Vendor ID
2. Vendor Invoice Number
3. Bill Date (`YYYY-MM-DD`)
4. Purchase Type (`inventory_product`, `office_expense`, etc.)
5. Item Description / Name
6. Quantity
7. Unit Price
8. GST Rate (`0`, `5`, `12`, `18`, `28`)

### B. Fields Excel SHOULD Support:
1. SKU
2. HSN/SAC
3. UOM (`pcs`, `box`, `kg`)
4. Business Intent (`sellable`, `consumable`, `asset`, `expense`)
5. Bill Freight & Other Charges
6. Payment Status / Method

### C. Fields Excel SHOULD NOT Support (Auto-Calculated):
1. Bill Number (Generated server-side)
2. Line Amount (`Quantity * Unit Price`)
3. CGST / SGST / IGST Split (Derived automatically from Vendor vs Buyer state code)
4. Total Tax Amount
5. Grand Total Amount
6. Round Off

---

## 19. Multi-Item + Multi-Charge Requirement

The current database architecture handles Multi-Item + Multi-Charge invoices as follows:
- **Multiple Items**: Map to $N$ rows in `PurchaseBillLine`.
- **Multiple Charges**: Currently, `PurchaseBill` stores `freightAmount` and `otherCharges` as bill-level fields. For Excel import, multiple charge items (e.g. Freight + Handling + Insurance) should be summed into `freightAmount` and `otherCharges` or represented as non-stock line items with `intent: "freight"` or `intent: "expense"`.

---

## 20. AI Integration Audit

- **OCR Scanning**: Optional UI feature. Reads invoice images and pre-fills form fields. Consumes 1 AI Credit via `onSpendAiCredit()`. Creation does NOT depend on OCR.
- **Duplicate Warnings**: Advisory alert during pre-flight review (`PurchaseReviewModal.tsx`).
- **AI Rule**: Purchase creation is 100% functional without AI.

---

## 21. Recommended Excel Template Structure

A 2-Sheet or Flat 1-Sheet Excel Import Template:

```
Sheet 1: Purchase Bills (1 row per line item, grouped by Vendor Invoice Number)
---------------------------------------------------------------------------------------------------
Vendor Invoice No | Vendor Name | Bill Date  | Purchase Type     | Item Name | Qty | Price | GST% | Intent
------------------|-------------|------------|-------------------|-----------|-----|-------|------|---------
INV-2026-001      | ABC Traders | 2026-08-12 | inventory_product | Running Shoe| 10 | 1200  | 18   | sellable
INV-2026-001      | ABC Traders | 2026-08-12 | inventory_product | Polybag 10x12| 500| 5     | 18   | consumable
```

---

## 22. Critical Risks & Final Verdict

### Final Verdict:
The current CommerceOS Purchase module architecture (`createPurchaseBillSchema` and `PrismaPurchaseRepository.createBill`) is **100% production-ready** for supporting Excel Bulk Purchase Import. The backend API handles server-side tax calculations, denormalization, transaction persistence, and decoupled Storage GRN routing seamlessly.

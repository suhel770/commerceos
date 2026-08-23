# Purchase Excel Final Specification

> [!IMPORTANT]
> **READ-ONLY DESIGN SPECIFICATION**
> This document specifies the exact representation of the CommerceOS Purchase Bill workflow in Excel. No code, database schemas, APIs, UI components, templates, or demo data have been modified.
> **Excel implementation is NOT authorized yet.**

---

## 1. Source of Truth

This specification is strictly derived from the completed, single-source-of-truth field audit document:
[`docs/commerceos/new_purchase_bill_field_audit.md`](file:///c:/Users/suhel/OneDrive/commerceos/docs/commerceos/new_purchase_bill_field_audit.md).

Every field mapping, lookup key, validation rule, tax calculation formula, payment resolution, and downstream workflow specified herein reflects the exact runtime execution path of the current CommerceOS Purchase system.

---

## 2. Workbook Architecture

To completely represent the New Purchase Bill workflow without data loss, the Excel workbook structure MUST consist of **3 Data Sheets + 1 Instruction Sheet**:

```mermaid
graph TD
    Sheet1["Sheet 1: Purchase Bills<br/>(Header fields, Vendor Code, Bill Date, Charges)"]
    Sheet2["Sheet 2: Purchase Items<br/>(Line items, Description, SKU, Quantity, Rate, GST %, Intent)"]
    Sheet3["Sheet 3: Charges<br/>(Itemized Freight & Other Charges)"]
    Sheet4["Sheet 4: Instructions<br/>(Allowed Enums & Vendor Code Reference)"]

    Sheet1 -- "1 : N (via Invoice Number)" --> Sheet2
    Sheet1 -- "1 : N (via Invoice Number)" --> Sheet3
```

### Sheet Breakdown Rationale
1. **Sheet 1 (`Purchase Bills`)**: Contains 1 row per purchase bill header (Vendor, Bill Date, Purchase Type, Payment Method, Aggregate Charges, Notes).
2. **Sheet 2 (`Purchase Items`)**: Contains 1 or more line item rows per bill linked via the `Invoice Number` key.
3. **Sheet 3 (`Charges`)**: Contains 0 or more itemized charge rows per bill linked via the `Invoice Number` key.
4. **Sheet 4 (`Instructions`)**: Reference documentation for operators listing allowed Purchase Types, Business Intents, UOMs, and active Vendor Codes.

---

## 3. Bill-Level Field Specification

Every one of the **27 bill-level fields** identified in the field audit is mapped below:

| UI Field | Internal Field | Excel Sheet | Excel Header | Required? | User Enters? | DB Lookup? | Calculated? | System Gen? | Validation | Example | Backend Destination |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Purchase Type** | `purchaseType` | `Purchase Bills` | `Purchase Type` | **Yes** | **Yes** | No | No | No | Must match 1 of 13 enum values | `inventory_product` | `PurchaseBill.purchaseType` |
| **Vendor** | `vendorId` | `Purchase Bills` | `Vendor Code` | **Yes** | **Yes** | **Yes** | No | No | Must exist in Vendor Master | `VEN-00000001` | `PurchaseBill.vendorId` |
| **Vendor Name** | `vendorName` | `Purchase Bills` | `Supplier Name` | Optional | **Yes** | No | No | No | Visual match verification | `Nova Footwear` | `PurchaseBill.vendorName` |
| **Vendor Invoice #** | `vendorInvoiceNumber` | `Purchase Bills` | `Vendor Invoice Number` | Optional | **Yes** | No | No | No | String (max 80) | `VEN-INV-9901` | `PurchaseBill.vendorInvoiceNumber` |
| **Bill Date** | `billDate` | `Purchase Bills` | `Invoice Date` | **Yes** | **Yes** | No | No | No | Format `YYYY-MM-DD` | `2026-08-12` | `PurchaseBill.billDate` |
| **Due Date** | `dueDate` | `Purchase Bills` | `Due Date` | Optional | **Yes** | No | **Yes** | No | Format `YYYY-MM-DD` | `2026-09-11` | `PurchaseBill.dueDate` |
| **Document Mode** | `docMode` | N/A | N/A | N/A | No | No | No | No | UI visual tab toggle only | `direct_bill` | N/A |
| **Bill Upload File** | `billUploadName` | `Purchase Bills` | `Bill Upload Name` | Optional | **Yes** | No | No | No | String (filename) | `tax-invoice-july.pdf` | `PurchaseBill.billUploadName` |
| **Attachments** | `attachments` | N/A | N/A | N/A | No | No | No | No | Array of objects | N/A | `PurchaseBill.attachments` |
| **Status** | `status` | `Purchase Bills` | `Status` | Optional | **Yes** | No | **Yes** | No | `draft`, `ordered`, `completed` | `ordered` | `PurchaseBill.status` |
| **Payment Method** | `paymentMethod` | `Purchase Bills` | `Payment Method` | Optional | **Yes** | No | No | No | 8 Payment Method Enums | `credit` | `PurchaseBill.paymentMethod` |
| **Payment Ref** | `paymentId` | `Purchase Bills` | `Payment ID` | Optional | **Yes** | No | No | No | String (max 100) | `UTR-990182` | `PurchaseBill.paymentId` |
| **PO Reference #** | `poReference` | `Purchase Bills` | `PO Reference` | Optional | **Yes** | **Yes** | No | No | String (max 80) | `PO-2026-88` | `PurchaseBill.poReference` |
| **Department** | `department` | `Purchase Bills` | `Department` | Optional | **Yes** | No | No | No | String (max 80) | `Procurement` | `PurchaseBill.department` |
| **Cost Center** | `costCenter` | `Purchase Bills` | `Cost Center` | Optional | **Yes** | No | No | No | String (max 80) | `CC-101` | `PurchaseBill.costCenter` |
| **Notes** | `notes` | `Purchase Bills` | `Notes` | Optional | **Yes** | No | No | No | String (max 500) | `Bulk batch purchase` | `PurchaseBill.notes` |
| **Discount (₹)** | `discountAmount` | `Purchase Bills` | `Discount Amount` | Optional | **Yes** | No | No | No | $\ge 0$ | `100` | `PurchaseBill.discountAmount` |
| **Freight (₹)** | `freightAmount` | `Purchase Bills` | `Freight Amount` | Optional | **Yes** | No | **Yes** | No | Summed from Sheet 3 | `250` | `PurchaseBill.freightAmount` |
| **Landed Cost Flag** | `allocateFreightToLandedCost` | `Purchase Bills` | `Allocate Freight To Landed Cost` | Optional | **Yes** | No | No | No | `Yes` / `No` | `Yes` | Line `freightMode` |
| **Other Charges (₹)** | `otherCharges` | `Purchase Bills` | `Other Charges` | Optional | **Yes** | No | **Yes** | No | Summed from Sheet 3 | `50` | `PurchaseBill.otherCharges` |
| **Round Off (₹)** | `roundOff` | N/A | N/A | N/A | **NO** | No | **Yes** | No | Derived exact rounding | `0.12` | `PurchaseBill.roundOff` |
| **Buyer State Code** | `buyerStateCode` | N/A | N/A | N/A | **NO** | **Yes** | No | No | Business Profile state | `"27"` | `PurchaseBill.buyerStateCode` |
| **Approval ID** | `approvalId` | `Purchase Bills` | `Approval ID` | Optional | **Yes** | **Yes** | No | No | UUID | `app-0012` | Approval lookup |
| **Owner Override** | `ownerOverride` | N/A | N/A | N/A | **NO** | No | No | No | Role-based check | `false` | N/A |
| **Bill ID** | `id` | N/A | N/A | N/A | **NO** | No | No | **Yes** | Primary key | `bill-99a0` | `PurchaseBill.id` |
| **Bill Number** | `billNumber` | N/A | N/A | N/A | **NO** | No | No | **Yes** | System code | `BILL-1001` | `PurchaseBill.billNumber` |
| **Is Deleted** | `isDeleted` | N/A | N/A | N/A | **NO** | No | No | **Yes** | Soft delete flag | `false` | `PurchaseBill.isDeleted` |

---

## 4. Line-Level Field Specification

All **18 line-level fields** mapped for Sheet 2 (`Purchase Items`):

| UI Field | Internal Field | Excel Sheet | Excel Header | Required? | User Enters? | DB Lookup? | Calculated? | System Gen? | Validation | Example | Backend Destination |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Linking Key** | `invoiceNumber` | `Purchase Items` | `Invoice Number` | **Yes** | **Yes** | No | No | No | Matches Sheet 1 | `INV-2026-101` | Bill linkage |
| **Line Number** | `lineNumber` | `Purchase Items` | `Line Number` | Optional | **Yes** | No | No | No | Integer $\ge 1$ | `1` | Ordering |
| **Item Name** | `description` | `Purchase Items` | `Description` | **Yes** | **Yes** | No | No | No | String (1-200) | `Dino Clog - Kids Blue` | `PurchaseBillLine.description` |
| **SKU** | `sku` | `Purchase Items` | `SKU` | Optional | **Yes** | **Yes** | No | No | String (max 80) | `SKU-DINO-CLOG-BLU` | `PurchaseBillLine.sku` |
| **HSN** | `hsn` | `Purchase Items` | `HSN` | Optional | **Yes** | No | No | No | String (max 16) | `6403` | `PurchaseBillLine.hsn` |
| **Product Link** | `productId` | N/A | N/A | N/A | **NO** | **Yes** | No | No | Product UUID | `prod-8812` | `PurchaseBillLine.productId` |
| **Quantity** | `quantity` | `Purchase Items` | `Quantity` | **Yes** | **Yes** | No | No | No | Number $> 0$ | `50` | `PurchaseBillLine.quantity` |
| **UOM** | `uom` | `Purchase Items` | `UOM` | Optional | **Yes** | No | No | No | 7 UOM options | `pcs` | `PurchaseBillLine.uom` |
| **Unit Price** | `unitPrice` | `Purchase Items` | `Unit Price` | **Yes** | **Yes** | No | No | No | Number $\ge 0$ | `250` | `PurchaseBillLine.unitPrice` |
| **GST %** | `gstRate` | `Purchase Items` | `GST Rate` | Optional | **Yes** | No | No | No | `0, 5, 12, 18, 28` | `18` | `PurchaseBillLine.gstRate` |
| **Intent** | `intent` | `Purchase Items` | `Intent` | **Yes** | **Yes** | No | No | No | 8 Intent Enums | `sellable` | `PurchaseBillLine.intent` |
| **Freight Mode** | `freightMode` | N/A | N/A | N/A | **NO** | No | **Yes** | No | `expense`, `landed_cost` | `landed_cost` | `PurchaseBillLine.freightMode` |
| **Line Amount** | `amount` | N/A | N/A | N/A | **NO** | No | **Yes** | No | `qty * price` | `12500` | `PurchaseBillLine.amount` |
| **CGST Amount** | `cgstAmount` | N/A | N/A | N/A | **NO** | No | **Yes** | No | Intrastate split | `1125` | `PurchaseBillLine.cgstAmount` |
| **SGST Amount** | `sgstAmount` | N/A | N/A | N/A | **NO** | No | **Yes** | No | Intrastate split | `1125` | `PurchaseBillLine.sgstAmount` |
| **IGST Amount** | `igstAmount` | N/A | N/A | N/A | **NO** | No | **Yes** | No | Interstate split | `0` | `PurchaseBillLine.igstAmount` |
| **Tax Amount** | `taxAmount` | N/A | N/A | N/A | **NO** | No | **Yes** | No | Sum of GST | `2250` | `PurchaseBillLine.taxAmount` |
| **Line ID** | `id` | N/A | N/A | N/A | **NO** | No | No | **Yes** | Primary key | `line-001` | `PurchaseBillLine.id` |

---

## 5. Charge Specification

All **4 charge fields** mapped below:

1. **`discountAmount`**: Specified on Sheet 1 (`Purchase Bills`). Deducted prior to tax calculations.
2. **`freightAmount`**: Specified directly on Sheet 1 **OR** calculated as the sum of all `freight` rows on Sheet 3 (`Charges`) for that `Invoice Number`.
3. **`allocateFreightToLandedCost`**: Specified on Sheet 1 (`Yes`/`No`) **OR** on Sheet 3 per charge line. Automatically sets `freightMode = "landed_cost"` on sellable item lines.
4. **`otherCharges`**: Specified directly on Sheet 1 **OR** calculated as the sum of all `other` / non-freight rows on Sheet 3 (`Charges`).

---

## 6. Payment Specification

All **6 payment fields** mapped below:

- **User Enters in Excel**: `Payment Method` (e.g., `credit`, `upi`, `cash`, `neft_rtgs`) and `Payment ID` (Txn/UTR reference).
- **Backend Resolves**:
  - Immediate paid methods (`cash`, `upi`, `neft_rtgs`, `card`, `wallet`, `cheque`) $\implies$ `paymentStatus = "paid"`, `amountPaid = totalAmount`, `status = "completed"`.
  - Deferred methods (`unpaid`, `credit`) $\implies$ `paymentStatus = "unpaid"`, `amountPaid = 0`, `status = "ordered"`.
- **Payment Sheet Evaluation**: A separate `Payments` sheet is **NOT required** for New Bill Entry. Payment is represented at the bill level during creation. Partial payments after creation are managed via the dedicated Payment Action API.

---

## 7. Attachment Specification

All **3 attachment fields** evaluated:

1. `billUploadName`: Supported in Excel via string filename (e.g., `tax-invoice-july.pdf`).
2. `attachments` array: Supported in Excel via string filename mapping.
3. **Binary File Upload**: **NOT SUPPORTED BY EXCEL IMPORT**. Physical PDF/image binaries cannot be embedded in Excel cells. Files must be placed in workspace storage or scanned via AI drawer.

---

## 8. Vendor Mapping

- **Authoritative Lookup Key**: **`Vendor Code`** (e.g., `VEN-00000001`).
- **Secondary Verification Key**: `Supplier Name`. If `Vendor Code` is provided, it takes precedence. If missing, `Supplier Name` is looked up in Vendor Master.
- **Vendor Status Enforcement**:
  - `ACTIVE`: Allowed.
  - `BLOCKED`: Rejected with error `"Vendor [Name] is BLOCKED by Owner"` unless `Approval ID` is provided.
  - `INACTIVE`: Rejected with error `"Vendor [Name] is INACTIVE"`.

---

## 9. Product / SKU Mapping

- **Authoritative Business Identifier**: **`SKU`** (e.g., `SKU-DINO-CLOG-BLU`).
- **Product ID Resolution**: Looked up in Master Product Catalog (`Product` table) via `workspaceId_sku`. If found, `productId` is automatically linked. If not found, line is treated as an ad-hoc catalog description.

---

## 10. Calculated Fields

All **17 calculated fields** must NOT be entered by users in Excel:

| Field Name | Why Calculated | Allowed as Excel Input? | Calculation Source | When Calculated | Stored Location |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Line `amount` | Product of qty and rate | **NO** | `quantity * unitPrice` | During validation | `PurchaseBillLine.amount` |
| Line Taxable Value | Discount deduction | **NO** | `amount * (1 - discRatio)` | During validation | In-memory |
| Line `cgstAmount` | 50% GST split | **NO** | `splitGst()` engine | During validation | `PurchaseBillLine.cgstAmount` |
| Line `sgstAmount` | 50% GST split | **NO** | `splitGst()` engine | During validation | `PurchaseBillLine.sgstAmount` |
| Line `igstAmount` | 100% GST split | **NO** | `splitGst()` engine | During validation | `PurchaseBillLine.igstAmount` |
| Line `taxAmount` | Sum of line GST | **NO** | `cgst + sgst + igst` | During validation | `PurchaseBillLine.taxAmount` |
| Line `freightMode` | Landed cost rule | **NO** | `allocateFreightToLandedCost` | During validation | `PurchaseBillLine.freightMode` |
| Line `qcStatus` | QC requirement | **NO** | Intent check | During validation | `PurchaseBillLine.qcStatus` |
| Bill `subtotal` | Sum of line amounts | **NO** | $\sum \text{line amounts}$ | During validation | `PurchaseBill.subtotal` |
| Bill `cgstAmount` | Sum of line CGST | **NO** | $\sum \text{line CGST}$ | During validation | `PurchaseBill.cgstAmount` |
| Bill `sgstAmount` | Sum of line SGST | **NO** | $\sum \text{line SGST}$ | During validation | `PurchaseBill.sgstAmount` |
| Bill `igstAmount` | Sum of line IGST | **NO** | $\sum \text{line IGST}$ | During validation | `PurchaseBill.igstAmount` |
| Bill `taxAmount` | Sum of all GST | **NO** | $\sum \text{line taxAmount}$ | During validation | `PurchaseBill.taxAmount` |
| Bill `taxPercent` | Weighted average % | **NO** | `(taxAmount / subtotal) * 100` | During validation | `PurchaseBill.taxPercent` |
| Bill `roundOff` | Rounding to integer | **NO** | `Math.round(total) - total` | During validation | `PurchaseBill.roundOff` |
| Bill `totalAmount` | Net grand total | **NO** | `taxable + tax + freight + other` | During validation | `PurchaseBill.totalAmount` |
| Bill `amountPaid` | Settled payment sum | **NO** | Payment Method resolution | During validation | `PurchaseBill.amountPaid` |

---

## 11. Database Lookup Fields

All **6 database lookup fields**:

| Excel Column | Lookup Table | Lookup Key | Resolved Property | Validation | Failure Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Vendor Code` | `Vendor` | `code` or `id` | `vendorId` | Must exist in workspace | Row validation error |
| `SKU` | `Product` | `sku` | `productId` | Optional match | Unlinked line (ad-hoc) |
| N/A | `BusinessProfile` | `workspaceId` | `buyerStateCode` | Default `"27"` | Fallback to default |
| N/A | `Vendor` | `vendorId` | Vendor GSTIN | State Code | Determine Interstate |
| `PO Reference` | `PurchaseOrder` | `poNumber` | `poReference` | Optional match | Stored as text string |
| `Approval ID` | `VendorApproval` | `id` | `approvalId` | Single-use approved | Vendor block error |

---

## 12. System Generated Fields

All **9 system-generated fields**:

1. `PurchaseBill.id`: Generated by server (`bill-${uuid}`).
2. `PurchaseBill.billNumber`: Generated by server sequential counter (`BILL-1001`).
3. `PurchaseBill.createdAt`: Generated by database (`now()`).
4. `PurchaseBill.updatedAt`: Generated by database (`now()`).
5. `PurchaseBill.createdBy`: Populated from actor session (`context.actor.name`).
6. `PurchaseBill.createdByName`: Populated from actor session.
7. `PurchaseBill.isDeleted`: Default `false`.
8. `PurchaseBillLine.id`: Generated by server (`line-${uuid}`).
9. `PurchaseAttachment.id`: Generated by server (`att-${uuid}`).

---

## 13. Required vs Optional Fields

### Required Excel Input Fields (Must Be Non-Empty)
1. `Sheet 1`: `Invoice Number`
2. `Sheet 1`: `Vendor Code` (or `Supplier Name`)
3. `Sheet 1`: `Invoice Date`
4. `Sheet 1`: `Purchase Type`
5. `Sheet 2`: `Invoice Number`
6. `Sheet 2`: `Description`
7. `Sheet 2`: `Quantity`
8. `Sheet 2`: `Unit Price`
9. `Sheet 2`: `Intent`

### Optional Excel Input Fields
`Vendor Invoice Number`, `Due Date`, `Payment Method`, `Payment ID`, `PO Reference`, `Department`, `Cost Center`, `Discount Amount`, `Freight Amount`, `Allocate Freight To Landed Cost`, `Other Charges`, `Notes`, `Bill Upload Name`, `SKU`, `HSN`, `UOM`, `GST Rate`.

### Prohibited Input Fields (Never Columns in Excel)
`billNumber`, `subtotal`, `cgstAmount`, `sgstAmount`, `igstAmount`, `taxAmount`, `taxPercent`, `roundOff`, `totalAmount`, `amountPaid`, Line `amount`, Line `cgstAmount`, Line `sgstAmount`, Line `igstAmount`, Line `taxAmount`, `buyerStateCode`, `interstate`.

---

## 14. Validation Rules

- **Invoice Number**: Non-empty string; unique per invoice in Sheet 1.
- **Vendor Code**: Non-empty string; must exist in active Vendor master.
- **Invoice Date**: String in `YYYY-MM-DD` format.
- **Purchase Type**: Must be 1 of 13 valid enum values.
- **Quantity**: Finite number $> 0$.
- **Unit Price**: Finite number $\ge 0$.
- **GST Rate**: Must be numeric slab (`0`, `5`, `12`, `18`, `28`).
- **Intent**: Must be 1 of 8 valid intent enums.

---

## 15. Multi-Item Invoice

A single purchase bill with multiple items is represented across sheets via `Invoice Number`:

```
Sheet 1 (Purchase Bills):
Invoice Number | Vendor Code | Invoice Date | Purchase Type
INV-2026-101   | VEN-00001   | 2026-08-12   | inventory_product

Sheet 2 (Purchase Items):
Invoice Number | Line Number | Description                   | Quantity | Unit Price | GST Rate | Intent
INV-2026-101   | 1           | Dino Clog - Kids Blue Size 5  | 50       | 250        | 18       | sellable
INV-2026-101   | 2           | Dino Clog - Kids Red Size 6   | 50       | 260        | 18       | sellable
```

The importer groups all lines with `Invoice Number = "INV-2026-101"` into a single `CreatePurchaseBillInput` payload.

---

## 16. Multi-Charge Invoice

Multiple itemized charges are linked via `Invoice Number` on Sheet 3 (`Charges`):

```
Sheet 3 (Charges):
Invoice Number | Charge Type | Amount | Landed Cost Allocation | Notes
INV-2026-101   | freight     | 250    | Yes                    | Express Courier
INV-2026-101   | other       | 50     | No                     | Unloading Fee
```

The importer aggregates freight charges into `freightAmount` and non-freight charges into `otherCharges`.

---

## 17. Multiple Invoices

A single Excel file can contain dozens of distinct invoices. Each unique `Invoice Number` on Sheet 1 creates a separate, independent `PurchaseBill` transaction in CommerceOS.

---

## 18. Excel → Purchase Workflow

```mermaid
graph TD
    File[Upload Excel File .xls / .xml / .csv] --> Parse[Parse Worksheets & Extract 2D Arrays]
    Parse --> Validate[Validate Columns & Enums against createPurchaseBillSchema]
    Validate --> Lookup[Execute Database Lookups: Vendor Code & SKU]
    Lookup --> Calculate[Execute GST Engine & Calculate Totals]
    Calculate --> Preview[Render Interactive Import Preview & Row Error List]
    Preview --> UserConfirm{User Confirms Import}
    UserConfirm -- Yes --> Tx[Execute Atomic DB Transaction via PurchaseService.createBill]
    Tx --> Downstream[Trigger Finance AP & Storage Pending GRN]
```

---

## 19. Final Excel Template Structure

### Sheet 1: `Purchase Bills`
Headers: `Vendor Code`, `Supplier Name`, `Invoice Number`, `Invoice Date`, `Purchase Type`, `Vendor Invoice Number`, `Due Date`, `Payment Method`, `Payment ID`, `PO Reference`, `Department`, `Cost Center`, `Discount Amount`, `Freight Amount`, `Allocate Freight To Landed Cost`, `Other Charges`, `Notes`

### Sheet 2: `Purchase Items`
Headers: `Invoice Number`, `Line Number`, `Description`, `SKU`, `HSN`, `Quantity`, `UOM`, `Unit Price`, `GST Rate`, `Intent`

### Sheet 3: `Charges`
Headers: `Invoice Number`, `Charge Type`, `Amount`, `Landed Cost Allocation`, `Notes`

### Sheet 4: `Instructions`
Headers: `Field`, `Required`, `Allowed Values / Instruction`

---

## 20. Demo Workbook Structure

The sample demo template must include instructional rows demonstrating:
1. **Row 1**: Multi-item inventory bill (`inventory_product`, `sellable` intent, landed cost freight allocation).
2. **Row 2**: Packaging materials bill (`packaging_material`, `consumable` intent, UPI payment).
3. **Row 3**: Capital asset bill (`asset`, `asset` intent).

---

## 21. Error Handling

Errors must be presented in an interactive preview table before any database writes occur:

| Sheet | Row | Invoice Number | Field | Problem | Severity | Suggested Fix |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Purchase Bills` | 2 | `INV-101` | `Vendor Code` | Vendor `VEN-99` not found | **ERROR** | Verify Vendor Code in Vendor Directory |
| `Purchase Items` | 5 | `INV-102` | `Quantity` | Invalid quantity `0` | **ERROR** | Enter quantity $> 0$ |

---

## 22. Atomic Transaction

- **Validation Phase**: The entire Excel file is validated in-memory first.
- **Preview Phase**: If errors exist, database writes are blocked and the user is shown exact row/field fixes.
- **Commit Phase**: Once valid, bills are committed inside an atomic database transaction (`db.$transaction`). If any bill creation fails, all changes are rolled back.

---

## 23. Design Protection Verification

- **Purchase UI**: **UNCHANGED**
- **New Bill Entry Workflow**: **UNCHANGED**
- **Finance Ledger & AP**: **UNCHANGED**
- **Storage & GRN Receiving**: **UNCHANGED**
- **Inventory Decoupling**: **UNCHANGED**
- **Vendor Master & RBAC Rules**: **UNCHANGED**

Excel Import serves strictly as an alternative **bulk input interface** feeding into the exact same existing `PurchaseApplication.createBill()` service layer.

---

## 24. Open Questions

- **None**. All field mapping, validation schemas, GST split calculations, and repository behavior are 100% accounted for by the field audit.

---

## 25. Final Implementation Checklist

- [x] Field Audit completed (`new_purchase_bill_field_audit.md`)
- [x] Design Specification completed (`purchase_excel_final_spec.md`)
- [ ] Await User Review & Authorization before writing Excel Importer code

---

> [!CAUTION]
> **Excel implementation is NOT authorized yet.**

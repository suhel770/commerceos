# CommerceOS Purchase Excel Bulk Import Documentation

> [!NOTE]
> **PRODUCTION IMPLEMENTATION REPORT**
> This document summarizes the completed implementation of the **CommerceOS Purchase Excel Bulk Importer Engine**, Template Generator, Demo Workbook, UI Preview Dialog, and Validation Pipeline.

---

## 1. Final XLSX Format

The official CommerceOS Purchase import and export engine produces and accepts genuine **OpenXML `.xlsx` Workbooks** (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).

- Built using the standard Node.js `xlsx` engine.
- Fully compatible with Microsoft Excel, Google Sheets, LibreOffice Calc, and Apple Numbers.
- Legacy `.csv` is retained as a secondary single-sheet import format option.

---

## 2. Workbook Architecture

The official Purchase Import `.xlsx` workbook consists of **4 Sheets**:

1. **`Purchase Bills`** (Sheet 1): 1 row per purchase bill header (Vendor Code, Supplier Name, Invoice Number, Invoice Date, Purchase Type, Payment Method, PO Reference, Department, Cost Center, Discounts, Aggregate Charges, Notes).
2. **`Purchase Items`** (Sheet 2): Line items linked to Sheet 1 via `Invoice Number` (Description, SKU, HSN, Quantity, UOM, Unit Price, GST Rate, Business Intent).
3. **`Charges`** (Sheet 3): Itemized shipping, freight, and handling charges linked via `Invoice Number` (Charge Type, Amount, Landed Cost Allocation, Notes).
4. **`Instructions`** (Sheet 4): Operator reference guide outlining all required/optional fields, enum values, and validation rules.

---

## 3. Field Mapping Summary

- **Bill-Level Fields (27 Total)**:
  - User Entered: `purchaseType`, `vendorInvoiceNumber`, `billDate`, `dueDate`, `paymentMethod`, `paymentId`, `poReference`, `department`, `costCenter`, `discountAmount`, `freightAmount`, `allocateFreightToLandedCost`, `otherCharges`, `notes`, `billUploadName`.
  - Database Lookups: `vendorId` (via `Vendor Code`), `buyerStateCode` (via Business Profile).
  - Backend Calculated: Subtotal, CGST, SGST, IGST, Tax Amount, Tax Percent, Round Off, Total Amount, Amount Paid.
  - System Generated: `id`, `billNumber` (`BILL-XXXX`), `createdAt`, `updatedAt`, `createdBy`, `createdByName`, `isDeleted`.

- **Line-Level Fields (18 Total)**:
  - User Entered: `invoiceNumber` (linking key), `description`, `quantity`, `uom`, `unitPrice`, `gstRate`, `intent`, `sku`, `hsn`.
  - Database Lookups: `productId` (via `SKU`).
  - Backend Calculated: Line `amount`, Line `cgstAmount`, Line `sgstAmount`, Line `igstAmount`, Line `taxAmount`, Line `freightMode`, Line `qcStatus`.
  - System Generated: Line `id`.

---

## 4. Vendor Mapping & Security Enforcement

- **Authoritative Key**: **`Vendor Code`** (e.g. `VEN-00000001`).
- **Informational Key**: `Supplier Name` (used for secondary visual verification).
- **Security Enforcement**:
  - `ACTIVE`: Purchase Bill creation proceeds.
  - `BLOCKED`: Bill creation is rejected with error `"Vendor VEN-00000001 (Nova Footwear) is BLOCKED by Owner. Purchase Bill cannot be imported."`
  - `INACTIVE`: Bill creation is rejected with error `"Vendor VEN-00000001 (Nova Footwear) is INACTIVE."`
  - Unknown Vendor Code $\implies$ Rejected with validation error.

---

## 5. Master Product / SKU Mapping

- **Master Catalog Identifier**: **`SKU`** (e.g. `SKU-DINO-CLOG-BLU`).
- **Product ID Linking**: The importer looks up the SKU in the active workspace catalog and links `productId`. If omitted, the item is created as an ad-hoc catalog line. If an unknown SKU is provided when catalog products are loaded, an explicit validation error is reported.

---

## 6. Backend Calculation Engine Integration

The importer reuses the exact CommerceOS Purchase calculation engine:
- **GST Engine**: Auto-detects Intrastate (CGST + SGST 50/50) vs Interstate (IGST 100%) by comparing Vendor GSTIN state code with Buyer State Code.
- **Trade Discount**: Proportional discount deduction before tax calculation.
- **Rounding**: Auto-calculates integer `roundOff`.

---

## 7. Pre-Commit Preview & Validation Pipeline

1. Upload `.xlsx` file.
2. In-memory parsing & header normalization.
3. Vendor Code & Product SKU database lookups.
4. Schema & data type validation.
5. Calculated totals & tax split derivation.
6. Display interactive preview modal (Invoice Summary, Line Items, Charges, and Row-Level Validation Errors).
7. User confirms import $\implies$ Atomic database transaction.

---

## 8. Atomic Transaction Guarantee

All purchase bill imports execute inside an atomic database transaction (`db.$transaction`). If any row or invoice fails validation or database execution, **0 invoices are committed**.

---

## 9. Demo Workbook

An official separate demo workbook function `buildOfficialPurchaseImportDemoXlsx()` generates `commerceos-purchase-bulk-import-demo.xlsx` containing sample instructional invoices and multi-charge rows. Demo data is strictly instructional and never inserted into production database automatically.

---

## 10. Generated Files & Code Assets

- **Engine & Importer**: [`lib/purchase/excel-importer.ts`](file:///c:/Users/suhel/OneDrive/commerceos/lib/purchase/excel-importer.ts)
- **Server Execution**: [`lib/purchase/excel-importer.server.ts`](file:///c:/Users/suhel/OneDrive/commerceos/lib/purchase/excel-importer.server.ts)
- **Export & Template Generator**: [`lib/purchase/export.ts`](file:///c:/Users/suhel/OneDrive/commerceos/lib/purchase/export.ts)
- **Import UI Dialog**: [`components/purchase/ImportPurchasesDialog.tsx`](file:///c:/Users/suhel/OneDrive/commerceos/components/purchase/ImportPurchasesDialog.tsx)
- **Bulk Import API Route**: [`app/api/v1/purchase/bills/bulk-import/route.ts`](file:///c:/Users/suhel/OneDrive/commerceos/app/api/v1/purchase/bills/bulk-import/route.ts)
- **Unit Test Suite**: [`lib/purchase/excel-import.test.ts`](file:///c:/Users/suhel/OneDrive/commerceos/lib/purchase/excel-import.test.ts)

---

## 11. Test & Build Results

- **Unit Tests**: `lib/purchase/excel-import.test.ts` (5/5 PASSED)
- **Vendor Identity Tests**: `lib/purchase/vendor-identity.test.ts` (7/7 PASSED)

---

## 12. Mandatory System Statements

- **Purchase design changes: NONE**
- **Purchase business workflow changes: NONE**
- **Finance workflow changes: NONE**
- **Storage workflow changes: NONE**
- **Inventory workflow changes: NONE**
- **Vendor business rules changes: NONE**
- **Excel is only an alternate Purchase input method.**

# CommerceOS — Unified Vendor Identity Architecture

> **Document Status**: Production Architecture & Engineering Bible Chapter  
> **Target Path**: `docs/commerceos/vendor_identity_architecture.md`  
> **Core Principle**: ONE Vendor Identity System across Vendor Master, Purchase, Finance, Reports & Excel Import.

---

## 1. Executive Summary

CommerceOS enforces a unified, dual-layer Vendor identity strategy across all modules:
1. **Technical Vendor ID (`Vendor.id`)**: Permanent database UUID/CUID used as foreign key relations (`PurchaseBill.vendorId`).
2. **Human-Readable Vendor Code (`Vendor.code` / `getVendorCode()`)**: Server-generated, permanent, unique, tenant-scoped code (e.g. `VEN-00000001`, `VEN-00000002`).

### Key Invariants:
- **Vendor Code is Authoritative for Humans & Excel**: Vendor Code is used across UI displays, search, Excel bulk import, reports, and external integrations.
- **Server-Generated & Tenant-Scoped**: Vendor Codes are generated server-side upon vendor creation and enforced uniquely within each tenant organization.
- **Name Mismatch Protection**: Vendor Name is used for visual verification. If an Excel import specifies a matching `Vendor Code` but a slightly different `Vendor Name`, the system logs a warning and uses the authoritative database Vendor record without creating duplicate vendors.

---

## 2. Dual-Layer Identity Model

```
┌────────────────────────────────────────────────────────────────────────┐
│                          COMMERCEOS VENDOR                             │
├───────────────────────────────────┬────────────────────────────────────┤
│ Technical Database ID             │ Permanent Vendor Code              │
│ (UUID / CUID e.g. ven-nova-01)    │ (e.g. VEN-00000001)                │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Primary key in DB               │ • Authoritative for UI & Excel     │
│ • Database relations (FK)         │ • Server-generated & Tenant-scoped │
│ • Internal API payloads           │ • Human search & verification      │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 3. Module Integration Workflow

### 3.1 Vendor Master
- When a user creates a new Vendor in Vendor Master, the server automatically assigns a sequential, permanent Vendor Code (`VEN-00000001`, `VEN-00000002`, ...).
- Users never manually type or edit the Vendor Code.

### 3.2 Purchase Module & UI
- When selecting a vendor in **New Purchase Bill**, the dropdown displays `Vendor Name (Vendor Code)` (e.g., `Nova Footwear Industries (VEN-00000001)`).
- The underlying database transaction persists `PurchaseBill.vendorId = "ven-00000001"`.

### 3.3 Purchase Excel Bulk Import
- **Sheet 1: `Purchase Bills`** contains `Vendor Code` (REQUIRED) and `Supplier Name` (OPTIONAL / VERIFICATION).
- The importer resolves the vendor by `Vendor Code` within the authenticated organization:
  - If `Vendor Code` is valid $\implies$ Attaches corresponding technical `vendorId`.
  - If `Vendor Code` is valid but `Supplier Name` differs $\implies$ Logs warning `"Vendor Code 'VEN-00000001' matches 'Nova Footwear' in database, but Excel specified 'Nova Footwear Pvt Ltd'. Vendor Code remains authoritative."`
  - If `Vendor Code` is unknown $\implies$ Returns validation error, 0 bills created.

---

## 4. Migration & Compatibility Policy

1. **Existing Purchase Bills**: All historical Purchase Bills remain 100% intact with their existing database `vendorId` foreign keys.
2. **Legacy Vendors**: If a legacy vendor record lacks an explicit `code` property, `getVendorCode(vendor)` generates a deterministic `VEN-XXXXXXXX` fallback code, ensuring zero broken UI references.
3. **No Demo Vendor Seeding**: Fake/demo vendor records are never inserted automatically into production databases.

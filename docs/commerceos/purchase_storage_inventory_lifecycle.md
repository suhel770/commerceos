# CommerceOS — Purchase → Storage → Inventory → Consumption Lifecycle

*Specification Version: 1.0*  
*Authoritative Documentation for Physical and Operational Stock Depletion*

---

## 1. Canonical Stock Lifecycle Overview

In CommerceOS, inventory follows a strictly auditable physical flow:

```
PURCHASE BILL (Procurement Intent)
      ↓
PENDING RECEIPT IN STORAGE (Unreceived Stock)
      ↓
STORAGE RECEIVING / INWARDING (Physical Goods Acceptance)
      ↓
ACCEPTED STORAGE STOCK (Putaway by Location/Bin)
      ↓
INVENTORY AVAILABLE STOCK (Live Available for Sale or Use)
      ↓
STOCK CONSUMPTION / ORDER FULFILLMENT (Usage / Dispatch)
      ↓
INVENTORY AVAILABLE DECREASES & STORAGE ACCEPTED DECREASES
      ↓
IMMUTABLE USAGE / CONSUMPTION AUDIT TRAIL ("Where Was It Used?")
```

> [!IMPORTANT]
> **Core Principle: Purchased ≠ Available**  
> Creating or approving a Purchase Bill establishes procurement commitment, but does **NOT** increase Available Inventory. Stock becomes Available **ONLY** after Storage Receiving verifies, accepts, and puts away the physical goods.

---

## 2. Intent-Based Purchase Classification

| Purchase Intent / Category | Storage Receiving Action | Inventory Impact |
|---|---|---|
| `sellable` (Inventory Products) | Appears in Storage Pending Inflow | Becomes Available after Storage Receiving |
| `consumable` (Packaging / Supplies) | Appears in Storage Pending Inflow | Becomes Consumable Available after Receiving |
| `capital_asset` (Laptops, Machinery) | Bypasses Storage Physical Receiving | Recorded directly in Finance / Fixed Assets |
| `expense` / `service` / `freight` | Bypasses Storage Physical Receiving | Recorded directly in Finance P&L |

---

## 3. Storage Receiving & Partial Acceptance

When physical goods arrive at a Storage Location:
- **Expected Quantity** = Ordered Quantity on Bill Line.
- **Accepted Quantity** = Undamaged items accepted for putaway.
- **Damaged (QC)** = Items flagged during inwarding QC hold.
- **Rejected** = Returned to supplier.

```
Pending Quantity = Purchase Quantity - (Accepted + Damaged + Rejected)
```

- **Partial Receiving:** If only 60 of 100 units arrive, Pending remains 40. Available increases by 60. When the remaining 40 arrive, Pending becomes 0 and Available becomes 100.

---

## 4. Stock Consumption & "Where Was It Used?"

When stock is consumed (e.g., shipping polybags, packing tape, internal samples, or order fulfillment):
1. **Validation:** Quantity must be `> 0` and `<= Available Stock` (prevents negative stock).
2. **Synchronized Depletion:**
   - **Inventory Available** decreases by consumed quantity.
   - **Storage Accepted Stock** decreases by consumed quantity.
   - **Used / Consumed** metric increases.
3. **Immutable Audit Record:**
   - **What:** SKU & Product Name
   - **How Much:** Exact units consumed (`-150 units`)
   - **Why:** Consumption Reason (`Order Packaging`, `Internal Operations`, `Production`, `Sample`, `Damaged/Write-off`, `Manual Consumption`, `Other`)
   - **Where:** Storage Location / Facility & Bin
   - **Reference:** Order ID (`Order #ORD-10234`), Task ID, or Audit Note
   - **Who:** User / Actor Name
   - **When:** ISO timestamp

---

## 5. Stock Reconciliation Formula

For every SKU across the system:

$$\text{On Hand} = \text{Total Received} - \text{Sold} - \text{Consumed} - \text{Damaged} \pm \text{Adjustments}$$

$$\text{Available} = \text{On Hand} - \text{Reserved}$$

---

## 6. Permissions & RBAC

- **Warehouse Staff / Lead:** Storage Inwarding, Putaway, Internal Stock Movements.
- **Inventory Lead / Operations:** Stock Consumption, Cycle Count Reconciliation, Adjustments.
- **Procurement Lead:** Purchase Bill entry, Vendor Assignment.
- **Admin / Owner:** Full cross-module access.

# CommerceOS V4 — Storage Foundation Specification (Phase 1)

## Executive Summary & Role Statement

This document defines the permanent **Storage Domain Architecture (Phase 1)** for CommerceOS V4. As the Single Source of Truth (SOT) for physical and virtual inventory positioning, the Storage Domain provides a unified model for every seller tier (Solo, Growing D2C, Enterprise Multi-Warehouse).

---

## 1. Domain Separation of Responsibilities

CommerceOS strictly segregates business domains to maintain high cohesion and low coupling:

| Domain | Core Question Answered | Single Source of Truth (SOT) Scope |
| :--- | :--- | :--- |
| **Storage Domain** | *"Where is inventory physically located?"* | Node topology, location hierarchy, dynamic capability matrix, marketplace location metadata, address & geofencing. **ZERO stock balance quantities**. |
| **Inventory Engine** | *"How much inventory exists?"* | Available, Reserved, Incoming, Damaged, and In-Transit unit balances & movement ledger. |
| **Warehouse Operations Engine** | *"What operational work happens inside a warehouse?"* | Operational execution queues, Goods Receipt Notes (GRN), QC quarantine workflows, directed putaway, picking/packing batches, and hardware scanners. |

> [!CAUTION]
> **Domain Violation Warning**: A `StorageLocation` entity MUST NEVER contain stock balance quantity attributes (e.g. `availableQuantity`, `onHandUnits`). Stock balances belong 100% to the Inventory Engine.

---

## 2. Storage Location Domain Model

Every physical or virtual place capable of holding inventory is modeled as a `StorageLocation`.

### Supported Location Types (`StorageLocationType`)

1. `home_storage`: Founder residence or home office stock room.
2. `warehouse`: Physical owned/leased fulfillment center with docks, racks, and bins.
3. `amazon_fba`: Amazon Fulfillment Center node (mapped via FC reference codes e.g. `DEL4`, `BOM1`).
4. `flipkart_fulfillment`: Flipkart Assured (FBF) hub node.
5. `3pl`: Outsourced third-party logistics provider facility.
6. `factory`: Manufacturing or assembly plant stock point.
7. `retail_store`: Physical store front or backroom stock area.
8. `transit`: In-transit stock carrier pipeline or inter-hub transfer vehicle.
9. `returns_area`: Dedicated reverse logistics intake or staging node.
10. `temporary_storage`: Short-term seasonal overflow staging space.
11. `custom`: User-defined custom storage location node.

### Location Entity Attributes

```typescript
interface StorageLocationModel {
  id: string;
  name: string;
  code: string;
  type: StorageLocationType;
  status: StorageLocationStatus;
  parentLocationId?: string;
  address?: StorageAddress;
  marketplace?: StorageMarketplaceConnection;
  isDefault: boolean;
  isArchived: boolean;
  capabilities: StorageCapability[];
  metadata: Record<string, unknown>;
  securityContext: SecurityContext; // tenantId, organizationId, workspaceId
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

---

## 3. Dynamic Capability System

Instead of hardcoded user-tier branching (`if (isSolo)` / `if (isEnterprise)`), location behavior is governed dynamically by its **Capability Matrix**:

### Supported Capabilities (`StorageCapability`)

* `receive_stock`: Can receive incoming PO shipments at a receiving dock.
* `transfer_stock`: Can initiate or receive inter-location stock transfers.
* `adjust_stock`: Can execute stock balance reconciliation adjustments.
* `cycle_count`: Can perform physical audit counts.
* `barcode`: Supports unique barcode identifiers and label scanning.
* `qc`: Supports Quality Control inspection and quarantine holds.
* `returns`: Supports reverse logistics intake.
* `marketplace_sync`: Supports automated channel inventory sync.
* `pick_pack`: Supports pick list generation and pack station workflows.
* `shipping`: Supports carrier dispatch and AWB generation.

---

## 4. Storage Domain Events

All domain mutations emit typed, auditable domain events:

1. `StorageLocationCreatedEvent`
2. `StorageLocationArchivedEvent`
3. `StorageLocationActivatedEvent`
4. `StorageStockReceivedEvent`
5. `StorageStockTransferredEvent`
6. `StorageStockAdjustedEvent`
7. `StorageMarketplaceSyncedEvent`
8. `StorageCycleCountCompletedEvent`
9. `StorageDamageReportedEvent`

---

## 5. Security & Multi-Tenancy Architecture

Every operation enforces mandatory security boundaries:
* **Multi-Tenancy**: All queries and mutations are isolated by `tenantId`, `organizationId`, and `workspaceId`.
* **RBAC Actions**:
  * `storage.location.create`
  * `storage.location.view`
  * `storage.location.update`
  * `storage.location.archive`
* **Audit Trail**: Timestamps, actor ID, and exact payload snapshots are logged for every state change.

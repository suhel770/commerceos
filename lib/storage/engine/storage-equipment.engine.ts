/**
 * CommerceOS Storage Equipment & Physical Asset Engine
 * Handles tracking of durable physical warehouse equipment (Racks, Shelves, Tables, Pallets, Equipment)
 * 
 * STRICT INVENTORY ISOLATION:
 * Storage Equipment records are strictly physical facility infrastructure.
 * They NEVER contaminate Sellable Inventory, Consumable Deductions, ATS, or Marketplace syncs.
 */

export interface StorageEquipmentRecord {
  id: string;
  organizationId: string;
  workspaceId: string;
  storageLocationId: string;
  storageLocationName?: string;
  subLocationId?: string;
  subLocationPath?: string; // e.g. "Main Facility → Zone A → Rack R1"
  purchaseBillId?: string;
  purchaseBillLineId?: string;
  sku: string;
  name: string;
  assetTag?: string;
  quantity: number;
  acceptedQty: number;
  damagedQty: number;
  status: "active" | "installed" | "maintenance" | "damaged" | "retired";
  receivedAt: string;
  receivedBy: string;
  notes?: string;
  updatedAt: string;
}

const LOCAL_STORAGE_EQUIPMENT_KEY = "commerceos_storage_equipment_v1";

export class StorageEquipmentRepository {
  private equipmentList: StorageEquipmentRecord[] = [];
  private isLoaded = false;

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_EQUIPMENT_KEY);
      if (saved) {
        this.equipmentList = JSON.parse(saved);
      }
    } catch {
      // Ignore quota errors
    }
    this.isLoaded = true;
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LOCAL_STORAGE_EQUIPMENT_KEY, JSON.stringify(this.equipmentList));
      window.dispatchEvent(new CustomEvent("commerceos_equipment_updated"));
    } catch {
      // Ignore quota errors
    }
  }

  public addEquipment(input: Omit<StorageEquipmentRecord, "id" | "updatedAt">): StorageEquipmentRecord {
    if (!this.isLoaded) this.loadFromStorage();

    const now = new Date().toISOString();
    const id = `eqp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newRecord: StorageEquipmentRecord = {
      ...input,
      id,
      updatedAt: now,
    };

    this.equipmentList.unshift(newRecord);
    this.saveToStorage();
    return structuredClone(newRecord);
  }

  public listEquipment(filter?: {
    organizationId?: string;
    workspaceId?: string;
    storageLocationId?: string;
    status?: string;
  }): StorageEquipmentRecord[] {
    if (!this.isLoaded) this.loadFromStorage();

    return structuredClone(
      this.equipmentList.filter((item) => {
        if (filter?.organizationId && item.organizationId !== filter.organizationId) {
          return false;
        }
        if (filter?.workspaceId && item.workspaceId !== filter.workspaceId) {
          return false;
        }
        if (filter?.storageLocationId && item.storageLocationId !== filter.storageLocationId) {
          return false;
        }
        if (filter?.status && item.status !== filter.status) {
          return false;
        }
        return true;
      }),
    );
  }

  public getEquipmentById(id: string): StorageEquipmentRecord | undefined {
    if (!this.isLoaded) this.loadFromStorage();
    const match = this.equipmentList.find((e) => e.id === id);
    return match ? structuredClone(match) : undefined;
  }

  public moveEquipment(input: {
    equipmentId: string;
    targetStorageLocationId: string;
    targetStorageLocationName?: string;
    targetSubLocationId?: string;
    targetSubLocationPath?: string;
    actorName?: string;
  }): { success: boolean; error?: string; record?: StorageEquipmentRecord } {
    if (!this.isLoaded) this.loadFromStorage();

    const item = this.equipmentList.find((e) => e.id === input.equipmentId);
    if (!item) {
      return { success: false, error: `Equipment with ID ${input.equipmentId} not found.` };
    }

    item.storageLocationId = input.targetStorageLocationId;
    if (input.targetStorageLocationName) item.storageLocationName = input.targetStorageLocationName;
    item.subLocationId = input.targetSubLocationId;
    item.subLocationPath = input.targetSubLocationPath;
    item.updatedAt = new Date().toISOString();

    this.saveToStorage();
    return { success: true, record: structuredClone(item) };
  }

  public updateEquipmentStatus(
    equipmentId: string,
    status: StorageEquipmentRecord["status"],
    notes?: string,
  ): { success: boolean; error?: string; record?: StorageEquipmentRecord } {
    if (!this.isLoaded) this.loadFromStorage();

    const item = this.equipmentList.find((e) => e.id === equipmentId);
    if (!item) {
      return { success: false, error: `Equipment with ID ${equipmentId} not found.` };
    }

    item.status = status;
    if (notes) item.notes = notes;
    item.updatedAt = new Date().toISOString();

    this.saveToStorage();
    return { success: true, record: structuredClone(item) };
  }

  public getEquipmentSummary(storageLocationId?: string): {
    totalUnits: number;
    activeUnits: number;
    damagedUnits: number;
    distinctItemCount: number;
  } {
    if (!this.isLoaded) this.loadFromStorage();

    const items = storageLocationId
      ? this.equipmentList.filter((e) => e.storageLocationId === storageLocationId)
      : this.equipmentList;

    const totalUnits = items.reduce((sum, e) => sum + e.quantity, 0);
    const activeUnits = items.filter((e) => e.status !== "damaged" && e.status !== "retired").reduce((sum, e) => sum + e.acceptedQty, 0);
    const damagedUnits = items.reduce((sum, e) => sum + e.damagedQty, 0);
    const distinctItemCount = new Set(items.map((e) => e.sku || e.name)).size;

    return {
      totalUnits,
      activeUnits,
      damagedUnits,
      distinctItemCount,
    };
  }
}

export const storageEquipmentRepository = new StorageEquipmentRepository();

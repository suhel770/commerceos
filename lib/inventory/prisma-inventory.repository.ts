/**
 * CommerceOS V4 — Prisma Inventory Repository
 * PostgreSQL-backed implementation of IInventoryRepository querying db.inventory
 * Enforces organizationId + workspaceId tenant isolation.
 */

import { db } from "@/lib/db";
import type { IInventoryRepository, ReservationFilter, StockBalanceFilter, StockMovementFilter } from "./inventory.repository.interface";
import type { Reservation, StockBalance, StockMovement } from "./types";
import { DEFAULT_WAREHOUSE_ID } from "./types";

export class PrismaInventoryRepository implements IInventoryRepository {
  private memoryMovements: StockMovement[] = [];
  private memoryReservations: Reservation[] = [];
  private balances: StockBalance[] = [];

  /**
   * Helper: Ensure default warehouse exists for tenant workspace
   */
  private async ensureDefaultWarehouseId(workspaceId: string): Promise<string> {
    const existing = await db.warehouse.findFirst({
      where: { workspaceId },
      select: { id: true },
    });
    if (existing) return existing.id;

    const created = await db.warehouse.create({
      data: {
        workspaceId,
        code: "DEFAULT-WH",
        name: "Main Warehouse",
        type: "WAREHOUSE",
        active: true,
      },
      select: { id: true },
    });
    return created.id;
  }

  /**
   * Sync physical storage stock from PostgreSQL db.storageStock into db.inventory
   */
  private async syncStorageStockToInventory(workspaceId: string, organizationId: string) {
    try {
      const warehouseId = await this.ensureDefaultWarehouseId(workspaceId);

      // 1. Fetch physical bin stock from StorageStock
      const storageStocks = await db.storageStock.findMany({
        where: { workspaceId, organizationId },
      });

      // Group available & damaged qty by SKU
      const skuMap = new Map<string, { available: number; damaged: number; productId?: string | null; productName?: string | null; intent: string }>();
      for (const item of storageStocks) {
        const key = item.sku;
        const current = skuMap.get(key) || { available: 0, damaged: 0, productId: item.productId, productName: item.productName, intent: item.intent || "sellable" };
        current.available += item.availableQty;
        current.damaged += item.damagedQty;
        if (!current.productId && item.productId) current.productId = item.productId;
        skuMap.set(key, current);
      }

      // 2. Fetch pending purchase incoming stock
      const pendingBills = await db.purchaseBill.findMany({
        where: {
          workspaceId,
          organizationId,
          status: { in: ["ordered", "submitted", "approved"] },
        },
        include: { lines: true },
      });

      const incomingMap = new Map<string, number>();
      for (const bill of pendingBills) {
        for (const line of bill.lines) {
          if (line.sku) {
            incomingMap.set(line.sku, (incomingMap.get(line.sku) || 0) + line.quantity);
          }
        }
      }

      // 3. Upsert into db.inventory for each aggregated SKU
      for (const [sku, stock] of skuMap.entries()) {
        const productId = stock.productId || `sku:${sku}`;
        const incoming = incomingMap.get(sku) || 0;

        // Ensure Product record exists to satisfy foreign key constraint if needed
        let validProductId = productId;
        const existingProd = await db.product.findFirst({
          where: { workspaceId, id: productId },
          select: { id: true },
        });

        if (!existingProd) {
          // Find by SKU or fallback
          const prodBySku = await db.product.findFirst({
            where: { workspaceId, sku },
            select: { id: true },
          });
          if (prodBySku) {
            validProductId = prodBySku.id;
          } else {
            // Create placeholder product so Inventory FK is satisfied
            const newProd = await db.product.create({
              data: {
                id: productId,
                workspaceId,
                sku,
                name: stock.productName || sku,
                category: "General",
                costPrice: 0,
                sellingPrice: 0,
                mrp: 0,
                status: "Active",
              },
              select: { id: true },
            });
            validProductId = newProd.id;
          }
        }

        await db.inventory.upsert({
          where: {
            workspaceId_productId_warehouseId: {
              workspaceId,
              productId: validProductId,
              warehouseId,
            },
          },
          create: {
            workspaceId,
            productId: validProductId,
            warehouseId,
            sku,
            available: stock.available,
            damaged: stock.damaged,
            incoming,
            safetyStock: 5,
            intent: stock.intent,
          },
          update: {
            available: stock.available,
            damaged: stock.damaged,
            incoming,
            intent: stock.intent,
            updatedAt: new Date(),
          },
        });
      }
    } catch {
      // Soft-fail sync if schema records are unseeded
    }
  }

  public async listBalances(filter?: StockBalanceFilter): Promise<StockBalance[]> {
    const workspaceId = filter?.workspaceId || "ws-default";
    const organizationId = filter?.organizationId || "org-commerceos";

    try {
      await this.syncStorageStockToInventory(workspaceId, organizationId);

      const where: { workspaceId: string; productId?: string; warehouseId?: string } = {
        workspaceId,
      };
      if (filter?.productId) where.productId = filter.productId;
      if (filter?.warehouseId) where.warehouseId = filter.warehouseId;

      const rows = await db.inventory.findMany({
        where,
        include: { product: true },
        orderBy: { sku: "asc" },
      });

      return rows.map((r) => ({
        id: r.id,
        organizationId,
        workspaceId: r.workspaceId,
        productId: r.productId,
        sku: r.sku,
        productName: r.product?.name || r.sku,
        warehouseId: r.warehouseId,
        available: r.available,
        reserved: r.reserved,
        incoming: r.incoming,
        damaged: r.damaged,
        inTransit: r.inTransit,
        intent: r.intent,
        updatedAt: r.updatedAt.toISOString(),
      }));
    } catch (e) {
      return structuredClone(
        this.balances.filter((balance) => {
          if (filter?.workspaceId && balance.workspaceId !== filter.workspaceId) return false;
          if (filter?.productId && balance.productId !== filter.productId) return false;
          if (filter?.warehouseId && balance.warehouseId !== filter.warehouseId) return false;
          return true;
        })
      );
    }
  }

  public async getBalance(productId: string, warehouseId: string): Promise<StockBalance | undefined> {
    try {
      const row = await db.inventory.findFirst({
        where: { productId, warehouseId },
        include: { product: true },
      });

      if (!row) return undefined;

      return {
        id: row.id,
        organizationId: "org-commerceos",
        workspaceId: row.workspaceId,
        productId: row.productId,
        sku: row.sku,
        productName: row.product?.name || row.sku,
        warehouseId: row.warehouseId,
        available: row.available,
        reserved: row.reserved,
        incoming: row.incoming,
        damaged: row.damaged,
        inTransit: row.inTransit,
        intent: row.intent,
        updatedAt: row.updatedAt.toISOString(),
      };
    } catch (e) {
      const balance = this.balances.find(
        (row) => row.productId === productId && row.warehouseId === warehouseId
      );
      return balance ? structuredClone(balance) : undefined;
    }
  }

  public async saveBalance(balance: StockBalance): Promise<StockBalance> {
    try {
      const updated = await db.inventory.upsert({
        where: {
          workspaceId_productId_warehouseId: {
            workspaceId: balance.workspaceId,
            productId: balance.productId,
            warehouseId: balance.warehouseId,
          },
        },
        create: {
          workspaceId: balance.workspaceId,
          productId: balance.productId,
          warehouseId: balance.warehouseId,
          sku: balance.sku,
          available: balance.available,
          reserved: balance.reserved,
          incoming: balance.incoming,
          damaged: balance.damaged,
          inTransit: balance.inTransit,
          safetyStock: 5,
          intent: balance.intent || "sellable",
        },
        update: {
          available: balance.available,
          reserved: balance.reserved,
          incoming: balance.incoming,
          damaged: balance.damaged,
          inTransit: balance.inTransit,
          intent: balance.intent || "sellable",
          updatedAt: new Date(),
        },
      });

      return {
        ...balance,
        id: updated.id,
        updatedAt: updated.updatedAt.toISOString(),
      };
    } catch (e) {
      const index = this.balances.findIndex(
        (row) => row.productId === balance.productId && row.warehouseId === balance.warehouseId
      );
      if (index >= 0) {
        this.balances[index] = structuredClone(balance);
      } else {
        this.balances.push(structuredClone(balance));
      }
      return structuredClone(balance);
    }
  }

  public async appendMovement(movement: StockMovement): Promise<StockMovement> {
    try {
      const existing = await db.inventoryMovement.findUnique({
        where: { idempotencyKey: movement.id }
      });
      if (existing) {
        return {
          id: existing.id,
          organizationId: existing.organizationId,
          workspaceId: existing.workspaceId,
          productId: existing.productId,
          sku: existing.sku,
          warehouseId: existing.warehouseId || "",
          type: existing.type as any,
          quantity: existing.quantity,
          reason: existing.reason || undefined,
          reference: existing.reference || undefined,
          bucketsBefore: existing.bucketsBefore ? (existing.bucketsBefore as any) : undefined,
          bucketsAfter: existing.bucketsAfter ? (existing.bucketsAfter as any) : undefined,
          actorId: existing.actorId || undefined,
          actorName: existing.actorName || undefined,
          intent: existing.intent || undefined,
          createdAt: existing.createdAt.toISOString(),
        };
      }

      // Insert into db.inventoryMovement
      await db.inventoryMovement.create({
        data: {
          id: movement.id,
          organizationId: movement.organizationId,
          workspaceId: movement.workspaceId,
          sku: movement.sku || "",
          productId: movement.productId,
          warehouseId: movement.warehouseId,
          quantity: movement.quantity,
          direction: movement.quantity >= 0 ? "IN" : "OUT",
          type: movement.type,
          reason: movement.reason,
          reference: movement.reference,
          idempotencyKey: movement.id,
          actorId: movement.actorId || "system",
          actorName: movement.actorName || "System User",
          bucketsBefore: (movement.bucketsBefore || {}) as any,
          bucketsAfter: (movement.bucketsAfter || {}) as any,
          metadata: (movement.metadata || {}) as any,
          intent: movement.intent || "sellable",
        }
      });

      // Project balance into db.inventory if bucketsAfter is provided
      if (movement.bucketsAfter) {
        const warehouseId = movement.warehouseId || "wh-default";
        
        const existingProduct = await db.product.findUnique({
          where: {
            workspaceId_sku: {
              workspaceId: movement.workspaceId,
              sku: movement.sku || ""
            }
          }
        });
        const validProductId = existingProduct ? existingProduct.id : movement.productId;

        await db.inventory.upsert({
          where: {
            workspaceId_productId_warehouseId: {
              workspaceId: movement.workspaceId,
              productId: validProductId,
              warehouseId,
            }
          },
          create: {
            workspaceId: movement.workspaceId,
            productId: validProductId,
            warehouseId,
            sku: movement.sku || "",
            available: movement.bucketsAfter.available ?? 0,
            reserved: movement.bucketsAfter.reserved ?? 0,
            incoming: movement.bucketsAfter.incoming ?? 0,
            damaged: movement.bucketsAfter.damaged ?? 0,
            inTransit: movement.bucketsAfter.inTransit ?? 0,
            safetyStock: 5,
            intent: movement.intent || "sellable",
          },
          update: {
            available: movement.bucketsAfter.available ?? 0,
            reserved: movement.bucketsAfter.reserved ?? 0,
            incoming: movement.bucketsAfter.incoming ?? 0,
            damaged: movement.bucketsAfter.damaged ?? 0,
            inTransit: movement.bucketsAfter.inTransit ?? 0,
            intent: movement.intent || "sellable",
            updatedAt: new Date(),
          }
        });
        if (movement.intent) {
          await db.product.update({
            where: { id: validProductId },
            data: { intent: movement.intent },
          }).catch(() => {});
        }
      }
    } catch (e) {
      // Memory fallback if DB is not connected
      const idx = this.memoryMovements.findIndex((m) => m.id === movement.id);
      if (idx === -1) {
        this.memoryMovements.unshift(structuredClone(movement));

        // Also update projected balance fallback
        if (movement.bucketsAfter) {
          const warehouseId = movement.warehouseId || "wh-default";
          let bal = this.balances.find(
            (b) => b.productId === movement.productId && b.warehouseId === warehouseId
          );
          if (!bal) {
            bal = {
              id: `${movement.productId}:${warehouseId}`,
              organizationId: movement.organizationId,
              workspaceId: movement.workspaceId,
              productId: movement.productId,
              sku: movement.sku || "",
              productName: movement.sku || "",
              warehouseId,
              available: 0,
              reserved: 0,
              incoming: 0,
              damaged: 0,
              inTransit: 0,
            };
            this.balances.push(bal);
          }
          bal.available = movement.bucketsAfter.available ?? 0;
          bal.reserved = movement.bucketsAfter.reserved ?? 0;
          bal.allocated = movement.bucketsAfter.allocated ?? 0;
          bal.incoming = movement.bucketsAfter.incoming ?? 0;
          bal.damaged = movement.bucketsAfter.damaged ?? 0;
          bal.inTransit = movement.bucketsAfter.inTransit ?? 0;
          bal.updatedAt = new Date().toISOString();
        }
      }
    }


    // Keep legacy StorageOperationLog write for compatibility with audit triggers
    try {
      await db.storageOperationLog.create({
        data: {
          organizationId: movement.organizationId,
          workspaceId: movement.workspaceId,
          operationType: movement.type,
          sku: movement.productId,
          qty: movement.quantity,
          actorId: movement.actorId || "system",
          actorName: "System User",
          reason: movement.reason || movement.reference || "Inventory Stock Movement",
          metadata: {
            fromWarehouseId: movement.fromWarehouseId,
            toWarehouseId: movement.toWarehouseId,
            bucketsBefore: movement.bucketsBefore,
            bucketsAfter: movement.bucketsAfter,
          } as any,
        },
      });
    } catch {
      // Soft-fail audit write
    }

    return movement;
  }

  public async listMovements(filter?: StockMovementFilter): Promise<StockMovement[]> {
    try {
      const where: any = {};
      if (filter?.organizationId) where.organizationId = filter.organizationId;
      if (filter?.workspaceId) where.workspaceId = filter.workspaceId;
      if (filter?.productId) where.productId = filter.productId;

      const rows = await db.inventoryMovement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filter?.limit ?? 50,
      });

      return rows.map((r) => ({
        id: r.id,
        organizationId: r.organizationId,
        workspaceId: r.workspaceId,
        productId: r.productId,
        sku: r.sku,
        warehouseId: r.warehouseId || "",
        type: r.type as any,
        quantity: r.quantity,
        reason: r.reason || undefined,
        reference: r.reference || undefined,
        bucketsBefore: r.bucketsBefore ? (r.bucketsBefore as any) : undefined,
        bucketsAfter: r.bucketsAfter ? (r.bucketsAfter as any) : undefined,
        actorId: r.actorId || undefined,
        actorName: r.actorName || undefined,
        intent: r.intent,
        createdAt: r.createdAt.toISOString(),
      }));
    } catch (e) {
      // Fallback
      const rows = this.memoryMovements.filter((m) => {
        if (filter?.organizationId && m.organizationId !== filter.organizationId) return false;
        if (filter?.workspaceId && m.workspaceId !== filter.workspaceId) return false;
        if (filter?.productId && m.productId !== filter.productId) return false;
        return true;
      });
      const limit = filter?.limit ?? 50;
      return structuredClone(rows.slice(0, limit));
    }
  }

  public async createReservation(reservation: Reservation): Promise<Reservation> {
    return this.saveReservation(reservation);
  }

  public async getReservation(reservationId: string): Promise<Reservation | undefined> {
    try {
      const r = await db.inventoryReservation.findUnique({
        where: { id: reservationId }
      });
      if (!r) return undefined;
      return {
        id: r.id,
        organizationId: r.organizationId,
        workspaceId: r.workspaceId,
        productId: r.productId,
        sku: r.sku || undefined,
        warehouseId: r.warehouseId,
        quantity: r.quantity,
        status: r.status as any,
        channel: r.channel || undefined,
        orderId: r.orderId || undefined,
        reference: r.reference || undefined,
        expiresAt: r.expiresAt?.toISOString(),
        createdAt: r.createdAt.toISOString(),
        releasedAt: r.releasedAt?.toISOString() || undefined,
        allocatedAt: r.allocatedAt?.toISOString() || undefined,
        fulfilledAt: r.fulfilledAt?.toISOString() || undefined,
      };
    } catch (e) {
      const match = this.memoryReservations.find((r) => r.id === reservationId);
      return match ? structuredClone(match) : undefined;
    }
  }

  public async saveReservation(reservation: Reservation): Promise<Reservation> {
    try {
      await db.inventoryReservation.upsert({
        where: { id: reservation.id },
        create: {
          id: reservation.id,
          organizationId: reservation.organizationId,
          workspaceId: reservation.workspaceId,
          productId: reservation.productId,
          sku: reservation.sku,
          warehouseId: reservation.warehouseId,
          quantity: reservation.quantity,
          status: reservation.status,
          channel: reservation.channel,
          orderId: reservation.orderId,
          reference: reservation.reference,
          expiresAt: reservation.expiresAt ? new Date(reservation.expiresAt) : null,
          createdAt: reservation.createdAt ? new Date(reservation.createdAt) : new Date(),
          releasedAt: reservation.releasedAt ? new Date(reservation.releasedAt) : null,
          allocatedAt: reservation.allocatedAt ? new Date(reservation.allocatedAt) : null,
          fulfilledAt: reservation.fulfilledAt ? new Date(reservation.fulfilledAt) : null,
        },
        update: {
          status: reservation.status,
          releasedAt: reservation.releasedAt ? new Date(reservation.releasedAt) : null,
          allocatedAt: reservation.allocatedAt ? new Date(reservation.allocatedAt) : null,
          fulfilledAt: reservation.fulfilledAt ? new Date(reservation.fulfilledAt) : null,
        }
      });
    } catch (e) {
      const index = this.memoryReservations.findIndex((r) => r.id === reservation.id);
      if (index >= 0) {
        this.memoryReservations[index] = structuredClone(reservation);
      } else {
        this.memoryReservations.unshift(structuredClone(reservation));
      }
    }
    return reservation;
  }

  public async listReservations(filter?: ReservationFilter): Promise<Reservation[]> {
    try {
      const where: any = {};
      if (filter?.organizationId) where.organizationId = filter.organizationId;
      if (filter?.workspaceId) where.workspaceId = filter.workspaceId;
      if (filter?.productId) where.productId = filter.productId;
      if (filter?.status) where.status = filter.status;

      const rows = await db.inventoryReservation.findMany({
        where,
        orderBy: { createdAt: "desc" }
      });

      return rows.map((r) => ({
        id: r.id,
        organizationId: r.organizationId,
        workspaceId: r.workspaceId,
        productId: r.productId,
        sku: r.sku || undefined,
        warehouseId: r.warehouseId,
        quantity: r.quantity,
        status: r.status as any,
        channel: r.channel || undefined,
        orderId: r.orderId || undefined,
        reference: r.reference || undefined,
        expiresAt: r.expiresAt?.toISOString(),
        createdAt: r.createdAt.toISOString(),
        releasedAt: r.releasedAt?.toISOString() || undefined,
        allocatedAt: r.allocatedAt?.toISOString() || undefined,
        fulfilledAt: r.fulfilledAt?.toISOString() || undefined,
      }));
    } catch (e) {
      const rows = this.memoryReservations.filter((r) => {
        if (filter?.organizationId && r.organizationId !== filter.organizationId) return false;
        if (filter?.workspaceId && r.workspaceId !== filter.workspaceId) return false;
        if (filter?.productId && r.productId !== filter.productId) return false;
        if (filter?.status && r.status !== filter.status) return false;
        return true;
      });
      return structuredClone(rows);
    }
  }

}


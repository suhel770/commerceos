/**
 * CommerceOS V4 — Prisma Storage Stock & Operations Repository
 * Handles physical bin stock, GRN receiving records, and operation audit logs.
 * Executes multi-record stock operations inside db.$transaction().
 */

import { db } from "@/lib/db";
import type { SecurityContext } from "../domain/types";

export interface CreateStorageReceiptInput {
  purchaseBillId?: string;
  storageLocationId?: string;
  receiptNumber: string;
  notes?: string;
  lines: Array<{
    sku: string;
    description?: string;
    expectedQty: number;
    receivedQty: number;
    damagedQty?: number;
    putawayLocationId?: string;
  }>;
}

export interface StorageStockRecord {
  id: string;
  storageLocationId: string;
  sku: string;
  productName?: string | null;
  availableQty: number;
  reservedQty: number;
  damagedQty: number;
  inTransitQty: number;
}

export interface ReverseStorageReceiptInput {
  receiptId?: string;
  purchaseBillId: string;
  reason: string;
  lines: Array<{
    lineId?: string;
    sku: string;
    reverseQty: number;
    storageLocationId?: string;
  }>;
}

export interface StorageOperationLogInput {
  operationType: "putaway" | "transfer" | "cycle_count_adjustment" | "damage_flag" | "barcode_scan" | "receiving_reversal";
  sku: string;
  qty: number;
  sourceLocationId?: string;
  targetLocationId?: string;
  actorId: string;
  actorName: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export class PrismaStorageStockRepository {
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
   * List physical stock balances for a workspace/location
   */
  public async listStock(
    security: SecurityContext,
    storageLocationId?: string,
  ): Promise<StorageStockRecord[]> {
    const where: { organizationId: string; workspaceId: string; storageLocationId?: string } = {
      organizationId: security.organizationId,
      workspaceId: security.workspaceId,
    };
    if (storageLocationId) {
      where.storageLocationId = storageLocationId;
    }

    const rows = await db.storageStock.findMany({
      where,
      orderBy: { sku: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      storageLocationId: r.storageLocationId,
      sku: r.sku,
      productName: r.productName,
      availableQty: r.availableQty,
      reservedQty: r.reservedQty,
      damagedQty: r.damagedQty,
      inTransitQty: r.inTransitQty,
    }));
  }

  /**
   * Create a Goods Received Note (GRN) from a Purchase Bill inside a transaction
   */
  public async createReceipt(
    security: SecurityContext,
    input: CreateStorageReceiptInput,
  ) {
    const warehouseId = await this.ensureDefaultWarehouseId(security.workspaceId);

    const totalExpectedUnits = input.lines.reduce((sum, l) => sum + l.expectedQty, 0);
    const totalReceivedUnits = input.lines.reduce((sum, l) => sum + l.receivedQty, 0);
    const totalDamagedUnits = input.lines.reduce((sum, l) => sum + (l.damagedQty || 0), 0);

    return db.$transaction(async (tx) => {
      const receipt = await tx.storageReceipt.create({
        data: {
          organizationId: security.organizationId,
          workspaceId: security.workspaceId,
          warehouseId,
          purchaseBillId: input.purchaseBillId || null,
          storageLocationId: input.storageLocationId || null,
          receiptNumber: input.receiptNumber,
          status: "completed",
          totalExpectedUnits,
          totalReceivedUnits,
          totalDamagedUnits,
          notes: input.notes,
          receivedAt: new Date(),
          receivedByUserId: security.actorId || "system",
        },
      });

      for (const line of input.lines) {
        await tx.storageReceiptLine.create({
          data: {
            organizationId: security.organizationId,
            workspaceId: security.workspaceId,
            receiptId: receipt.id,
            sku: line.sku,
            description: line.description,
            expectedQty: line.expectedQty,
            receivedQty: line.receivedQty,
            damagedQty: line.damagedQty || 0,
            putawayLocationId: line.putawayLocationId || input.storageLocationId || null,
          },
        });

        // Resolve productId from Product master by SKU
        let productId: string | null = null;
        let productIntent: string = "sellable";
        const prodBySku = await tx.product.findFirst({
          where: { workspaceId: security.workspaceId, sku: line.sku },
          select: { id: true, intent: true },
        });
        if (prodBySku) {
          productId = prodBySku.id;
          productIntent = prodBySku.intent || "sellable";
        }

        // Query PurchaseBillLine to find purchase intent
        let intent = productIntent;
        if (input.purchaseBillId) {
          const billLine = await tx.purchaseBillLine.findFirst({
            where: { billId: input.purchaseBillId, sku: line.sku },
            select: { intent: true },
          });
          if (billLine) {
            intent = billLine.intent;
          }
        }

        if (productId && intent && intent !== productIntent) {
          await tx.product.update({
            where: { id: productId },
            data: { intent },
          }).catch(() => {});
        }

        // Update physical stock balance if location specified
        const targetLocId = line.putawayLocationId || input.storageLocationId;
        if (targetLocId && line.receivedQty > 0) {
          const existing = await tx.storageStock.findFirst({
            where: {
              organizationId: security.organizationId,
              workspaceId: security.workspaceId,
              storageLocationId: targetLocId,
              sku: line.sku,
            },
          });

          if (existing) {
            await tx.storageStock.update({
              where: { id: existing.id },
              data: {
                availableQty: existing.availableQty + Math.max(0, line.receivedQty - (line.damagedQty || 0)),
                damagedQty: existing.damagedQty + (line.damagedQty || 0),
                productId: productId || existing.productId,
                intent,
                updatedAt: new Date(),
              },
            });
          } else {
            await tx.storageStock.create({
              data: {
                organizationId: security.organizationId,
                workspaceId: security.workspaceId,
                storageLocationId: targetLocId,
                sku: line.sku,
                productName: line.description || line.sku,
                productId: productId,
                availableQty: Math.max(0, line.receivedQty - (line.damagedQty || 0)),
                damagedQty: line.damagedQty || 0,
                intent,
              },
            });
          }

          // ── Ledger-backed Inventory upsert ──────────────────────
          if (productId) {
            const acceptedQty = Math.max(0, line.receivedQty - (line.damagedQty || 0));
            const damagedQty = line.damagedQty || 0;

            const existingInv = await tx.inventory.findFirst({
              where: {
                workspaceId: security.workspaceId,
                productId,
                warehouseId,
              },
            });

            const bucketsBefore = {
              available: existingInv?.available ?? 0,
              reserved: existingInv?.reserved ?? 0,
              allocated: 0,
              incoming: existingInv?.incoming ?? 0,
              damaged: existingInv?.damaged ?? 0,
              inTransit: existingInv?.inTransit ?? 0,
            };

            const bucketsAfter = {
              available: bucketsBefore.available + acceptedQty,
              reserved: bucketsBefore.reserved,
              allocated: bucketsBefore.allocated,
              incoming: Math.max(0, bucketsBefore.incoming - line.expectedQty),
              damaged: bucketsBefore.damaged + damagedQty,
              inTransit: bucketsBefore.inTransit,
            };

            // Write movement ledger record
            await tx.inventoryMovement.create({
              data: {
                id: crypto.randomUUID(),
                organizationId: security.organizationId,
                workspaceId: security.workspaceId,
                sku: line.sku,
                productId: productId,
                warehouseId,
                storageLocationId: targetLocId,
                quantity: line.receivedQty,
                direction: "IN",
                type: "Inbound",
                reason: `Purchase Receipt Putaway: ${input.receiptNumber}`,
                reference: input.receiptNumber,
                sourceEntity: "StorageReceipt",
                idempotencyKey: `grn-${receipt.id}-${line.sku}`,
                actorId: security.actorId || "system",
                actorName: security.actorName || "System User",
                bucketsBefore: bucketsBefore as any,
                bucketsAfter: bucketsAfter as any,
                intent,
                metadata: {
                  receiptId: receipt.id,
                  purchaseBillId: input.purchaseBillId,
                } as any,
              }
            });

            if (existingInv) {
              await tx.inventory.update({
                where: { id: existingInv.id },
                data: {
                  available: bucketsAfter.available,
                  incoming: bucketsAfter.incoming,
                  damaged: bucketsAfter.damaged,
                  intent,
                  updatedAt: new Date(),
                },
              });
            } else {
              await tx.inventory.create({
                data: {
                  workspaceId: security.workspaceId,
                  productId,
                  warehouseId,
                  sku: line.sku,
                  available: bucketsAfter.available,
                  incoming: bucketsAfter.incoming,
                  damaged: bucketsAfter.damaged,
                  safetyStock: 5,
                  intent,
                },
              });
            }
          }

        }
      }

      // Update Purchase Bill line received quantities and status if purchaseBillId is present
      if (input.purchaseBillId) {
        const bill = await tx.purchaseBill.findFirst({
          where: {
            organizationId: security.organizationId,
            workspaceId: security.workspaceId,
            OR: [
              { id: input.purchaseBillId },
              { billNumber: input.purchaseBillId },
            ],
          },
          include: { lines: true },
        });

        if (bill) {
          let allFullyReceived = true;

          for (const pLine of bill.lines) {
            const intent = pLine.intent || "sellable";
            const isStockLine =
              intent === "sellable" ||
              intent === "consumable" ||
              bill.purchaseType === "inventory_product" ||
              bill.purchaseType === "packaging_material";

            if (!isStockLine) continue;

            const matchingReceiptLine = input.lines.find(
              (l) => l.sku === pLine.sku || l.description === pLine.description,
            );

            const addedReceived = matchingReceiptLine ? matchingReceiptLine.receivedQty : 0;
            const addedDamaged = matchingReceiptLine ? matchingReceiptLine.damagedQty || 0 : 0;

            const prevQc = pLine.qcRecord as any;
            const currentReceived = prevQc?.receivedQty ?? 0;
            const currentDamaged = pLine.qtyDamaged ?? 0;

            const newTotalReceived = currentReceived + addedReceived;
            const newTotalDamaged = currentDamaged + addedDamaged;
            const newAccepted = Math.max(0, newTotalReceived - newTotalDamaged);

            await tx.purchaseBillLine.update({
              where: { id: pLine.id },
              data: {
                qtyDamaged: newTotalDamaged,
                qcStatus:
                  newTotalDamaged > 0
                    ? "partially_failed"
                    : newTotalReceived >= pLine.quantity
                      ? "passed"
                      : "pending",
                qcRecord: {
                  receivedQty: newTotalReceived,
                  acceptedQty: newAccepted,
                  rejectedQty: newTotalDamaged,
                },
              },
            });

            if (newTotalReceived < pLine.quantity) {
              allFullyReceived = false;
            }
          }

          const nextStatus = allFullyReceived ? "completed" : "partially_received";
          await tx.purchaseBill.update({
            where: { id: bill.id },
            data: { status: nextStatus },
          });

          // Integration contract for Inventory Engine
          const { eventBus } = await import("@/lib/core/event-bus");
          eventBus.publish({
            type: "InventoryUpdateRequested",
            payload: {
              organizationId: security.organizationId,
              workspaceId: security.workspaceId,
              billId: bill.id,
              receiptId: receipt.id,
              receivedUnits: totalReceivedUnits,
              lines: input.lines.map((l) => ({
                sku: l.sku,
                receivedQty: l.receivedQty,
                damagedQty: l.damagedQty || 0,
                locationId: l.putawayLocationId || input.storageLocationId,
              })),
            },
          });
        }
      }

      return receipt;
    });
  }

  /**
   * Log an operational movement (Putaway, Transfer, Adjustment, Damage) and adjust stock atomically
   */
  public async executeStockOperation(
    security: SecurityContext,
    input: StorageOperationLogInput,
  ) {
    return db.$transaction(async (tx) => {
      // 1. Audit log entry
      const log = await tx.storageOperationLog.create({
        data: {
          organizationId: security.organizationId,
          workspaceId: security.workspaceId,
          operationType: input.operationType,
          sku: input.sku,
          qty: input.qty,
          sourceLocationId: input.sourceLocationId || null,
          targetLocationId: input.targetLocationId || null,
          actorId: input.actorId,
          actorName: input.actorName,
          reason: input.reason,
          metadata: (input.metadata || {}) as any,
        },
      });

      const prod = await tx.product.findFirst({
        where: { workspaceId: security.workspaceId, sku: input.sku },
        select: { id: true, intent: true }
      });
      const productId = prod ? prod.id : `sku:${input.sku}`;
      const intent = prod?.intent || "sellable";
      const warehouseId = await this.ensureDefaultWarehouseId(security.workspaceId);

      // Write movement ledger record
      await tx.inventoryMovement.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: security.organizationId,
          workspaceId: security.workspaceId,
          sku: input.sku,
          productId: productId,
          warehouseId,
          storageLocationId: input.targetLocationId || input.sourceLocationId || null,
          quantity: input.qty,
          direction: input.targetLocationId ? "IN" : "OUT",
          type: input.operationType === "cycle_count_adjustment" ? "Adjustment" : "BinMovement",
          reason: input.reason || `Storage stock operation: ${input.operationType}`,
          reference: log.id,
          sourceEntity: "StorageOperationLog",
          idempotencyKey: log.id,
          actorId: input.actorId,
          actorName: input.actorName,
          intent,
          metadata: {
            sourceLocationId: input.sourceLocationId,
            targetLocationId: input.targetLocationId,
            operationType: input.operationType,
          } as any,
        }
      });


      // 2. Adjust Source Location Stock if applicable
      if (input.sourceLocationId) {
        const sourceStock = await tx.storageStock.findFirst({
          where: {
            organizationId: security.organizationId,
            workspaceId: security.workspaceId,
            storageLocationId: input.sourceLocationId,
            sku: input.sku,
          },
        });
        if (sourceStock) {
          await tx.storageStock.update({
            where: { id: sourceStock.id },
            data: {
              availableQty: Math.max(0, sourceStock.availableQty - input.qty),
              updatedAt: new Date(),
            },
          });
        }
      }

      // 3. Adjust Target Location Stock if applicable
      if (input.targetLocationId) {
        const targetStock = await tx.storageStock.findFirst({
          where: {
            organizationId: security.organizationId,
            workspaceId: security.workspaceId,
            storageLocationId: input.targetLocationId,
            sku: input.sku,
          },
        });
        if (targetStock) {
          await tx.storageStock.update({
            where: { id: targetStock.id },
            data: {
              availableQty: targetStock.availableQty + input.qty,
              updatedAt: new Date(),
            },
          });
        } else {
          await tx.storageStock.create({
            data: {
              organizationId: security.organizationId,
              workspaceId: security.workspaceId,
              storageLocationId: input.targetLocationId,
              sku: input.sku,
              productName: input.sku,
              availableQty: input.qty,
              intent,
            },
          });
        }
      }

      return log;
    });
  }

  /**
   * Reverse / Correct an existing storage receipt without deleting history.
   * Atomically decrements StorageStock, decrements Inventory, updates PurchaseBillLine.qcRecord,
   * updates PurchaseBill.status, and creates an immutable StorageOperationLog audit record.
   * 
   * Strict invariant: Cannot reverse more than current physically available (unreserved/unconsumed) stock.
   */
  public async reverseReceipt(
    security: SecurityContext,
    input: ReverseStorageReceiptInput,
  ) {
    if (!input.reason || input.reason.trim().length === 0) {
      throw new Error("A mandatory reason is required to reverse a storage receipt.");
    }

    const warehouseId = await this.ensureDefaultWarehouseId(security.workspaceId);

    return db.$transaction(async (tx) => {
      // 1. Fetch the Purchase Bill
      const bill = await tx.purchaseBill.findFirst({
        where: {
          organizationId: security.organizationId,
          workspaceId: security.workspaceId,
          OR: [
            { id: input.purchaseBillId },
            { billNumber: input.purchaseBillId },
          ],
        },
        include: { lines: true },
      });

      if (!bill) {
        throw new Error(`Purchase bill ${input.purchaseBillId} not found.`);
      }

      const reversalLogs: Array<{ sku: string; reverseQty: number; storageLocationId?: string }> = [];

      for (const reqLine of input.lines) {
        if (reqLine.reverseQty <= 0) continue;

        // Find the corresponding bill line
        const pLine = bill.lines.find(
          (l) => l.id === reqLine.lineId || l.sku === reqLine.sku,
        );

        if (!pLine) {
          throw new Error(`Line item for SKU ${reqLine.sku} not found on bill ${bill.billNumber}.`);
        }

        const qcRecord = (pLine.qcRecord as any) || {};
        const currentReceivedQty = Number(qcRecord.receivedQty ?? 0);
        const currentDamagedQty = Number(pLine.qtyDamaged ?? 0);
        const currentAcceptedQty = Math.max(0, currentReceivedQty - currentDamagedQty);

        if (reqLine.reverseQty > currentReceivedQty) {
          throw new Error(
            `Cannot reverse ${reqLine.reverseQty} units for SKU ${reqLine.sku}. Only ${currentReceivedQty} units were originally received on bill ${bill.billNumber}.`
          );
        }

        // 2. Validate against physical StorageStock available
        // Locate matching StorageStock row
        const stockWhere: {
          organizationId: string;
          workspaceId: string;
          sku: string;
          storageLocationId?: string;
        } = {
          organizationId: security.organizationId,
          workspaceId: security.workspaceId,
          sku: reqLine.sku,
        };
        if (reqLine.storageLocationId) {
          stockWhere.storageLocationId = reqLine.storageLocationId;
        }

        const storageStocks = await tx.storageStock.findMany({
          where: stockWhere,
        });

        const totalPhysicallyAvailable = storageStocks.reduce((sum, s) => sum + s.availableQty, 0);

        if (totalPhysicallyAvailable < reqLine.reverseQty) {
          throw new Error(
            `Cannot reverse ${reqLine.reverseQty} units for SKU ${reqLine.sku}. Insufficient physical stock available: only ${totalPhysicallyAvailable} units remain in storage (units may have already been consumed, reserved, or transferred).`
          );
        }

        // 3. Deduct from StorageStock (FIFO across matching locations or target location)
        let remainingToDeduct = reqLine.reverseQty;
        for (const sStock of storageStocks) {
          if (sStock.availableQty <= 0) continue;
          const deduct = Math.min(sStock.availableQty, remainingToDeduct);
          await tx.storageStock.update({
            where: { id: sStock.id },
            data: {
              availableQty: sStock.availableQty - deduct,
              updatedAt: new Date(),
            },
          });
          remainingToDeduct -= deduct;
          if (remainingToDeduct <= 0) break;
        }

        // 4. Resolve Product, write ledger entry, and deduct from Inventory projection
        const prod = await tx.product.findFirst({
          where: { workspaceId: security.workspaceId, sku: reqLine.sku },
          select: { id: true, intent: true },
        });

        if (prod) {
          const intent = pLine.intent || prod.intent || "sellable";
          const inv = await tx.inventory.findFirst({
            where: {
              workspaceId: security.workspaceId,
              productId: prod.id,
              warehouseId,
            },
          });

          const bucketsBefore = {
            available: inv?.available ?? 0,
            reserved: inv?.reserved ?? 0,
            allocated: 0,
            incoming: inv?.incoming ?? 0,
            damaged: inv?.damaged ?? 0,
            inTransit: inv?.inTransit ?? 0,
          };

          const bucketsAfter = {
            available: Math.max(0, bucketsBefore.available - reqLine.reverseQty),
            reserved: bucketsBefore.reserved,
            allocated: bucketsBefore.allocated,
            incoming: bucketsBefore.incoming,
            damaged: bucketsBefore.damaged,
            inTransit: bucketsBefore.inTransit,
          };

          // Write movement ledger record
          await tx.inventoryMovement.create({
            data: {
              id: crypto.randomUUID(),
              organizationId: security.organizationId,
              workspaceId: security.workspaceId,
              sku: reqLine.sku,
              productId: prod.id,
              warehouseId,
              storageLocationId: reqLine.storageLocationId || storageStocks[0]?.storageLocationId || null,
              quantity: -reqLine.reverseQty,
              direction: "OUT",
              type: "Outbound",
              reason: `Receiving Reversal: ${input.reason}`,
              reference: bill.billNumber,
              sourceEntity: "PurchaseBill",
              idempotencyKey: `rev-${bill.id}-${reqLine.sku}-${reqLine.reverseQty}-${Date.now()}`,
              actorId: security.actorId || "system",
              actorName: security.actorName || "System User",
              bucketsBefore: bucketsBefore as any,
              bucketsAfter: bucketsAfter as any,
              intent,
              metadata: {
                purchaseBillId: bill.id,
                reason: input.reason,
              } as any,
            }
          });

          if (inv) {
            await tx.inventory.update({
              where: { id: inv.id },
              data: {
                available: bucketsAfter.available,
                intent,
                updatedAt: new Date(),
              },
            });
          }
        }


        // 5. Update PurchaseBillLine qcRecord
        const newReceivedQty = Math.max(0, currentReceivedQty - reqLine.reverseQty);
        const newAcceptedQty = Math.max(0, newReceivedQty - currentDamagedQty);

        await tx.purchaseBillLine.update({
          where: { id: pLine.id },
          data: {
            qcStatus: newReceivedQty === 0 ? "pending" : newReceivedQty < pLine.quantity ? "pending" : "passed",
            qcRecord: {
              receivedQty: newReceivedQty,
              acceptedQty: newAcceptedQty,
              rejectedQty: currentDamagedQty,
              reversedQty: ((qcRecord.reversedQty ?? 0) as number) + reqLine.reverseQty,
              lastReversedAt: new Date().toISOString(),
              lastReversalReason: input.reason,
            },
          },
        });

        // 6. Create immutable StorageOperationLog audit trail
        await tx.storageOperationLog.create({
          data: {
            organizationId: security.organizationId,
            workspaceId: security.workspaceId,
            operationType: "receiving_reversal",
            sku: reqLine.sku,
            qty: reqLine.reverseQty,
            sourceLocationId: reqLine.storageLocationId || storageStocks[0]?.storageLocationId || null,
            actorId: security.actorId || "system",
            actorName: security.actorName || "System User",
            reason: input.reason,
            metadata: {
              receiptId: input.receiptId,
              billId: bill.id,
              billNumber: bill.billNumber,
              lineId: pLine.id,
              previousReceivedQty: currentReceivedQty,
              newReceivedQty,
              reversedQty: reqLine.reverseQty,
              timestamp: new Date().toISOString(),
            } as any,
          },
        });

        reversalLogs.push({
          sku: reqLine.sku,
          reverseQty: reqLine.reverseQty,
          storageLocationId: reqLine.storageLocationId,
        });
      }

      // 7. Recalculate PurchaseBill status
      const updatedLines = await tx.purchaseBillLine.findMany({
        where: { billId: bill.id },
      });

      let anyReceived = false;
      let allFullyReceived = true;

      for (const l of updatedLines) {
        const rec = ((l.qcRecord as any)?.receivedQty as number) ?? 0;
        if (rec > 0) anyReceived = true;
        if (rec < l.quantity) allFullyReceived = false;
      }

      const nextStatus = allFullyReceived
        ? "completed"
        : anyReceived
          ? "partially_received"
          : "ordered";

      await tx.purchaseBill.update({
        where: { id: bill.id },
        data: { status: nextStatus },
      });

      return {
        success: true,
        billId: bill.id,
        billNumber: bill.billNumber,
        newStatus: nextStatus,
        reversals: reversalLogs,
        reason: input.reason,
        timestamp: new Date().toISOString(),
      };
    });
  }
}

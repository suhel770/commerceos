/**
 * CommerceOS Phase 5 — Outbox Service
 *
 * CRITICAL RULE: createWithinTx() must ONLY be called inside an existing
 * db.$transaction() block. The caller's transaction is the unit of atomicity.
 *
 * Usage:
 *   await db.$transaction(async (tx) => {
 *     await tx.inventory.update(...);           // business mutation
 *     await OutboxService.createWithinTx(tx, { // outbox event — same tx
 *       organizationId, workspaceId,
 *       eventType: INVENTORY_ADJUSTED,
 *       aggregateType: "Inventory",
 *       aggregateId: sku,
 *       payload: { sku, delta, actorId },
 *     });
 *   });
 */

import type { OutboxEventInput } from "./types";
import { sanitizePayload } from "@/lib/audit/sanitize";

// Minimal Prisma tx client shape needed for outbox writes
type TxClient = {
  outboxEvent: {
    create: (args: {
      data: {
        id: string;
        organizationId: string;
        workspaceId: string;
        correlationId?: string | null;
        eventType: string;
        aggregateType: string;
        aggregateId: string;
        payload: Record<string, unknown>;
        status: string;
      };
    }) => Promise<unknown>;
  };
};

export class OutboxService {
  /**
   * Write an outbox event inside an active Prisma transaction.
   * Must be called within the same db.$transaction() as the business mutation.
   */
  static async createWithinTx(tx: TxClient, input: OutboxEventInput): Promise<void> {
    const safePayload = sanitizePayload(input.payload);

    await tx.outboxEvent.create({
      data: {
        id: crypto.randomUUID(),
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        correlationId: input.correlationId ?? null,
        eventType: input.eventType,
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        payload: safePayload,
        status: "PENDING",
      },
    });
  }

  /**
   * Write an outbox event OUTSIDE a transaction (fire-and-forget, best-effort).
   * Use only when no surrounding transaction exists. Less safe — prefer createWithinTx.
   */
  static async createBestEffort(
    db: TxClient,
    input: OutboxEventInput
  ): Promise<void> {
    try {
      await OutboxService.createWithinTx(db, input);
    } catch (err) {
      // Best-effort: log but don't throw so it never blocks the caller
      console.error("[OutboxService] best-effort write failed:", err);
    }
  }
}

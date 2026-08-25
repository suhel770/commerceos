/**
 * CommerceOS Phase 5 — Consumable Event Handler
 */
import { db } from "@/lib/db";
import { sanitizePayload } from "@/lib/audit/sanitize";
import type { OutboxEventHandler, OutboxEventRecord } from "../types";

export class ConsumableEventHandler implements OutboxEventHandler {
  handles(eventType: string): boolean {
    return eventType.startsWith("CONSUMABLE_");
  }

  async handle(event: OutboxEventRecord): Promise<void> {
    const payload = event.payload as Record<string, unknown>;
    await db.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        organizationId: event.organizationId,
        workspaceId: event.workspaceId,
        correlationId: event.correlationId ?? null,
        actorId: (payload.actorId as string) ?? "system",
        actorName: (payload.actorName as string) ?? "System",
        actorRole: (payload.actorRole as string) ?? "system",
        action: `consumable.${event.eventType.toLowerCase().replace("consumable_", "")}`,
        entityType: "ConsumableLedger",
        entityId: (payload.sku as string) ?? event.aggregateId,
        before: payload.before ? (sanitizePayload(payload.before as Record<string, unknown>) as any) : undefined,
        after: payload.after ? (sanitizePayload(payload.after as Record<string, unknown>) as any) : undefined,
        reason: (payload.reason as string) ?? null,
        metadata: sanitizePayload({ eventType: event.eventType, qty: payload.qty }) as any,
      },
    });
  }
}

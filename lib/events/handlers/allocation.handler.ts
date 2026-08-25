/**
 * CommerceOS Phase 5 — Allocation Event Handler
 *
 * MARKETPLACE_ALLOCATION_CHANGED → creates a MARKETPLACE_SYNC BackgroundJob.
 * The job handler (MarketplaceSyncHandler) will respond with NOT_CONNECTED
 * until a real marketplace adapter is implemented.
 */
import { db } from "@/lib/db";
import { sanitizePayload } from "@/lib/audit/sanitize";
import { JobService } from "@/lib/jobs/job.service";
import type { OutboxEventHandler, OutboxEventRecord } from "../types";

export class AllocationEventHandler implements OutboxEventHandler {
  handles(eventType: string): boolean {
    return eventType === "MARKETPLACE_ALLOCATION_CHANGED";
  }

  async handle(event: OutboxEventRecord): Promise<void> {
    const payload = event.payload as Record<string, unknown>;
    const channel = (payload.channel as string) ?? "unknown";
    const sku = (payload.sku as string) ?? event.aggregateId;

    // Write audit log
    await db.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        organizationId: event.organizationId,
        workspaceId: event.workspaceId,
        correlationId: event.correlationId ?? null,
        actorId: (payload.actorId as string) ?? "system",
        actorName: (payload.actorName as string) ?? "System",
        actorRole: (payload.actorRole as string) ?? "system",
        action: "allocation.changed",
        entityType: "ChannelAllocation",
        entityId: `${sku}:${channel}`,
        before: payload.before ? (sanitizePayload(payload.before as Record<string, unknown>) as any) : undefined,
        after: payload.after ? (sanitizePayload(payload.after as Record<string, unknown>) as any) : undefined,
        metadata: sanitizePayload({ channel, sku }) as any,
      },
    });

    // Enqueue a marketplace sync job (idempotent)
    await JobService.createIdempotent({
      organizationId: event.organizationId,
      workspaceId: event.workspaceId,
      correlationId: event.correlationId ?? undefined,
      jobType: "MARKETPLACE_SYNC",
      outboxEventId: event.id,
      payload: sanitizePayload({ channel, sku, allocationPercent: payload.allocationPercent }),
      idempotencyKey: `marketplace-sync:${event.workspaceId}:${sku}:${channel}:${event.id}`,
    });
  }
}

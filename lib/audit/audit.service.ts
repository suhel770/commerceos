/**
 * CommerceOS Phase 5 — DB-Backed Audit Service
 *
 * Writes immutable AuditLog records to PostgreSQL.
 * Falls back silently if DB is unavailable (never blocks business operations).
 *
 * Security rules enforced:
 * - Tenant scope (organizationId + workspaceId) always required
 * - Payload sanitization always applied
 * - No passwords, tokens, or secrets ever stored
 */

import { db } from "@/lib/db";
import { sanitizePayload } from "./sanitize";
import type { CommerceContext } from "@/lib/platform/commerce-context";

export interface AuditLogInput {
  correlationId?: string;
  action: string;           // e.g. "inventory.adjusted"
  entityType: string;       // e.g. "Inventory"
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export class AuditService {
  /**
   * Write an audit log entry to the database.
   * Never throws — failures are logged but never propagate to callers.
   */
  static async log(ctx: CommerceContext, input: AuditLogInput): Promise<void> {
    try {
      await db.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: ctx.organizationId,
          workspaceId: ctx.workspaceId,
          correlationId: input.correlationId ?? null,
          actorId: ctx.actor.id,
          actorName: ctx.actor.name,
          actorRole: ctx.actor.role,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          before: input.before ? (sanitizePayload(input.before) as any) : undefined,
          after: input.after ? (sanitizePayload(input.after) as any) : undefined,
          reason: input.reason ?? null,
          metadata: input.metadata ? (sanitizePayload(input.metadata) as any) : undefined,
          ipAddress: input.ipAddress ?? null,
        },
      });
    } catch (err) {
      // Audit failures must never block business operations
      console.error("[AuditService] Failed to write audit log:", {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        err,
      });
    }
  }

  /**
   * Write an audit log inside an active Prisma transaction.
   * Preferred over standalone log() for operations with existing transactions.
   */
  static async logWithinTx(
    tx: { auditLog: { create: (args: { data: Record<string, unknown> }) => Promise<unknown> } },
    ctx: { organizationId: string; workspaceId: string; actor: { id: string; name: string; role: string } },
    input: AuditLogInput
  ): Promise<void> {
    await tx.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        organizationId: ctx.organizationId,
        workspaceId: ctx.workspaceId,
        correlationId: input.correlationId ?? null,
        actorId: ctx.actor.id,
        actorName: ctx.actor.name,
        actorRole: ctx.actor.role,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        before: input.before ? (sanitizePayload(input.before) as any) : undefined,
        after: input.after ? (sanitizePayload(input.after) as any) : undefined,
        reason: input.reason ?? null,
        metadata: input.metadata ? (sanitizePayload(input.metadata) as any) : undefined,
        ipAddress: input.ipAddress ?? null,
      } as Record<string, unknown>,
    });
  }

  /**
   * List recent audit logs for a specific entity (e.g. for a product detail page).
   * Tenant-scoped — never returns data across organization boundaries.
   */
  static async listForEntity(
    organizationId: string,
    workspaceId: string,
    entityType: string,
    entityId: string,
    limit = 50
  ) {
    try {
      return await db.auditLog.findMany({
        where: { organizationId, workspaceId, entityType, entityId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    } catch {
      return [];
    }
  }
}

import type {
  CommerceActor,
  CommerceContext,
} from "./commerce-context";

export type AuditAction =
  | "product.created"
  | "product.updated"
  | "product.validated"
  | "product.published"
  | "product.archived"
  | "product.deleted"
  | "listing.validated"
  | "listing.published"
  | "listing.synced"
  | "inventory.adjusted"
  | "inventory.reserved"
  | "inventory.released"
  | "inventory.transferred"
  | "inventory.po_suggested"
  | "order.created"
  | "order.confirmed"
  | "order.reserved"
  | "order.allocated"
  | "order.cancelled"
  | "order.held"
  | "order.picked"
  | "order.packed"
  | "order.shipped"
  | "order.delivered"
  | "order.settled"
  | "order.closed"
  | "order.return_opened"
  | "order.return_approved"
  | "order.return_in_transit"
  | "order.return_disposed"
  | "order.tracking_updated"
  | "order.delivery_attempt_failed"
  | "order.rto_initiated"
  | "order.rto_completed"
  | "order.return_received"
  | "order.qc_failed"
  | "order.note_added"
  | "order.claim_opened"
  | "order.document_generated"
  | "purchase.vendor.created"
  | "purchase.vendor.updated"
  | "purchase.vendor.deleted"
  | "purchase.vendors.bulk_deleted"
  | "purchase.vendor.blocked"
  | "purchase.vendor.unblocked"
  | "purchase.bill.created"
  | "purchase.bill.updated"
  | "purchase.bill.transitioned"
  | "purchase.bill.damage_recorded"
  | "purchase.bill.payment_recorded"
  | "purchase.bill.goods_received"
  | "purchase.bill.deleted"
  | "purchase.bill.restored"
  | "purchase.bill.permanently_deleted"
  | "purchase.stock.item_updated";

export interface AuditEvent<T = unknown> {
  id: string;
  organizationId: string;
  workspaceId: string;
  entityType: "master_product";
  entityId: string;
  action: AuditAction;
  actor: Pick<
    CommerceActor,
    "id" | "name" | "role"
  >;
  timestamp: string;
  before?: T;
  after?: T;
  metadata?: Record<string, unknown>;
}

export interface AuditRepository {
  append<T>(
    event: AuditEvent<T>,
  ): Promise<void>;
  listByEntity(
    organizationId: string,
    entityId: string,
  ): Promise<AuditEvent[]>;
}

class LocalAuditRepository
  implements AuditRepository
{
  private readonly events: AuditEvent[] =
    [];

  async append<T>(
    event: AuditEvent<T>,
  ) {
    this.events.unshift(
      structuredClone(
        event as AuditEvent,
      ),
    );
  }

  async listByEntity(
    organizationId: string,
    entityId: string,
  ) {
    return structuredClone(
      this.events.filter(
        (event) =>
          event.organizationId ===
            organizationId &&
          event.entityId === entityId,
      ),
    );
  }
}

export const auditRepository =
  new LocalAuditRepository();

export function createAuditEvent<T>({
  context,
  entityId,
  action,
  before,
  after,
  metadata,
}: {
  context: CommerceContext;
  entityId: string;
  action: AuditAction;
  before?: T;
  after?: T;
  metadata?: Record<string, unknown>;
}): AuditEvent<T> {
  return {
    id: crypto.randomUUID(),
    organizationId:
      context.organizationId,
    workspaceId: context.workspaceId,
    entityType: "master_product",
    entityId,
    action,
    actor: {
      id: context.actor.id,
      name: context.actor.name,
      role: context.actor.role,
    },
    timestamp:
      new Date().toISOString(),
    before,
    after,
    metadata,
  };
}

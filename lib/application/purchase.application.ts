/**
 * CommerceOS Purchase Application Layer
 * Last updated: 2026-08-11
 */
import { purchaseService } from "@/lib/purchase/service";
import {
  PurchaseError,
  PurchaseNotFoundError,
  routePlaneForType,
  type CreatePurchaseBillInput,
  type CreatePurchaseOrderInput,
  type CreateVendorInput,
  type PaymentMethod,
  type PaymentStatus,
  type PurchaseBill,
  type PurchaseBillListFilter,
  type PurchaseOrder,
  type PurchaseOrderStatus,
  type PurchaseStatus,
  type Vendor,
  type VendorStatus,
  type VendorWithStats,
} from "@/lib/purchase";
import {
  assertWorkspaceAccess,
  authorize,
} from "@/lib/platform/authorization";
import {
  auditRepository,
  createAuditEvent,
  type AuditAction,
} from "@/lib/platform/audit";
import type { CommerceContext } from "@/lib/platform/commerce-context";
import {
  domainEvents,
  type ProductDomainEventType,
} from "@/lib/platform/events";

function actorName(context: CommerceContext) {
  return context.actor?.name?.trim() || "operator";
}

async function auditPurchase(
  context: CommerceContext,
  action: AuditAction,
  entityId: string,
  metadata?: Record<string, unknown>,
) {
  await auditRepository.append(
    createAuditEvent({
      context,
      entityId,
      action,
      metadata,
    }),
  );
}

async function emitPurchaseEvent(
  context: CommerceContext,
  type: ProductDomainEventType,
  entityId: string,
  payload: Record<string, unknown> = {},
) {
  await domainEvents.publish({
    id: crypto.randomUUID(),
    type,
    organizationId: context.organizationId,
    workspaceId: context.workspaceId,
    productId: entityId,
    occurredAt: new Date().toISOString(),
    payload,
  });
}

export class PurchaseApplication {
  async listVendors(context: CommerceContext): Promise<VendorWithStats[]> {
    authorize(context, "purchase.view");
    return await purchaseService.listVendorsWithStats(
      context.organizationId,
      context.workspaceId,
    );
  }

  async createVendor(
    context: CommerceContext,
    input: CreateVendorInput,
  ): Promise<Vendor> {
    authorize(context, "purchase.vendors.manage");
    const vendor = await purchaseService.createVendor(
      context.organizationId,
      context.workspaceId,
      input,
    );

    await auditPurchase(context, "purchase.vendor.created", vendor.id, {
      name: vendor.name,
    });
    await emitPurchaseEvent(context, "PurchaseVendorCreated", vendor.id, {
      vendorId: vendor.id,
      name: vendor.name,
    });

    return vendor;
  }

  async updateVendor(
    context: CommerceContext,
    id: string,
    patch: Partial<CreateVendorInput> & { status?: VendorStatus },
  ): Promise<Vendor> {
    authorize(context, "purchase.vendors.manage");
    const vendor = await purchaseService.updateVendor(
      context.organizationId,
      context.workspaceId,
      id,
      patch,
    );
    assertWorkspaceAccess(context, vendor.workspaceId);

    await auditPurchase(context, "purchase.vendor.updated", vendor.id, {
      name: vendor.name,
      status: vendor.status,
    });
    await emitPurchaseEvent(context, "PurchaseVendorUpdated", vendor.id, {
      vendorId: vendor.id,
      name: vendor.name,
      status: vendor.status,
    });

    return vendor;
  }

  async deleteVendor(
    context: CommerceContext,
    id: string,
  ): Promise<boolean> {
    authorize(context, "purchase.vendors.manage");
    const result = await purchaseService.deleteVendor(
      context.organizationId,
      context.workspaceId,
      id,
    );
    await auditPurchase(context, "purchase.vendor.deleted", id, { id });
    return result;
  }

  async deleteVendors(
    context: CommerceContext,
    ids: string[],
  ): Promise<number> {
    authorize(context, "purchase.vendors.manage");
    const count = await purchaseService.deleteVendors(
      context.organizationId,
      context.workspaceId,
      ids,
    );
    await auditPurchase(context, "purchase.vendors.bulk_deleted", "bulk", { count, ids });
    return count;
  }

  async blockVendor(
    context: CommerceContext,
    id: string,
    reason: string,
  ): Promise<Vendor> {
    authorize(context, "purchase.vendors.manage");
    const vendor = await purchaseService.blockVendor(
      context.organizationId,
      context.workspaceId,
      id,
      reason,
      context.actor.id,
      actorName(context),
    );
    await auditPurchase(context, "purchase.vendor.blocked", id, { reason });
    return vendor;
  }

  async unblockVendor(
    context: CommerceContext,
    id: string,
    reason: string,
  ): Promise<Vendor> {
    authorize(context, "purchase.vendors.manage");
    const vendor = await purchaseService.unblockVendor(
      context.organizationId,
      context.workspaceId,
      id,
      reason,
      context.actor.id,
      actorName(context),
    );
    await auditPurchase(context, "purchase.vendor.unblocked", id, { reason });
    return vendor;
  }

  async setVendorStatus(
    context: CommerceContext,
    id: string,
    status: VendorStatus,
    reason: string,
  ): Promise<Vendor> {
    authorize(context, "purchase.vendors.manage");
    const vendor = await purchaseService.setVendorStatus(
      context.organizationId,
      context.workspaceId,
      id,
      status,
      reason,
      context.actor.id,
      actorName(context),
    );
    await auditPurchase(context, `purchase.vendor.status_${status}` as any, id, { status, reason });
    return vendor;
  }

  async requestVendorApproval(
    context: CommerceContext,
    vendorId: string,
    reason: string,
    amount?: number,
    purchaseType?: string,
  ) {
    authorize(context, "purchase.view");
    return purchaseService.requestVendorApproval(
      context.organizationId,
      context.workspaceId,
      vendorId,
      reason,
      context.actor.id,
      actorName(context),
      amount,
      purchaseType,
    );
  }

  async approveVendorRequest(
    context: CommerceContext,
    approvalId: string,
  ) {
    authorize(context, "purchase.vendors.manage");
    return purchaseService.approveVendorRequest(
      context.organizationId,
      context.workspaceId,
      approvalId,
      context.actor.id,
      actorName(context),
    );
  }

  async rejectVendorRequest(
    context: CommerceContext,
    approvalId: string,
    reason?: string,
  ) {
    authorize(context, "purchase.vendors.manage");
    return purchaseService.rejectVendorRequest(
      context.organizationId,
      context.workspaceId,
      approvalId,
      context.actor.id,
      actorName(context),
      reason,
    );
  }

  async listApprovalRequests(
    context: CommerceContext,
    filter?: { vendorId?: string; status?: any },
  ) {
    authorize(context, "purchase.view");
    return purchaseService.listApprovalRequests(
      context.organizationId,
      context.workspaceId,
      filter,
    );
  }

  async listBills(
    context: CommerceContext,
    filter?: PurchaseBillListFilter,
  ): Promise<PurchaseBill[]> {
    authorize(context, "purchase.view");
    return await purchaseService.listBills(
      context.organizationId,
      context.workspaceId,
      filter,
    );
  }

  async getBill(
    context: CommerceContext,
    id: string,
  ): Promise<PurchaseBill> {
    authorize(context, "purchase.view");
    const bill = await purchaseService.getBill(
      context.organizationId,
      context.workspaceId,
      id,
    );
    assertWorkspaceAccess(context, bill.workspaceId);
    return bill;
  }

  async createBill(
    context: CommerceContext,
    input: CreatePurchaseBillInput,
  ): Promise<PurchaseBill> {
    authorize(context, "purchase.bills.create");
    const bill = await purchaseService.createBill(
      context.organizationId,
      context.workspaceId,
      input,
      actorName(context),
      context.actor.role,
    );

    const routePlane = routePlaneForType(bill.purchaseType);

    await auditPurchase(context, "purchase.bill.created", bill.id, {
      billNumber: bill.billNumber,
      purchaseType: bill.purchaseType,
      status: bill.status,
      totalAmount: bill.totalAmount,
      vendorId: bill.vendorId,
      routePlane,
    });
    await emitPurchaseEvent(context, "PurchaseBillCreated", bill.id, {
      billId: bill.id,
      billNumber: bill.billNumber,
      purchaseType: bill.purchaseType,
      status: bill.status,
      totalAmount: bill.totalAmount,
      vendorId: bill.vendorId,
      routePlane,
      inventoryCoupled: false,
    });

    return bill;
  }

  async updateBill(
    context: CommerceContext,
    id: string,
    patch: Partial<PurchaseBill>,
  ): Promise<PurchaseBill> {
    authorize(context, "purchase.bills.create");
    const bill = await purchaseService.updateBill(
      context.organizationId,
      context.workspaceId,
      id,
      patch,
    );
    await auditPurchase(context, "purchase.bill.updated", id, { id, patch });
    return bill;
  }

  async transitionBill(
    context: CommerceContext,
    id: string,
    status: PurchaseStatus,
  ): Promise<PurchaseBill> {
    authorize(context, "purchase.bills.transition");
    const before = await purchaseService.getBill(
      context.organizationId,
      context.workspaceId,
      id,
    );
    const bill = await purchaseService.transitionBill(
      context.organizationId,
      context.workspaceId,
      id,
      status,
    );
    assertWorkspaceAccess(context, bill.workspaceId);

    const routePlane = routePlaneForType(bill.purchaseType);

    await auditPurchase(context, "purchase.bill.transitioned", bill.id, {
      billNumber: bill.billNumber,
      from: before.status,
      to: bill.status,
      purchaseType: bill.purchaseType,
      routePlane,
    });
    await emitPurchaseEvent(context, "PurchaseBillTransitioned", bill.id, {
      billId: bill.id,
      billNumber: bill.billNumber,
      from: before.status,
      to: bill.status,
      purchaseType: bill.purchaseType,
      routePlane,
      inventoryCoupled: false,
    });

    return bill;
  }

  async recordPayment(
    context: CommerceContext,
    id: string,
    input: {
      paymentMethod: PaymentMethod;
      paymentStatus?: PaymentStatus;
      paymentId?: string;
      amount: number;
      paymentDate: string;
    },
  ): Promise<PurchaseBill> {
    authorize(context, "purchase.bills.transition");
    const before = await purchaseService.getBill(
      context.organizationId,
      context.workspaceId,
      id,
    );
    const bill = await purchaseService.recordPayment(
      context.organizationId,
      context.workspaceId,
      id,
      input,
    );
    assertWorkspaceAccess(context, bill.workspaceId);

    await auditPurchase(context, "purchase.bill.payment_recorded", bill.id, {
      billNumber: bill.billNumber,
      fromPayment: before.paymentStatus,
      toPayment: bill.paymentStatus,
      paymentMethod: bill.paymentMethod,
      paymentId: bill.paymentId,
      amount: input.amount,
      paymentDate: input.paymentDate,
      amountPaid: bill.amountPaid,
      status: bill.status,
    });

    return bill;
  }

  async receiveGoods(
    context: CommerceContext,
    id: string,
  ): Promise<PurchaseBill> {
    authorize(context, "purchase.bills.transition");
    const before = await purchaseService.getBill(
      context.organizationId,
      context.workspaceId,
      id,
    );
    const bill = await purchaseService.receiveGoods(
      context.organizationId,
      context.workspaceId,
      id,
    );
    assertWorkspaceAccess(context, bill.workspaceId);

    const routePlane = routePlaneForType(bill.purchaseType);
    await auditPurchase(context, "purchase.bill.goods_received", bill.id, {
      billNumber: bill.billNumber,
      from: before.status,
      to: bill.status,
      purchaseType: bill.purchaseType,
      routePlane,
      inventoryCoupled: false,
    });
    await emitPurchaseEvent(context, "PurchaseBillTransitioned", bill.id, {
      billId: bill.id,
      billNumber: bill.billNumber,
      from: before.status,
      to: bill.status,
      purchaseType: bill.purchaseType,
      routePlane,
      inventoryCoupled: false,
    });

    return bill;
  }

  async recordLineDamage(
    context: CommerceContext,
    billId: string,
    lineId: string,
    qtyDamaged: number,
  ): Promise<PurchaseBill> {
    authorize(context, "purchase.bills.transition");
    const bill = await purchaseService.recordLineDamage(
      context.organizationId,
      context.workspaceId,
      billId,
      lineId,
      qtyDamaged,
    );
    assertWorkspaceAccess(context, bill.workspaceId);

    const line = bill.lines.find((row) => row.id === lineId);

    await auditPurchase(context, "purchase.bill.damage_recorded", bill.id, {
      billNumber: bill.billNumber,
      lineId,
      qtyDamaged,
      description: line?.description,
      inventoryCoupled: false,
    });

    return bill;
  }

  async recordSkuDamage(
    context: CommerceContext,
    stockKey: string,
    qtyDamaged: number,
  ): Promise<PurchaseBill[]> {
    authorize(context, "purchase.bills.transition");
    const bills = await purchaseService.recordSkuDamage(
      context.organizationId,
      context.workspaceId,
      stockKey,
      qtyDamaged,
    );

    await auditPurchase(
      context,
      "purchase.bill.damage_recorded",
      bills[0]?.id ?? stockKey,
      {
        stockKey,
        qtyDamaged,
        billCount: bills.length,
        inventoryCoupled: false,
      },
    );

    return bills;
  }

  async updateStockItem(
    context: CommerceContext,
    stockKey: string,
    patch: { description: string; sku?: string },
  ): Promise<PurchaseBill[]> {
    authorize(context, "purchase.bills.transition");
    const bills = await purchaseService.updateStockItem(
      context.organizationId,
      context.workspaceId,
      stockKey,
      patch,
    );

    await auditPurchase(
      context,
      "purchase.stock.item_updated",
      bills[0]?.id ?? stockKey,
      {
        stockKey,
        description: patch.description,
        sku: patch.sku ?? null,
        billCount: bills.length,
        inventoryCoupled: false,
      },
    );

    return bills;
  }

  async deleteBill(
    context: CommerceContext,
    id: string,
  ): Promise<boolean> {
    authorize(context, "purchase.bills.transition");
    const actor = actorName(context);
    const success = await purchaseService.deleteBill(
      context.organizationId,
      context.workspaceId,
      id,
      actor,
    );
    await auditPurchase(context, "purchase.bill.deleted", id, { id, actor });
    return success;
  }

  async restoreBill(
    context: CommerceContext,
    id: string,
  ): Promise<PurchaseBill> {
    authorize(context, "purchase.bills.transition");
    const bill = await purchaseService.restoreBill(
      context.organizationId,
      context.workspaceId,
      id,
    );
    await auditPurchase(context, "purchase.bill.restored", id, { id });
    return bill;
  }

  async permanentDeleteBill(
    context: CommerceContext,
    id: string,
  ): Promise<boolean> {
    authorize(context, "purchase.bills.transition");
    const success = await purchaseService.permanentDeleteBill(
      context.organizationId,
      context.workspaceId,
      id,
    );
    await auditPurchase(context, "purchase.bill.permanently_deleted", id, { id });
    return success;
  }

  async listOrders(context: CommerceContext): Promise<PurchaseOrder[]> {
    authorize(context, "purchase.bills.read");
    return purchaseService.listOrders(context.organizationId, context.workspaceId);
  }

  async getOrder(context: CommerceContext, id: string): Promise<PurchaseOrder> {
    authorize(context, "purchase.bills.read");
    return purchaseService.getOrder(context.organizationId, context.workspaceId, id);
  }

  async createOrder(
    context: CommerceContext,
    input: CreatePurchaseOrderInput,
  ): Promise<PurchaseOrder> {
    authorize(context, "purchase.bills.create");
    const order = await purchaseService.createOrder(
      context.organizationId,
      context.workspaceId,
      input,
      actorName(context),
      context.actor?.role,
    );
    await auditPurchase(context, "purchase.bill.created" as any, order.id, {
      poNumber: order.poNumber,
      totalAmount: order.totalAmount,
      vendorId: order.vendorId,
    });
    return order;
  }
}

export const purchaseApplication = new PurchaseApplication();
export { PurchaseError, PurchaseNotFoundError };

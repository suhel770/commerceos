import { isExpensePathType } from "./routing";
import { purchaseRepository } from "./repository";
import type {
  CreatePurchaseBillInput,
  CreatePurchaseOrderInput,
  CreateVendorInput,
  PaymentMethod,
  PaymentStatus,
  PurchaseBill,
  PurchaseBillListFilter,
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseStatus,
  Vendor,
  VendorStatus,
  VendorStatusChangeAudit,
  VendorApprovalRequest,
  VendorApprovalStatus,
  VendorWithStats,
} from "./types";
import { PurchaseError, PurchaseNotFoundError, getVendorCode } from "./types";
import { DEFAULT_BUYER_STATE_CODE, isInterstateSupply, splitGst, stateCodeFromGstin, vendorIsGstRegistered } from "./gst";

export class PurchaseService {
  async listVendors(organizationId: string, workspaceId: string): Promise<Vendor[]> {
    return purchaseRepository.listVendors(organizationId, workspaceId);
  }

  async listVendorsWithStats(
    organizationId: string,
    workspaceId: string,
  ): Promise<VendorWithStats[]> {
    const vendors = await this.listVendors(organizationId, workspaceId);
    const bills = await this.listBills(organizationId, workspaceId);
    const result: VendorWithStats[] = [];

    for (const vendor of vendors) {
      const vendorBills = bills.filter((bill) => bill.vendorId === vendor.id);
      const activeBills = vendorBills.filter((b) => b.status !== "void");
      const totalPurchaseAmount = activeBills.reduce(
        (sum, b) => sum + (b.totalAmount ?? 0),
        0,
      );
      const totalExpenseAmount = activeBills
        .filter((b) => isExpensePathType(b.purchaseType))
        .reduce((sum, b) => sum + (b.totalAmount ?? 0), 0);

      const outstandingBalance = await purchaseRepository.outstandingForVendor(
        organizationId,
        workspaceId,
        vendor.id,
      );

      result.push({
        ...vendor,
        outstandingBalance,
        purchaseCount: vendorBills.length,
        openPurchaseCount: vendorBills.filter(
          (bill) => bill.status !== "completed" && bill.status !== "void",
        ).length,
        totalPurchaseAmount,
        totalExpenseAmount,
      });
    }

    return result;
  }

  async getVendor(
    organizationId: string,
    workspaceId: string,
    id: string,
  ): Promise<Vendor> {
    const vendor = await purchaseRepository.getVendor(
      organizationId,
      workspaceId,
      id,
    );
    if (!vendor) throw new PurchaseNotFoundError("Vendor not found.");
    return vendor;
  }

  async createVendor(
    organizationId: string,
    workspaceId: string,
    input: CreateVendorInput,
  ): Promise<Vendor> {
    if (!input.name.trim()) {
      throw new PurchaseError("Vendor name is required.");
    }
    return purchaseRepository.createVendor(
      organizationId,
      workspaceId,
      input,
    );
  }

  async updateVendor(
    organizationId: string,
    workspaceId: string,
    id: string,
    patch: Partial<CreateVendorInput> & { status?: VendorStatus },
  ): Promise<Vendor> {
    return purchaseRepository.updateVendor(
      organizationId,
      workspaceId,
      id,
      patch,
    );
  }

  async deleteVendor(
    organizationId: string,
    workspaceId: string,
    id: string,
  ): Promise<boolean> {
    return purchaseRepository.deleteVendor(organizationId, workspaceId, id);
  }

  async deleteVendors(
    organizationId: string,
    workspaceId: string,
    ids: string[],
  ): Promise<number> {
    return purchaseRepository.deleteVendors(organizationId, workspaceId, ids);
  }

  async listBills(
    organizationId: string,
    workspaceId: string,
    filter?: PurchaseBillListFilter,
  ): Promise<PurchaseBill[]> {
    return purchaseRepository.listBills(
      organizationId,
      workspaceId,
      filter,
    );
  }

  async getBill(
    organizationId: string,
    workspaceId: string,
    id: string,
  ): Promise<PurchaseBill> {
    const bill = await purchaseRepository.getBill(
      organizationId,
      workspaceId,
      id,
    );
    if (!bill) throw new PurchaseNotFoundError("Purchase bill not found.");
    return bill;
  }

  async createBill(
    organizationId: string,
    workspaceId: string,
    input: CreatePurchaseBillInput,
    createdBy: string,
    actorRole?: string,
  ): Promise<PurchaseBill> {
    const vendor = await this.getVendor(organizationId, workspaceId, input.vendorId);
    if (!vendor) {
      throw new PurchaseNotFoundError(`Vendor ${input.vendorId} not found.`);
    }

    if (vendor.status !== "active") {
      let isAuthorized = false;

      // Option 1: Valid single-use Owner Approval Request
      if (input.approvalId) {
        const approval = await purchaseRepository.getApprovalRequest(organizationId, workspaceId, input.approvalId);
        if (
          approval &&
          approval.vendorId === vendor.id &&
          approval.status === "approved"
        ) {
          isAuthorized = true;
        }
      }

      // Option 2: Explicit Owner Override flag by Owner/Admin role
      if (
        !isAuthorized &&
        input.ownerOverride &&
        (actorRole === "owner" || actorRole === "super_admin" || actorRole === "admin")
      ) {
        isAuthorized = true;
      }

      if (!isAuthorized) {
        if (vendor.status === "blocked") {
          throw new PurchaseError(
            `Vendor ${vendor.name} (${getVendorCode(vendor)}) is blocked by Owner and cannot be used for new purchases.`,
          );
        } else {
          throw new PurchaseError(
            `Vendor ${vendor.name} (${getVendorCode(vendor)}) is inactive and cannot be used for new purchases.`,
          );
        }
      }
    }

    const bill = await purchaseRepository.createBill(
      organizationId,
      workspaceId,
      input,
      createdBy,
    );

    if (input.approvalId) {
      await purchaseRepository.markApprovalUsed(organizationId, workspaceId, input.approvalId, bill.id);
    }

    return bill;
  }

  async blockVendor(
    organizationId: string,
    workspaceId: string,
    id: string,
    reason: string,
    actorId: string,
    actorName?: string,
  ): Promise<Vendor> {
    if (!reason.trim()) {
      throw new PurchaseError("Reason is required to block a vendor.");
    }
    const vendor = await this.getVendor(organizationId, workspaceId, id);
    const updated = await purchaseRepository.updateVendor(organizationId, workspaceId, id, {
      status: "blocked",
    });

    await purchaseRepository.recordStatusAudit({
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      organizationId,
      workspaceId,
      vendorId: id,
      previousStatus: vendor.status,
      newStatus: "blocked",
      reason: reason.trim(),
      changedBy: actorId,
      changedByName: actorName,
      createdAt: new Date().toISOString(),
    });

    return updated;
  }

  async unblockVendor(
    organizationId: string,
    workspaceId: string,
    id: string,
    reason: string,
    actorId: string,
    actorName?: string,
  ): Promise<Vendor> {
    const vendor = await this.getVendor(organizationId, workspaceId, id);
    const updated = await purchaseRepository.updateVendor(organizationId, workspaceId, id, {
      status: "active",
    });

    await purchaseRepository.recordStatusAudit({
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      organizationId,
      workspaceId,
      vendorId: id,
      previousStatus: vendor.status,
      newStatus: "active",
      reason: reason?.trim() || "Unblocked by Owner",
      changedBy: actorId,
      changedByName: actorName,
      createdAt: new Date().toISOString(),
    });

    return updated;
  }

  async setVendorStatus(
    organizationId: string,
    workspaceId: string,
    id: string,
    targetStatus: VendorStatus,
    reason: string,
    actorId: string,
    actorName?: string,
  ): Promise<Vendor> {
    if (targetStatus === "blocked" && !reason.trim()) {
      throw new PurchaseError("Reason is required to block a vendor.");
    }

    const vendor = await this.getVendor(organizationId, workspaceId, id);
    const updated = await purchaseRepository.updateVendor(organizationId, workspaceId, id, {
      status: targetStatus,
    });

    await purchaseRepository.recordStatusAudit({
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      organizationId,
      workspaceId,
      vendorId: id,
      previousStatus: vendor.status,
      newStatus: targetStatus,
      reason: reason?.trim() || `Status updated to ${targetStatus}`,
      changedBy: actorId,
      changedByName: actorName,
      createdAt: new Date().toISOString(),
    });

    return updated;
  }

  async requestVendorApproval(
    organizationId: string,
    workspaceId: string,
    vendorId: string,
    reason: string,
    requestedBy: string,
    requestedByName?: string,
    amount?: number,
    purchaseType?: string,
  ): Promise<VendorApprovalRequest> {
    if (!reason.trim()) {
      throw new PurchaseError("Reason is required for owner approval request.");
    }
    await this.getVendor(organizationId, workspaceId, vendorId);
    const req: VendorApprovalRequest = {
      id: `app-${crypto.randomUUID().slice(0, 8)}`,
      organizationId,
      workspaceId,
      vendorId,
      requestedBy,
      requestedByName,
      reason: reason.trim(),
      amount,
      purchaseType,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    return purchaseRepository.createApprovalRequest(req);
  }

  async approveVendorRequest(
    organizationId: string,
    workspaceId: string,
    approvalId: string,
    approvedBy: string,
    approvedByName?: string,
  ): Promise<VendorApprovalRequest> {
    const existing = await purchaseRepository.getApprovalRequest(organizationId, workspaceId, approvalId);
    if (!existing) {
      throw new PurchaseNotFoundError(`Approval request ${approvalId} not found.`);
    }

    return purchaseRepository.updateApprovalRequest(organizationId, workspaceId, approvalId, {
      status: "approved",
      approvedBy,
      approvedByName,
      decidedAt: new Date().toISOString(),
    });
  }

  async rejectVendorRequest(
    organizationId: string,
    workspaceId: string,
    approvalId: string,
    rejectedBy: string,
    rejectedByName?: string,
    reason?: string,
  ): Promise<VendorApprovalRequest> {
    const existing = await purchaseRepository.getApprovalRequest(organizationId, workspaceId, approvalId);
    if (!existing) {
      throw new PurchaseNotFoundError(`Approval request ${approvalId} not found.`);
    }

    return purchaseRepository.updateApprovalRequest(organizationId, workspaceId, approvalId, {
      status: "rejected",
      rejectedBy,
      rejectedByName,
      rejectionReason: reason,
      decidedAt: new Date().toISOString(),
    });
  }

  async listApprovalRequests(
    organizationId: string,
    workspaceId: string,
    filter?: { vendorId?: string; status?: VendorApprovalStatus },
  ): Promise<VendorApprovalRequest[]> {
    return purchaseRepository.listApprovalRequests(organizationId, workspaceId, filter);
  }

  async transitionBill(
    organizationId: string,
    workspaceId: string,
    id: string,
    status: PurchaseStatus,
  ): Promise<PurchaseBill> {
    return purchaseRepository.transitionBill(
      organizationId,
      workspaceId,
      id,
      status,
    );
  }

  async deleteBill(
    organizationId: string,
    workspaceId: string,
    id: string,
    deletedBy?: string,
  ): Promise<boolean> {
    return purchaseRepository.deleteBill(organizationId, workspaceId, id, deletedBy);
  }

  async restoreBill(
    organizationId: string,
    workspaceId: string,
    id: string,
  ): Promise<PurchaseBill> {
    return purchaseRepository.restoreBill(organizationId, workspaceId, id);
  }

  async permanentDeleteBill(
    organizationId: string,
    workspaceId: string,
    id: string,
  ): Promise<boolean> {
    return purchaseRepository.permanentDeleteBill(organizationId, workspaceId, id);
  }

  async updateBill(
    organizationId: string,
    workspaceId: string,
    id: string,
    patch: Partial<PurchaseBill>,
  ): Promise<PurchaseBill> {
    return purchaseRepository.updateBill(
      organizationId,
      workspaceId,
      id,
      patch,
    );
  }

  async recordPayment(
    organizationId: string,
    workspaceId: string,
    id: string,
    input: {
      paymentMethod: PaymentMethod;
      paymentStatus?: PaymentStatus;
      paymentId?: string;
      amount: number;
      paymentDate: string;
    },
  ): Promise<PurchaseBill> {
    return purchaseRepository.recordPayment(
      organizationId,
      workspaceId,
      id,
      input,
    );
  }

  async receiveGoods(
    organizationId: string,
    workspaceId: string,
    id: string,
  ): Promise<PurchaseBill> {
    return purchaseRepository.receiveGoods(organizationId, workspaceId, id);
  }

  async recordLineDamage(
    organizationId: string,
    workspaceId: string,
    billId: string,
    lineId: string,
    qtyDamaged: number,
  ): Promise<PurchaseBill> {
    return purchaseRepository.recordLineDamage(
      organizationId,
      workspaceId,
      billId,
      lineId,
      qtyDamaged,
    );
  }

  async recordSkuDamage(
    organizationId: string,
    workspaceId: string,
    stockKey: string,
    qtyDamaged: number,
  ): Promise<PurchaseBill[]> {
    return purchaseRepository.recordSkuDamage(
      organizationId,
      workspaceId,
      stockKey,
      qtyDamaged,
    );
  }

  async updateStockItem(
    organizationId: string,
    workspaceId: string,
    stockKey: string,
    patch: { description: string; sku?: string },
  ): Promise<PurchaseBill[]> {
    return purchaseRepository.updateStockItem(
      organizationId,
      workspaceId,
      stockKey,
      patch,
    );
  }

  async listOrders(
    organizationId: string,
    workspaceId: string,
  ): Promise<PurchaseOrder[]> {
    return purchaseRepository.listOrders(organizationId, workspaceId);
  }

  async getOrder(
    organizationId: string,
    workspaceId: string,
    id: string,
  ): Promise<PurchaseOrder> {
    const order = await purchaseRepository.getOrder(organizationId, workspaceId, id);
    if (!order) throw new PurchaseNotFoundError("Purchase Order not found.");
    return order;
  }

  async createOrder(
    organizationId: string,
    workspaceId: string,
    input: CreatePurchaseOrderInput,
    createdBy = "system",
    actorRole?: string,
  ): Promise<PurchaseOrder> {
    const vendor = await this.getVendor(organizationId, workspaceId, input.vendorId);
    if (!vendor) {
      throw new PurchaseNotFoundError(`Vendor ${input.vendorId} not found.`);
    }

    if (vendor.status !== "active") {
      throw new PurchaseError(
        `Vendor ${vendor.name} (${getVendorCode(vendor)}) is ${vendor.status} and cannot be used for new Purchase Orders.`,
      );
    }

    if (!input.lines || input.lines.length === 0) {
      throw new PurchaseError("At least one line item is required for a Purchase Order.");
    }

    const year = new Date().getFullYear();
    const existingOrders = await purchaseRepository.listOrders(organizationId, workspaceId);
    const poSeq = existingOrders.length + 1;
    const poNumber = input.poNumber?.trim() || `PO-${year}-${String(poSeq).padStart(6, "0")}`;

    const buyerStateCode = input.buyerStateCode || DEFAULT_BUYER_STATE_CODE;
    const gstRegistered = vendorIsGstRegistered(vendor.registrationType);
    const interstate = gstRegistered && isInterstateSupply(vendor.gstin, buyerStateCode);

    const itemValue = input.lines.reduce(
      (sum, l) => sum + l.quantity * l.unitPrice,
      0,
    );
    const discount = Math.min(input.discountAmount || 0, itemValue);
    const discountRatio = itemValue > 0 ? discount / itemValue : 0;

    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const calculatedLines = input.lines.map((line) => {
      const lineAmount = line.quantity * line.unitPrice;
      const taxable = lineAmount * (1 - discountRatio);
      const split = splitGst({
        taxable,
        gstRate: gstRegistered ? line.gstRate || 0 : 0,
        interstate,
      });

      totalCgst += split.cgstAmount;
      totalSgst += split.sgstAmount;
      totalIgst += split.igstAmount;

      return {
        ...line,
        amount: lineAmount,
        cgstAmount: split.cgstAmount,
        sgstAmount: split.sgstAmount,
        igstAmount: split.igstAmount,
        taxAmount: split.taxAmount,
      };
    });

    const taxAmount = totalCgst + totalSgst + totalIgst;
    const freight = input.freightAmount || 0;
    const other = input.otherCharges || 0;
    const taxableValue = Math.max(itemValue - discount, 0);
    const exactTotal = taxableValue + taxAmount + freight + other;
    const roundOff = Number((Math.round(exactTotal) - exactTotal).toFixed(2));
    const totalAmount = Number((exactTotal + roundOff).toFixed(2));

    return purchaseRepository.createOrder(organizationId, workspaceId, {
      ...input,
      poNumber,
      vendorName: vendor.name,
      subtotal: itemValue,
      taxPercent: itemValue > 0 ? Number(((taxAmount / itemValue) * 100).toFixed(2)) : 0,
      taxAmount,
      cgstAmount: totalCgst,
      sgstAmount: totalSgst,
      igstAmount: totalIgst,
      roundOff,
      totalAmount,
      interstate,
      buyerStateCode,
      lines: calculatedLines,
      status: input.status || "draft",
    });
  }

  async updateOrderStatus(
    organizationId: string,
    workspaceId: string,
    id: string,
    status: PurchaseOrderStatus,
  ): Promise<PurchaseOrder> {
    return purchaseRepository.updateOrderStatus(organizationId, workspaceId, id, status);
  }
}

export const purchaseService = new PurchaseService();
export { PurchaseError, PurchaseNotFoundError };

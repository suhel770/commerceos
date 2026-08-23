import { db } from "@/lib/db";
import { businessProfileRepository } from "@/lib/business-profile";
import { eventBus } from "@/lib/core/event-bus";

import {
  DEFAULT_BUYER_STATE_CODE,
  extractPanFromGstin,
  isInterstateSupply,
  lookupGstRateByHsn,
  normalizeGstRate,
  splitGst,
  stateCodeFromGstin,
  vendorIsGstRegistered,
} from "./gst";
import {
  canRequireQC,
  canTransitionStatus,
  defaultPaymentStatus,
  isInventoryCoupledType,
  isStockPathType,
  resolveIntentFromPurchaseType,
} from "./routing";
import { stockLineKey } from "./stock-data";
import type {
  BusinessIntent,
  CreatePurchaseBillInput,
  CreatePurchaseOrderInput,
  CreateVendorInput,
  FreightAllocationMode,
  LineQCRecord,
  LineQCStatus,
  PaymentMethod,
  PaymentStatus,
  PurchaseAttachment,
  PurchaseBill,
  PurchaseBillLine,
  PurchaseBillListFilter,
  PurchaseLineItemType,
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderStatus,
  PurchaseStatus,
  PurchaseType,
  Vendor,
  VendorBusinessCategory,
  VendorRegistrationType,
  VendorStatus,
  VendorStatusChangeAudit,
  VendorApprovalRequest,
  VendorApprovalStatus,
} from "./types";
import { PurchaseError, PurchaseNotFoundError } from "./types";
import {
  billAmountPaid,
  billPendingAmount,
  intentToLineItemType,
  getVendorCode,
  lineItemTypeToIntent,
} from "./types";

function nowIso(): string {
  return new Date().toISOString();
}

function toInputDateFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mapPrismaVendorToDomain(raw: any): Vendor {
  return {
    id: raw.id,
    code: raw.code || getVendorCode(raw),
    organizationId: raw.organizationId,
    workspaceId: raw.workspaceId,
    name: raw.name,
    registrationType: (raw.registrationType as VendorRegistrationType) ?? "regular",
    gstin: raw.gstin ?? undefined,
    pan: raw.pan || extractPanFromGstin(raw.gstin) || undefined,
    phone: raw.phone ?? undefined,
    email: raw.email ?? undefined,
    address: raw.address ?? undefined,
    city: raw.city ?? undefined,
    state: raw.state ?? undefined,
    pincode: raw.pincode ?? undefined,
    contactPerson: raw.contactPerson ?? undefined,
    businessCategory: (raw.businessCategory as VendorBusinessCategory) ?? undefined,
    rating: raw.rating ?? undefined,
    bankName: raw.bankName ?? undefined,
    bankAccountName: raw.bankAccountName ?? undefined,
    bankAccountNumber: raw.bankAccountNumber ?? undefined,
    bankIfsc: raw.bankIfsc ?? undefined,
    paymentTermsDays: raw.paymentTermsDays ?? 30,
    leadTimeDays: raw.leadTimeDays ?? 7,
    notes: raw.notes ?? undefined,
    defaultPurchaseIntent: raw.defaultPurchaseIntent ?? undefined,
    allowedPurchaseIntents: raw.allowedPurchaseIntents ?? undefined,
    status: (raw.status as VendorStatus) ?? "active",
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
    updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : String(raw.updatedAt),
  };
}

function mapPrismaLineToDomain(raw: any): PurchaseBillLine {
  return {
    id: raw.id,
    description: raw.description,
    quantity: raw.quantity,
    unitPrice: Number(raw.unitPrice),
    amount: Number(raw.amount),
    qtyDamaged: raw.qtyDamaged ?? 0,
    uom: (raw.uom as any) ?? "pcs",
    sku: raw.sku ?? undefined,
    hsn: raw.hsn ?? undefined,
    productId: raw.productId ?? undefined,
    gstRate: Number(raw.gstRate),
    cgstAmount: Number(raw.cgstAmount),
    sgstAmount: Number(raw.sgstAmount),
    igstAmount: Number(raw.igstAmount),
    taxAmount: Number(raw.taxAmount),
    intent: (raw.intent as BusinessIntent) ?? "sellable",
    lineItemType: (raw.lineItemType as PurchaseLineItemType) ?? undefined,
    freightMode: (raw.freightMode as FreightAllocationMode) ?? undefined,
    qcStatus: (raw.qcStatus as LineQCStatus) ?? undefined,
    qcRecord: (raw.qcRecord as LineQCRecord) ?? undefined,
  };
}

function mapPrismaBillToDomain(raw: any): PurchaseBill {
  const lines: PurchaseBillLine[] = (raw.lines ?? []).map(mapPrismaLineToDomain);
  const attachments: PurchaseAttachment[] = Array.isArray(raw.attachments)
    ? (raw.attachments as PurchaseAttachment[])
    : [];

  const purchaseType = (raw.purchaseType as PurchaseType) ?? "inventory_product";

  return {
    id: raw.id,
    organizationId: raw.organizationId,
    workspaceId: raw.workspaceId,
    billNumber: raw.billNumber,
    poNumber: raw.poNumber ?? undefined,
    poReference: raw.poReference ?? undefined,
    vendorInvoiceNumber: raw.vendorInvoiceNumber ?? undefined,
    vendorId: raw.vendorId,
    vendorName: raw.vendorName,
    purchaseType,
    category: (raw.category as PurchaseType) ?? purchaseType,
    status: (raw.status as PurchaseStatus) ?? "ordered",
    paymentStatus: (raw.paymentStatus as PaymentStatus) ?? "unpaid",
    paymentMethod: (raw.paymentMethod as PaymentMethod) ?? "credit",
    paymentId: raw.paymentId ?? undefined,
    amountPaid: raw.amountPaid ? Number(raw.amountPaid) : 0,
    paymentDate: raw.paymentDate ?? undefined,
    instantSettlement: Boolean(raw.instantSettlement),
    billDate: raw.billDate,
    dueDate: raw.dueDate ?? undefined,
    lines,
    subtotal: Number(raw.subtotal),
    discountAmount: Number(raw.discountAmount),
    taxPercent: Number(raw.taxPercent),
    taxAmount: Number(raw.taxAmount),
    cgstAmount: Number(raw.cgstAmount),
    sgstAmount: Number(raw.sgstAmount),
    igstAmount: Number(raw.igstAmount),
    freightAmount: Number(raw.freightAmount),
    otherCharges: Number(raw.otherCharges),
    roundOff: Number(raw.roundOff),
    totalAmount: Number(raw.totalAmount),
    interstate: Boolean(raw.interstate),
    buyerStateCode: raw.buyerStateCode ?? DEFAULT_BUYER_STATE_CODE,
    buyerGstin: raw.buyerGstin ?? undefined,
    notes: raw.notes ?? undefined,
    billUploadName: raw.billUploadName ?? undefined,
    attachments,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
    updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : String(raw.updatedAt),
    createdBy: raw.createdBy ?? "system",
    createdByName: raw.createdByName ?? undefined,
    updatedBy: raw.updatedBy ?? undefined,
    updatedByName: raw.updatedByName ?? undefined,
    isDeleted: Boolean(raw.isDeleted),
    deletedAt: raw.deletedAt ?? undefined,
    deletedBy: raw.deletedBy ?? undefined,
    deletedByName: raw.deletedByName ?? undefined,
  };
}

function mapPrismaOrderLineToDomain(raw: any): PurchaseOrderLine {
  return {
    id: raw.id,
    poId: raw.poId,
    description: raw.description,
    quantity: Number(raw.quantity),
    receivedQty: raw.receivedQty !== undefined ? Number(raw.receivedQty) : 0,
    billedQty: raw.billedQty !== undefined ? Number(raw.billedQty) : 0,
    unitPrice: Number(raw.unitPrice),
    amount: Number(raw.amount),
    uom: (raw.uom as any) ?? "pcs",
    sku: raw.sku ?? undefined,
    hsn: raw.hsn ?? undefined,
    productId: raw.productId ?? undefined,
    gstRate: Number(raw.gstRate),
    cgstAmount: Number(raw.cgstAmount),
    sgstAmount: Number(raw.sgstAmount),
    igstAmount: Number(raw.igstAmount),
    taxAmount: Number(raw.taxAmount),
    intent: (raw.intent as BusinessIntent) ?? "sellable",
  };
}

function mapPrismaOrderToDomain(raw: any): PurchaseOrder {
  const lines: PurchaseOrderLine[] = (raw.lines ?? []).map(mapPrismaOrderLineToDomain);
  return {
    id: raw.id,
    organizationId: raw.organizationId,
    workspaceId: raw.workspaceId,
    poNumber: raw.poNumber,
    poDate: raw.poDate,
    expectedDeliveryDate: raw.expectedDeliveryDate ?? undefined,
    deliveryWarehouseId: raw.deliveryWarehouseId ?? undefined,
    warehouseCode: raw.warehouseCode ?? undefined,
    deliveryWarehouseName: raw.deliveryWarehouseName ?? undefined,
    currency: raw.currency ?? "INR",
    paymentTerms: raw.paymentTerms ?? "Net 30",
    vendorReference: raw.vendorReference ?? undefined,
    vendorId: raw.vendorId,
    vendorName: raw.vendorName,
    purchaseType: (raw.purchaseType as PurchaseType) ?? "inventory_product",
    status: (raw.status as PurchaseOrderStatus) ?? "DRAFT",
    subtotal: Number(raw.subtotal),
    discountAmount: Number(raw.discountAmount),
    taxPercent: Number(raw.taxPercent),
    taxAmount: Number(raw.taxAmount),
    cgstAmount: Number(raw.cgstAmount),
    sgstAmount: Number(raw.sgstAmount),
    igstAmount: Number(raw.igstAmount),
    freightAmount: Number(raw.freightAmount),
    otherCharges: Number(raw.otherCharges),
    roundOff: Number(raw.roundOff),
    totalAmount: Number(raw.totalAmount),
    interstate: Boolean(raw.interstate),
    buyerStateCode: raw.buyerStateCode ?? DEFAULT_BUYER_STATE_CODE,
    notes: raw.notes ?? undefined,
    termsAndConditions: raw.termsAndConditions ?? undefined,
    internalNotes: raw.internalNotes ?? undefined,
    vendorContact: raw.vendorContact ?? undefined,
    createdBy: raw.createdBy ?? "system",
    createdByName: raw.createdByName ?? undefined,
    updatedBy: raw.updatedBy ?? undefined,
    updatedByName: raw.updatedByName ?? undefined,
    isDeleted: Boolean(raw.isDeleted),
    lines,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt || nowIso()),
    updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : String(raw.updatedAt || nowIso()),
  };
}

export class PrismaPurchaseRepository {
  private fallbackVendors: Vendor[] = [];
  private fallbackBills: PurchaseBill[] = [];
  private fallbackOrders: PurchaseOrder[] = [];
  private fallbackAudits: VendorStatusChangeAudit[] = [];
  private fallbackApprovals: VendorApprovalRequest[] = [];

  reloadFromStorage() {
    // No-op for PostgreSQL DB backed repository
  }

  purgeStorage() {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("commerceos_purchase_bills_v1");
        localStorage.removeItem("commerceos_purchase_vendors_v1");
      } catch {
        // ignore
      }
    }
  }

  private async ensureSeeded(organizationId: string, workspaceId: string): Promise<void> {
    try {
      if (!db?.organization || !db?.workspace) return;
      await db.organization.upsert({
        where: { id: organizationId },
        update: {},
        create: {
          id: organizationId,
          name: "CommerceOS Org",
          slug: `org-${organizationId}`,
        },
      });

      await db.workspace.upsert({
        where: { id: workspaceId },
        update: {},
        create: {
          id: workspaceId,
          organizationId,
          name: "Default Workspace",
          code: "ws-default",
        },
      });
    } catch (err) {
      console.error("Failed to ensure tenant org/workspace in DB:", err);
    }
  }

  async listVendors(organizationId: string, workspaceId: string): Promise<Vendor[]> {
    try {
      if (db?.vendor) {
        await this.ensureSeeded(organizationId, workspaceId);
        const vendors = await db.vendor.findMany({
          where: { organizationId, workspaceId },
          orderBy: { name: "asc" },
        });
        return vendors.map(mapPrismaVendorToDomain);
      }
    } catch (err) {
      console.warn("[PurchaseRepository] DB listVendors failed, using memory fallback:", err);
    }
    return this.listVendorsSync(organizationId, workspaceId);
  }

  listVendorsSync(organizationId: string, workspaceId: string): Vendor[] {
    return structuredClone(
      this.fallbackVendors.filter(
        (v) => v.organizationId === organizationId && v.workspaceId === workspaceId,
      ),
    );
  }

  async getVendor(
    organizationId: string,
    workspaceId: string,
    id: string,
  ): Promise<Vendor | null> {
    try {
      if (db?.vendor) {
        await this.ensureSeeded(organizationId, workspaceId);
        const vendor = await db.vendor.findFirst({
          where: { id, organizationId, workspaceId },
        });
        return vendor ? mapPrismaVendorToDomain(vendor) : null;
      }
    } catch (err) {
      console.warn("[PurchaseRepository] DB getVendor failed, using memory fallback:", err);
    }
    return (
      this.fallbackVendors.find(
        (v) => v.id === id && v.organizationId === organizationId && v.workspaceId === workspaceId,
      ) ?? null
    );
  }

  async createVendor(
    organizationId: string,
    workspaceId: string,
    input: CreateVendorInput,
  ): Promise<Vendor> {
    await this.ensureSeeded(organizationId, workspaceId);
    const id = `ven-${crypto.randomUUID().slice(0, 8)}`;
    const created = await db.vendor.create({
      data: {
        id,
        organizationId,
        workspaceId,
        name: input.name.trim(),
        registrationType: input.registrationType ?? "regular",
        gstin: input.gstin?.trim() || null,
        pan: input.pan?.trim() || extractPanFromGstin(input.gstin?.trim()) || null,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        address: input.address?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        pincode: input.pincode?.trim() || null,
        contactPerson: input.contactPerson?.trim() || null,
        businessCategory: input.businessCategory ?? null,
        rating: input.rating ?? 5.0,
        bankName: input.bankName?.trim() || null,
        bankAccountName: input.bankAccountName?.trim() || null,
        bankAccountNumber: input.bankAccountNumber?.trim() || null,
        bankIfsc: input.bankIfsc?.trim() || null,
        paymentTermsDays: input.paymentTermsDays ?? 30,
        leadTimeDays: input.leadTimeDays ?? 7,
        notes: input.notes?.trim() || null,
        defaultPurchaseIntent: input.defaultPurchaseIntent ?? null,
        allowedPurchaseIntents: input.allowedPurchaseIntents ?? [],
        status: "active",
      },
    });
    return mapPrismaVendorToDomain(created);
  }

  async updateVendor(
    organizationId: string,
    workspaceId: string,
    id: string,
    patch: Partial<CreateVendorInput> & { status?: VendorStatus },
  ): Promise<Vendor> {
    await this.ensureSeeded(organizationId, workspaceId);
    const existing = await db.vendor.findFirst({
      where: { id, organizationId, workspaceId },
    });
    if (!existing) {
      throw new PurchaseNotFoundError("Vendor not found.");
    }
    const updated = await db.vendor.update({
      where: { workspaceId_id: { workspaceId, id } },
      data: {
        name: patch.name !== undefined ? patch.name.trim() : undefined,
        registrationType: patch.registrationType ?? undefined,
        gstin: patch.gstin !== undefined ? (patch.gstin.trim() || null) : undefined,
        pan:
          patch.pan !== undefined
            ? (patch.pan.trim() || extractPanFromGstin(patch.gstin ?? existing.gstin) || null)
            : (existing.pan || extractPanFromGstin(existing.gstin) || null),
        phone: patch.phone !== undefined ? (patch.phone.trim() || null) : undefined,
        email: patch.email !== undefined ? (patch.email.trim() || null) : undefined,
        address: patch.address !== undefined ? (patch.address.trim() || null) : undefined,
        city: patch.city !== undefined ? (patch.city.trim() || null) : undefined,
        state: patch.state !== undefined ? (patch.state.trim() || null) : undefined,
        pincode: patch.pincode !== undefined ? (patch.pincode.trim() || null) : undefined,
        contactPerson: patch.contactPerson !== undefined ? (patch.contactPerson.trim() || null) : undefined,
        businessCategory: patch.businessCategory ?? undefined,
        rating: patch.rating ?? undefined,
        bankName: patch.bankName !== undefined ? (patch.bankName.trim() || null) : undefined,
        bankAccountName: patch.bankAccountName !== undefined ? (patch.bankAccountName.trim() || null) : undefined,
        bankAccountNumber: patch.bankAccountNumber !== undefined ? (patch.bankAccountNumber.trim() || null) : undefined,
        bankIfsc: patch.bankIfsc !== undefined ? (patch.bankIfsc.trim() || null) : undefined,
        paymentTermsDays: patch.paymentTermsDays ?? undefined,
        leadTimeDays: patch.leadTimeDays ?? undefined,
        notes: patch.notes !== undefined ? (patch.notes?.trim() || null) : undefined,
        defaultPurchaseIntent: patch.defaultPurchaseIntent !== undefined ? (patch.defaultPurchaseIntent || null) : undefined,
        allowedPurchaseIntents: patch.allowedPurchaseIntents ?? undefined,
        status: patch.status ?? undefined,
      },
    });
    return mapPrismaVendorToDomain(updated);
  }

  async deleteVendor(
    organizationId: string,
    workspaceId: string,
    id: string,
  ): Promise<boolean> {
    await this.ensureSeeded(organizationId, workspaceId);
    try {
      if (db?.vendor) {
        await db.vendor.deleteMany({
          where: { id, organizationId, workspaceId },
        });
        return true;
      }
    } catch (err) {
      console.warn("[PurchaseRepository] DB deleteVendor failed, fallback memory update:", err);
    }
    this.fallbackVendors = this.fallbackVendors.filter(
      (v) => !(v.id === id && v.organizationId === organizationId && v.workspaceId === workspaceId),
    );
    return true;
  }

  async deleteVendors(
    organizationId: string,
    workspaceId: string,
    ids: string[],
  ): Promise<number> {
    await this.ensureSeeded(organizationId, workspaceId);
    if (!ids.length) return 0;
    try {
      if (db?.vendor) {
        const res = await db.vendor.deleteMany({
          where: {
            id: { in: ids },
            organizationId,
            workspaceId,
          },
        });
        return res.count;
      }
    } catch (err) {
      console.warn("[PurchaseRepository] DB deleteVendors failed, fallback memory update:", err);
    }
    const set = new Set(ids);
    const prevLen = this.fallbackVendors.length;
    this.fallbackVendors = this.fallbackVendors.filter(
      (v) => !(set.has(v.id) && v.organizationId === organizationId && v.workspaceId === workspaceId),
    );
    return prevLen - this.fallbackVendors.length;
  }

  async recordStatusAudit(audit: VendorStatusChangeAudit): Promise<void> {
    this.fallbackAudits.unshift(audit);
  }

  async listStatusAudits(
    organizationId: string,
    workspaceId: string,
    vendorId?: string,
  ): Promise<VendorStatusChangeAudit[]> {
    return this.fallbackAudits.filter(
      (a) =>
        a.organizationId === organizationId &&
        a.workspaceId === workspaceId &&
        (!vendorId || a.vendorId === vendorId),
    );
  }

  async createApprovalRequest(
    request: VendorApprovalRequest,
  ): Promise<VendorApprovalRequest> {
    this.fallbackApprovals.unshift(request);
    return request;
  }

  async getApprovalRequest(
    organizationId: string,
    workspaceId: string,
    id: string,
  ): Promise<VendorApprovalRequest | null> {
    return (
      this.fallbackApprovals.find(
        (req) =>
          req.id === id &&
          req.organizationId === organizationId &&
          req.workspaceId === workspaceId,
      ) ?? null
    );
  }

  async updateApprovalRequest(
    organizationId: string,
    workspaceId: string,
    id: string,
    patch: Partial<VendorApprovalRequest>,
  ): Promise<VendorApprovalRequest> {
    const idx = this.fallbackApprovals.findIndex(
      (req) =>
        req.id === id &&
        req.organizationId === organizationId &&
        req.workspaceId === workspaceId,
    );
    if (idx === -1) {
      throw new PurchaseNotFoundError(`Approval request ${id} not found.`);
    }
    const updated = {
      ...this.fallbackApprovals[idx]!,
      ...patch,
    };
    this.fallbackApprovals[idx] = updated;
    return updated;
  }

  async listApprovalRequests(
    organizationId: string,
    workspaceId: string,
    filter: { vendorId?: string; status?: VendorApprovalStatus } = {},
  ): Promise<VendorApprovalRequest[]> {
    return this.fallbackApprovals.filter((req) => {
      if (req.organizationId !== organizationId || req.workspaceId !== workspaceId) {
        return false;
      }
      if (filter.vendorId && req.vendorId !== filter.vendorId) return false;
      if (filter.status && req.status !== filter.status) return false;
      return true;
    });
  }

  async markApprovalUsed(
    organizationId: string,
    workspaceId: string,
    id: string,
    purchaseBillId: string,
  ): Promise<void> {
    const idx = this.fallbackApprovals.findIndex(
      (req) =>
        req.id === id &&
        req.organizationId === organizationId &&
        req.workspaceId === workspaceId,
    );
    if (idx !== -1) {
      this.fallbackApprovals[idx] = {
        ...this.fallbackApprovals[idx]!,
        purchaseBillId,
      };
    }
  }

  async listBills(
    organizationId: string,
    workspaceId: string,
    filter: PurchaseBillListFilter = {},
  ): Promise<PurchaseBill[]> {
    try {
      if (db?.purchaseBill) {
        await this.ensureSeeded(organizationId, workspaceId);
        const purchaseType = filter.purchaseType ?? filter.category;
        const search = filter.search?.trim().toLowerCase();

        const where: any = {
          organizationId,
          workspaceId,
        };

        if (filter.deletedOnly) {
          where.isDeleted = true;
        } else if (!filter.includeDeleted) {
          where.isDeleted = false;
        }

        if (purchaseType) where.purchaseType = purchaseType;
        if (filter.vendorId) where.vendorId = filter.vendorId;
        if (filter.status) where.status = filter.status;
        if (filter.paymentStatus) where.paymentStatus = filter.paymentStatus;

        const rawBills = await db.purchaseBill.findMany({
          where,
          include: { lines: true, payments: true },
          orderBy: { billDate: "desc" },
        });

        let result = rawBills.map(mapPrismaBillToDomain);

        if (search) {
          result = result.filter((bill) => {
            const haystack = [
              bill.billNumber,
              bill.vendorName,
              bill.vendorInvoiceNumber ?? "",
              bill.purchaseType,
              bill.notes ?? "",
              ...bill.lines.map((line) => line.description),
            ]
              .join(" ")
              .toLowerCase();
            return haystack.includes(search);
          });
        }

        return result;
      }
    } catch (err) {
      console.warn("[PurchaseRepository] DB listBills failed, using memory fallback:", err);
    }
    return this.listBillsSync(organizationId, workspaceId, filter);
  }

  listBillsSync(
    organizationId: string,
    workspaceId: string,
    filter: PurchaseBillListFilter = {},
  ): PurchaseBill[] {
    const purchaseType = filter.purchaseType ?? filter.category;
    return structuredClone(
      this.fallbackBills.filter((bill) => {
        if (bill.organizationId !== organizationId || bill.workspaceId !== workspaceId) {
          return false;
        }
        if (purchaseType && bill.purchaseType !== purchaseType) return false;
        return true;
      }),
    );
  }

  async getBill(
    organizationId: string,
    workspaceId: string,
    id: string,
  ): Promise<PurchaseBill | null> {
    try {
      if (db?.purchaseBill) {
        await this.ensureSeeded(organizationId, workspaceId);
        const raw = await db.purchaseBill.findFirst({
          where: {
            organizationId,
            workspaceId,
            OR: [
              { id: { equals: id, mode: "insensitive" } },
              { billNumber: { equals: id, mode: "insensitive" } },
            ],
          },
          include: { lines: true, payments: true },
        });

        return raw ? mapPrismaBillToDomain(raw) : null;
      }
    } catch (err) {
      console.warn("[PurchaseRepository] DB getBill failed, using memory fallback:", err);
    }
    return (
      this.fallbackBills.find(
        (b) =>
          b.organizationId === organizationId &&
          b.workspaceId === workspaceId &&
          (b.id.toLowerCase() === id.toLowerCase() || b.billNumber.toLowerCase() === id.toLowerCase()),
      ) ?? null
    );
  }

  async createBill(
    organizationId: string,
    workspaceId: string,
    input: CreatePurchaseBillInput,
    createdBy: string,
  ): Promise<PurchaseBill> {
    await this.ensureSeeded(organizationId, workspaceId);
    const vendor = await this.getVendor(organizationId, workspaceId, input.vendorId);
    if (!vendor) {
      throw new PurchaseNotFoundError("Vendor not found.");
    }
    if (vendor.status !== "active") {
      throw new PurchaseError("Cannot bill an inactive vendor.");
    }
    if (!input.lines.length) {
      throw new PurchaseError("Add at least one line item.");
    }

    const discountAmount = input.discountAmount ?? 0;
    const freightAmount = input.freightAmount ?? 0;
    const otherCharges = input.otherCharges ?? 0;
    const paymentMethod: PaymentMethod = input.paymentMethod ?? "unpaid";
    const status: PurchaseStatus =
      input.status ??
      (paymentMethod === "unpaid" || paymentMethod === "credit"
        ? "ordered"
        : "completed");
    const paymentStatus =
      input.paymentStatus ??
      (paymentMethod === "unpaid" || paymentMethod === "credit"
        ? defaultPaymentStatus(status)
        : "paid");

    const buyerProfile = businessProfileRepository.get();
    const buyerGstin = buyerProfile.gstin;
    const buyerStateCode =
      stateCodeFromGstin(buyerGstin) ||
      businessProfileRepository.getBuyerStateCode() ||
      input.buyerStateCode?.trim() ||
      DEFAULT_BUYER_STATE_CODE;
    const gstRegistered = vendorIsGstRegistered(vendor.registrationType);
    const interstate = gstRegistered && isInterstateSupply(vendor.gstin, buyerStateCode);

    const rawSubtotal = Number(
      input.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0).toFixed(2),
    );
    const discountRatio = rawSubtotal > 0 ? Math.min(discountAmount / rawSubtotal, 1) : 0;

    const lines = input.lines.map((line, index) => {
      const quantity = Math.round(line.quantity);
      const unitPrice = line.unitPrice;
      const amount = Number((quantity * unitPrice).toFixed(2));
      const taxable = Number((amount * (1 - discountRatio)).toFixed(2));
      const rawRate =
        line.gstRate ??
        lookupGstRateByHsn(line.hsn) ??
        input.taxPercent ??
        18;
      const gstRate = gstRegistered ? normalizeGstRate(rawRate) : 0;
      const split = splitGst({ taxable, gstRate, interstate });
      const intent =
        (line.lineItemType
          ? lineItemTypeToIntent(line.lineItemType)
          : line.intent) ?? resolveIntentFromPurchaseType(input.purchaseType);
      const lineItemType = line.lineItemType ?? intentToLineItemType(intent);
      const freightMode = line.freightMode ?? (intent === "freight" ? "expense" : undefined);
      const qcStatus: LineQCStatus = canRequireQC(intent, {
        physicalStorageReceivingRequired: line.physicalStorageReceivingRequired,
      })
        ? "pending"
        : "not_applicable";

      return {
        id: `line-${crypto.randomUUID().slice(0, 8)}-${index + 1}`,
        description: line.description.trim(),
        quantity,
        unitPrice,
        amount,
        uom: line.uom ?? "pcs",
        sku: line.sku?.trim() || undefined,
        hsn: line.hsn?.trim() || undefined,
        productId: line.productId?.trim() || undefined,
        gstRate,
        qtyDamaged: 0,
        cgstAmount: split.cgstAmount,
        sgstAmount: split.sgstAmount,
        igstAmount: split.igstAmount,
        taxAmount: split.taxAmount,
        intent,
        lineItemType,
        physicalStorageReceivingRequired: line.physicalStorageReceivingRequired,
        freightMode,
        qcStatus,
      };
    });

    const subtotal = Number(lines.reduce((sum, line) => sum + line.amount, 0).toFixed(2));
    const cgstAmount = Number(lines.reduce((sum, line) => sum + line.cgstAmount, 0).toFixed(2));
    const sgstAmount = Number(lines.reduce((sum, line) => sum + line.sgstAmount, 0).toFixed(2));
    const igstAmount = Number(lines.reduce((sum, line) => sum + line.igstAmount, 0).toFixed(2));
    const taxAmount = Number((cgstAmount + sgstAmount + igstAmount).toFixed(2));
    const taxPercent =
      subtotal > 0
        ? Number(
            (
              (lines.reduce((sum, line) => sum + line.gstRate * line.amount, 0) / subtotal)
            ).toFixed(2),
          )
        : 0;
    const exactSubtotal =
      Math.max(subtotal - discountAmount, 0) + taxAmount + freightAmount + otherCharges;
    const roundOff =
      input.roundOff !== undefined
        ? input.roundOff
        : Number((Math.round(exactSubtotal) - exactSubtotal).toFixed(2));
    const totalAmount = Number((exactSubtotal + roundOff).toFixed(2));

    const maxBillCount = await db.purchaseBill.count({
      where: { organizationId, workspaceId },
    });
    const billNumber = `BILL-${1001 + maxBillCount}`;

    let dueDate = input.dueDate;
    if (!dueDate && vendor.paymentTermsDays > 0) {
      const due = new Date(input.billDate);
      due.setDate(due.getDate() + vendor.paymentTermsDays);
      dueDate = toInputDateFromDate(due);
    }

    const attachments: PurchaseAttachment[] = (input.attachments ?? []).map(
      (attachment, index) => ({
        id: `att-${crypto.randomUUID().slice(0, 8)}-${index + 1}`,
        name: attachment.name.trim(),
        kind: attachment.kind ?? "other",
      }),
    );
    if (input.billUploadName?.trim()) {
      attachments.unshift({
        id: `att-${crypto.randomUUID().slice(0, 8)}-bill`,
        name: input.billUploadName.trim(),
        kind: "bill",
      });
    }

    const isInstantPaid = Boolean(input.instantSettlement || paymentStatus === "paid");
    const billId = `bill-${crypto.randomUUID().slice(0, 8)}`;

    const createdBill = await db.$transaction(async (tx) => {
      const created = await tx.purchaseBill.create({
        data: {
          id: billId,
          organizationId,
          workspaceId,
          billNumber,
          poNumber: input.poNumber?.trim() || input.poReference?.trim() || null,
          poReference: input.poReference?.trim() || input.poNumber?.trim() || null,
          vendorInvoiceNumber: input.vendorInvoiceNumber?.trim() || null,
          vendorId: vendor.id,
          vendorName: vendor.name,
          purchaseType: input.purchaseType,
          category: input.purchaseType,
          status,
          paymentStatus: isInstantPaid ? "paid" : paymentStatus,
          paymentMethod: isInstantPaid ? (input.paymentMethod ?? "cash") : paymentMethod,
          paymentId: isInstantPaid ? (input.paymentId ?? `set-${Date.now()}`) : null,
          amountPaid: isInstantPaid ? totalAmount : (paymentStatus === "paid" ? totalAmount : 0),
          paymentDate: isInstantPaid ? input.billDate : (paymentStatus === "paid" ? input.billDate : null),
          instantSettlement: isInstantPaid,
          billDate: input.billDate,
          dueDate,
          subtotal,
          discountAmount,
          taxPercent,
          taxAmount,
          cgstAmount,
          sgstAmount,
          igstAmount,
          freightAmount,
          otherCharges,
          roundOff,
          totalAmount,
          interstate,
          buyerStateCode,
          buyerGstin: buyerGstin || null,
          notes: input.notes?.trim() || null,
          billUploadName: input.billUploadName?.trim() || null,
          attachments: attachments.length > 0 ? (attachments as any) : undefined,
          createdBy: createdBy || "Amir",
          createdByName: input.createdByName || "Amir (Solo Seller)",
          lines: {
            create: lines.map((line) => ({
              id: line.id,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              amount: line.amount,
              qtyDamaged: 0,
              uom: line.uom,
              sku: line.sku || null,
              hsn: line.hsn || null,
              productId: line.productId || null,
              gstRate: line.gstRate,
              cgstAmount: line.cgstAmount,
              sgstAmount: line.sgstAmount,
              igstAmount: line.igstAmount,
              taxAmount: line.taxAmount,
              intent: line.intent,
              lineItemType: line.lineItemType || null,
              freightMode: line.freightMode || null,
              qcStatus: line.qcStatus || null,
            })),
          },
        },
        include: { lines: true, payments: true },
      });
      return created;
    });

    const domainBill = mapPrismaBillToDomain(createdBill);

    eventBus.publish({
      type: "PurchaseBillApproved",
      payload: {
        billId: domainBill.id,
        billNumber: domainBill.billNumber,
        totalAmount: domainBill.totalAmount,
        vendorId: domainBill.vendorId,
        vendorName: domainBill.vendorName,
        instantSettlement: domainBill.instantSettlement,
      },
    });

    return domainBill;
  }

  async recordLineDamage(
    organizationId: string,
    workspaceId: string,
    billId: string,
    lineId: string,
    qtyDamaged: number,
  ): Promise<PurchaseBill> {
    await this.ensureSeeded(organizationId, workspaceId);
    const bill = await this.getBill(organizationId, workspaceId, billId);
    if (!bill) {
      throw new PurchaseNotFoundError("Purchase bill not found.");
    }
    if (bill.status === "void") {
      throw new PurchaseError("Cannot record damage on a void bill.");
    }

    const line = bill.lines.find((l) => l.id === lineId);
    if (!line) {
      throw new PurchaseNotFoundError("Bill line not found.");
    }
    const damaged = Number(qtyDamaged);
    if (!Number.isFinite(damaged) || damaged < 0) {
      throw new PurchaseError("Damage quantity must be zero or greater.");
    }
    if (damaged > line.quantity) {
      throw new PurchaseError(
        `Damage quantity cannot exceed purchased qty (${line.quantity}).`,
      );
    }

    await db.purchaseBillLine.update({
      where: { billId_id: { billId: bill.id, id: lineId } },
      data: { qtyDamaged: Number(damaged.toFixed(3)) },
    });

    const updated = await this.getBill(organizationId, workspaceId, bill.id);
    return updated!;
  }

  async recordSkuDamage(
    organizationId: string,
    workspaceId: string,
    stockKey: string,
    qtyDamaged: number,
  ): Promise<PurchaseBill[]> {
    await this.ensureSeeded(organizationId, workspaceId);
    const key = stockKey.trim();
    if (!key) {
      throw new PurchaseError("Stock item key is required.");
    }
    const damagedTotal = Number(qtyDamaged);
    if (!Number.isFinite(damagedTotal) || damagedTotal < 0) {
      throw new PurchaseError("Damage quantity must be zero or greater.");
    }

    const bills = await this.listBills(organizationId, workspaceId);
    const stockBills = bills.filter(
      (b) => b.status !== "void" && isStockPathType(b.purchaseType),
    );

    type Hit = {
      billId: string;
      lineId: string;
      billDate: string;
      quantity: number;
    };

    const hits: Hit[] = [];
    stockBills.forEach((bill) => {
      bill.lines.forEach((line) => {
        if (stockLineKey(line) === key) {
          hits.push({
            billId: bill.id,
            lineId: line.id,
            billDate: bill.billDate,
            quantity: line.quantity,
          });
        }
      });
    });

    if (hits.length === 0) {
      throw new PurchaseNotFoundError("No purchase lines found for this item.");
    }

    const purchased = hits.reduce((sum, hit) => sum + hit.quantity, 0);
    if (damagedTotal > purchased) {
      throw new PurchaseError(
        `Damage quantity cannot exceed purchased qty (${purchased}).`,
      );
    }

    hits.sort((a, b) => b.billDate.localeCompare(a.billDate));

    let remaining = damagedTotal;
    const touchedBillIds = new Set<string>();

    for (const hit of hits) {
      const take = Math.min(remaining, hit.quantity);
      await db.purchaseBillLine.update({
        where: { billId_id: { billId: hit.billId, id: hit.lineId } },
        data: { qtyDamaged: Number(take.toFixed(3)) },
      });
      touchedBillIds.add(hit.billId);
      remaining = Number((remaining - take).toFixed(3));
    }

    const updatedBills = await Promise.all(
      Array.from(touchedBillIds).map((bId) => this.getBill(organizationId, workspaceId, bId)),
    );
    return updatedBills.filter((b): b is PurchaseBill => b !== null);
  }

  async updateStockItem(
    organizationId: string,
    workspaceId: string,
    stockKey: string,
    patch: { description: string; sku?: string },
  ): Promise<PurchaseBill[]> {
    await this.ensureSeeded(organizationId, workspaceId);
    const key = stockKey.trim();
    if (!key) {
      throw new PurchaseError("Stock item key is required.");
    }
    const description = patch.description.trim();
    if (!description) {
      throw new PurchaseError("Item name is required.");
    }
    const sku = patch.sku?.trim() || undefined;

    const bills = await this.listBills(organizationId, workspaceId);
    const touchedBillIds = new Set<string>();

    for (const bill of bills) {
      if (bill.status === "void" || !isStockPathType(bill.purchaseType)) continue;
      for (const line of bill.lines) {
        if (stockLineKey(line) === key) {
          await db.purchaseBillLine.update({
            where: { billId_id: { billId: bill.id, id: line.id } },
            data: { description, sku: sku ?? null },
          });
          touchedBillIds.add(bill.id);
        }
      }
    }

    if (touchedBillIds.size === 0) {
      throw new PurchaseNotFoundError("No purchase lines found for this item.");
    }

    const updatedBills = await Promise.all(
      Array.from(touchedBillIds).map((bId) => this.getBill(organizationId, workspaceId, bId)),
    );
    return updatedBills.filter((b): b is PurchaseBill => b !== null);
  }

  async transitionBill(
    organizationId: string,
    workspaceId: string,
    id: string,
    to: PurchaseStatus,
  ): Promise<PurchaseBill> {
    await this.ensureSeeded(organizationId, workspaceId);
    const bill = await this.getBill(organizationId, workspaceId, id);
    if (!bill) {
      throw new PurchaseNotFoundError("Purchase bill not found.");
    }

    if (!canTransitionStatus(bill.purchaseType, bill.status, to)) {
      throw new PurchaseError(
        `Cannot move ${bill.purchaseType} from ${bill.status} to ${to}.`,
      );
    }

    await db.purchaseBill.update({
      where: { workspaceId_id: { workspaceId, id: bill.id } },
      data: { status: to },
    });

    const updated = await this.getBill(organizationId, workspaceId, bill.id);
    return updated!;
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
    await this.ensureSeeded(organizationId, workspaceId);
    const bill = await this.getBill(organizationId, workspaceId, id);
    if (!bill) {
      throw new PurchaseNotFoundError("Purchase bill not found.");
    }
    if (bill.status === "void") {
      throw new PurchaseError("Cannot record payment on a void bill.");
    }
    if (bill.status === "draft") {
      throw new PurchaseError("Finish the draft before recording payment.");
    }

    const method = input.paymentMethod;
    if (method === "unpaid") {
      throw new PurchaseError("Choose a paid payment method.");
    }

    const pendingBefore = billPendingAmount(bill);
    if (pendingBefore <= 0) {
      throw new PurchaseError("This bill is already fully paid.");
    }

    const payingNow = Number(input.amount);
    if (!Number.isFinite(payingNow) || payingNow <= 0) {
      throw new PurchaseError("Payment amount must be greater than zero.");
    }
    if (payingNow > pendingBefore + 0.009) {
      throw new PurchaseError(
        `Payment amount cannot exceed pending ${pendingBefore.toFixed(2)}.`,
      );
    }

    const paymentDate = input.paymentDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
      throw new PurchaseError("Payment date must be YYYY-MM-DD.");
    }

    const previouslyPaid = billAmountPaid(bill);
    const amountPaid = Number(
      Math.min(bill.totalAmount, previouslyPaid + payingNow).toFixed(2),
    );
    const remaining = Number((bill.totalAmount - amountPaid).toFixed(2));

    const paymentStatus: PaymentStatus =
      remaining <= 0.009 ? "paid" : amountPaid > 0 ? "partial" : "unpaid";

    const status: PurchaseStatus =
      paymentStatus === "paid" &&
      (bill.status === "ordered" || bill.status === "received" || bill.status === "qc")
        ? "completed"
        : bill.status;

    const paymentId = input.paymentId?.trim() || undefined;

    await db.$transaction(async (tx) => {
      await tx.purchasePayment.create({
        data: {
          id: `pay-${crypto.randomUUID().slice(0, 8)}`,
          workspaceId,
          billId: bill.id,
          amount: payingNow,
          paymentMethod: method,
          paymentDate,
          referenceId: paymentId || null,
        },
      });

      await tx.purchaseBill.update({
        where: { workspaceId_id: { workspaceId, id: bill.id } },
        data: {
          paymentMethod: method,
          paymentStatus,
          paymentId: paymentId || null,
          amountPaid: paymentStatus === "paid" ? bill.totalAmount : amountPaid,
          paymentDate,
          status,
        },
      });
    });

    const updated = await this.getBill(organizationId, workspaceId, bill.id);
    return updated!;
  }

  async receiveGoods(
    organizationId: string,
    workspaceId: string,
    id: string,
  ): Promise<PurchaseBill> {
    await this.ensureSeeded(organizationId, workspaceId);
    const bill = await this.getBill(organizationId, workspaceId, id);
    if (!bill) {
      throw new PurchaseNotFoundError("Purchase bill not found.");
    }
    if (bill.status === "void") {
      throw new PurchaseError("Cannot receive goods on a void bill.");
    }
    if (!isStockPathType(bill.purchaseType)) {
      throw new PurchaseError(
        "Receive Goods applies to inventory / packaging purchases only.",
      );
    }
    if (bill.status === "completed") {
      throw new PurchaseError("This purchase is already completed.");
    }
    if (bill.status === "draft") {
      throw new PurchaseError("Order the purchase before receiving goods.");
    }

    const to: PurchaseStatus =
      bill.status === "ordered" || bill.status === "received" || bill.status === "qc"
        ? "completed"
        : bill.status;

    if (to === bill.status) {
      throw new PurchaseError(
        `Cannot receive goods from status ${bill.status}.`,
      );
    }

    await db.purchaseBill.update({
      where: { workspaceId_id: { workspaceId, id: bill.id } },
      data: { status: to },
    });

    const updated = await this.getBill(organizationId, workspaceId, bill.id);
    return updated!;
  }

  async updateBillStatus(billId: string, newStatus: PurchaseStatus): Promise<PurchaseBill> {
    const raw = await db.purchaseBill.findFirst({
      where: {
        OR: [
          { id: { equals: billId, mode: "insensitive" } },
          { billNumber: { equals: billId, mode: "insensitive" } },
        ],
      },
    });
    if (!raw) {
      throw new PurchaseNotFoundError(`Purchase bill ${billId} not found.`);
    }

    await db.purchaseBill.update({
      where: { id: raw.id },
      data: { status: newStatus },
    });

    const updated = await db.purchaseBill.findUnique({
      where: { id: raw.id },
      include: { lines: true, payments: true },
    });
    return mapPrismaBillToDomain(updated);
  }

  async listEligibleForReceiving(searchQuery?: string, filterTab?: string): Promise<PurchaseBill[]> {
    const bills = await this.listBills("org-commerceos", "ws-default");
    const q = searchQuery ? searchQuery.trim().toLowerCase() : "";
    const todayStr = nowIso().split("T")[0];

    return bills.filter((bill) => {
      if (!isInventoryCoupledType(bill.purchaseType)) return false;
      if (
        bill.status === "draft" ||
        bill.status === "completed" ||
        bill.status === "received" ||
        bill.status === "void"
      ) {
        return false;
      }
      if (filterTab === "waiting") {
        if (bill.paymentStatus !== "unpaid" && bill.status !== "ordered") return false;
      } else if (filterTab === "partial") {
        if (bill.paymentStatus !== "partial" && bill.status !== "partially_received") return false;
      } else if (filterTab === "today") {
        if (bill.billDate !== todayStr) return false;
      } else if (filterTab === "late") {
        if (bill.billDate >= todayStr) return false;
      }

      if (!q) return true;

      const billNo = bill.billNumber.toLowerCase();
      const invNo = (bill.vendorInvoiceNumber || "").toLowerCase();
      const vName = (bill.vendorName || "").toLowerCase();
      const rawDigits = q.replace(/\D/g, "");

      if (billNo.includes(q) || invNo.includes(q) || vName.includes(q)) return true;
      if (rawDigits && (billNo.includes(rawDigits) || invNo.includes(rawDigits))) return true;

      return bill.lines.some(
        (item) =>
          (item.description || "").toLowerCase().includes(q) ||
          (item.sku || "").toLowerCase().includes(q),
      );
    });
  }

  async listInventoryReceivableBills(searchQuery?: string, filterTab?: string): Promise<PurchaseBill[]> {
    return this.listEligibleForReceiving(searchQuery, filterTab);
  }

  async canReceive(billIdOrNumber: string): Promise<boolean> {
    const bill = await db.purchaseBill.findFirst({
      where: {
        OR: [
          { id: { equals: billIdOrNumber, mode: "insensitive" } },
          { billNumber: { equals: billIdOrNumber, mode: "insensitive" } },
        ],
      },
    });
    if (!bill) return false;
    return (
      bill.status !== "draft" &&
      bill.status !== "completed" &&
      bill.status !== "received" &&
      bill.status !== "void"
    );
  }

  async canEdit(billIdOrNumber: string): Promise<boolean> {
    const bill = await db.purchaseBill.findFirst({
      where: {
        OR: [
          { id: { equals: billIdOrNumber, mode: "insensitive" } },
          { billNumber: { equals: billIdOrNumber, mode: "insensitive" } },
        ],
      },
    });
    if (!bill) return false;
    return bill.status === "draft" || bill.status === "ordered";
  }

  async canCancel(billIdOrNumber: string): Promise<boolean> {
    const bill = await db.purchaseBill.findFirst({
      where: {
        OR: [
          { id: { equals: billIdOrNumber, mode: "insensitive" } },
          { billNumber: { equals: billIdOrNumber, mode: "insensitive" } },
        ],
      },
    });
    if (!bill) return false;
    return bill.status !== "completed" && bill.status !== "void";
  }

  async canPartiallyReceive(billIdOrNumber: string): Promise<boolean> {
    return this.canReceive(billIdOrNumber);
  }

  async canGenerateGrn(billIdOrNumber: string): Promise<boolean> {
    return this.canReceive(billIdOrNumber);
  }

  async deleteBill(
    organizationId: string,
    workspaceId: string,
    id: string,
    deletedBy: string = "Amir (Solo Seller)",
  ): Promise<boolean> {
    await this.ensureSeeded(organizationId, workspaceId);
    const bill = await this.getBill(organizationId, workspaceId, id);
    if (!bill) return false;

    await db.purchaseBill.update({
      where: { workspaceId_id: { workspaceId, id: bill.id } },
      data: {
        isDeleted: true,
        createdBy: deletedBy,
      },
    });
    return true;
  }

  async restoreBill(
    organizationId: string,
    workspaceId: string,
    id: string,
  ): Promise<PurchaseBill> {
    await this.ensureSeeded(organizationId, workspaceId);
    const bill = await this.getBill(organizationId, workspaceId, id);
    if (!bill) {
      throw new PurchaseNotFoundError("Purchase bill not found.");
    }
    await db.purchaseBill.update({
      where: { workspaceId_id: { workspaceId, id: bill.id } },
      data: { isDeleted: false },
    });
    const updated = await this.getBill(organizationId, workspaceId, bill.id);
    return updated!;
  }

  async permanentDeleteBill(
    organizationId: string,
    workspaceId: string,
    id: string,
  ): Promise<boolean> {
    await this.ensureSeeded(organizationId, workspaceId);
    const bill = await this.getBill(organizationId, workspaceId, id);
    if (!bill) return false;

    await db.purchaseBill.delete({
      where: { workspaceId_id: { workspaceId, id: bill.id } },
    });
    return true;
  }

  async updateBill(
    organizationId: string,
    workspaceId: string,
    id: string,
    patch: Partial<PurchaseBill>,
  ): Promise<PurchaseBill> {
    await this.ensureSeeded(organizationId, workspaceId);
    const bill = await this.getBill(organizationId, workspaceId, id);
    const purchaseType: PurchaseType =
      patch.purchaseType ?? patch.category ?? bill?.purchaseType ?? "inventory_product";

    if (!bill) {
      const created = await db.purchaseBill.create({
        data: {
          id,
          organizationId,
          workspaceId,
          billNumber: id.toUpperCase().startsWith("BILL-")
            ? id.toUpperCase()
            : `BILL-${id.toUpperCase()}`,
          vendorId: patch.vendorId ?? "vnd-default",
          vendorName: patch.vendorName ?? "Supplier",
          purchaseType,
          category: purchaseType,
          status: patch.status ?? "completed",
          paymentStatus: patch.paymentStatus ?? "unpaid",
          paymentMethod: patch.paymentMethod ?? "credit",
          billDate: patch.billDate ?? nowIso().slice(0, 10),
          subtotal: patch.subtotal ?? 0,
          discountAmount: patch.discountAmount ?? 0,
          taxPercent: patch.taxPercent ?? 0,
          taxAmount: patch.taxAmount ?? 0,
          cgstAmount: patch.cgstAmount ?? 0,
          sgstAmount: patch.sgstAmount ?? 0,
          igstAmount: patch.igstAmount ?? 0,
          freightAmount: patch.freightAmount ?? 0,
          otherCharges: patch.otherCharges ?? 0,
          roundOff: patch.roundOff ?? 0,
          totalAmount: patch.totalAmount ?? 0,
          interstate: patch.interstate ?? false,
          buyerStateCode: patch.buyerStateCode ?? DEFAULT_BUYER_STATE_CODE,
          createdBy: patch.createdBy ?? "Amir",
        },
        include: { lines: true, payments: true },
      });
      return mapPrismaBillToDomain(created);
    }

    await db.purchaseBill.update({
      where: { workspaceId_id: { workspaceId, id: bill.id } },
      data: {
        purchaseType,
        category: purchaseType,
        status: patch.status ?? undefined,
        paymentStatus: patch.paymentStatus ?? undefined,
        paymentMethod: patch.paymentMethod ?? undefined,
        notes: patch.notes !== undefined ? (patch.notes?.trim() || null) : undefined,
      },
    });

    const updated = await this.getBill(organizationId, workspaceId, bill.id);
    return updated!;
  }

  async handleReceivingCompletedEvent(payload: { billId: string; isPartial: boolean }): Promise<PurchaseBill> {
    const raw = await db.purchaseBill.findFirst({
      where: {
        OR: [
          { id: { equals: payload.billId, mode: "insensitive" } },
          { billNumber: { equals: payload.billId, mode: "insensitive" } },
        ],
      },
    });
    if (!raw) return null as any;

    const nextStatus: PurchaseStatus = payload.isPartial ? "partially_received" : "completed";
    await db.purchaseBill.update({
      where: { id: raw.id },
      data: { status: nextStatus },
    });

    const updated = await db.purchaseBill.findUnique({
      where: { id: raw.id },
      include: { lines: true, payments: true },
    });
    return mapPrismaBillToDomain(updated);
  }

  async outstandingForVendor(
    organizationId: string,
    workspaceId: string,
    vendorId: string,
  ): Promise<number> {
    const bills = await this.listBills(organizationId, workspaceId, { vendorId });
    return bills
      .filter((b) => b.status !== "void" && b.paymentStatus !== "paid")
      .reduce((sum, b) => sum + billPendingAmount(b), 0);
  }

  async createOrder(
    organizationId: string,
    workspaceId: string,
    input: CreatePurchaseOrderInput & {
      poNumber: string;
      vendorName: string;
      subtotal: number;
      taxPercent: number;
      taxAmount: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      roundOff: number;
      totalAmount: number;
      interstate: boolean;
      buyerStateCode: string;
      lines: Array<any>;
    },
  ): Promise<PurchaseOrder> {
    try {
      const created = await db.purchaseOrder.create({
        data: {
          organizationId,
          workspaceId,
          poNumber: input.poNumber,
          poDate: input.poDate,
          expectedDeliveryDate: input.expectedDeliveryDate || null,
          deliveryWarehouseId: input.deliveryWarehouseId || null,
          warehouseCode: input.warehouseCode || null,
          deliveryWarehouseName: input.deliveryWarehouseName || null,
          currency: input.currency || "INR",
          paymentTerms: input.paymentTerms || "Net 30",
          vendorReference: input.vendorReference || null,
          vendorId: input.vendorId,
          vendorName: input.vendorName,
          purchaseType: input.purchaseType || "inventory_product",
          status: input.status || "DRAFT",
          subtotal: input.subtotal,
          discountAmount: input.discountAmount || 0,
          taxPercent: input.taxPercent || 0,
          taxAmount: input.taxAmount,
          cgstAmount: input.cgstAmount,
          sgstAmount: input.sgstAmount,
          igstAmount: input.igstAmount,
          freightAmount: input.freightAmount || 0,
          otherCharges: input.otherCharges || 0,
          roundOff: input.roundOff || 0,
          totalAmount: input.totalAmount,
          interstate: input.interstate,
          buyerStateCode: input.buyerStateCode,
          notes: input.notes || null,
          termsAndConditions: input.termsAndConditions || null,
          internalNotes: input.internalNotes || null,
          vendorContact: input.vendorContact || null,
          createdBy: "Amir",
          lines: {
            create: input.lines.map((l) => ({
              workspaceId,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              amount: (l as any).amount ?? l.quantity * l.unitPrice,
              uom: l.uom || "pcs",
              sku: l.sku || null,
              hsn: l.hsn || null,
              productId: l.productId || null,
              gstRate: l.gstRate || 0,
              cgstAmount: (l as any).cgstAmount ?? 0,
              sgstAmount: (l as any).sgstAmount ?? 0,
              igstAmount: (l as any).igstAmount ?? 0,
              taxAmount: (l as any).taxAmount ?? 0,
              intent: l.intent || "sellable",
            })),
          },
        },
        include: { lines: true },
      });
      return mapPrismaOrderToDomain(created);
    } catch (err: any) {
      console.warn("[PurchaseRepository] DB createOrder failed, falling back to memory:", err?.message);
      const order: PurchaseOrder = {
        id: `po-${Date.now()}`,
        organizationId,
        workspaceId,
        poNumber: input.poNumber,
        poDate: input.poDate,
        expectedDeliveryDate: input.expectedDeliveryDate,
        deliveryWarehouseId: input.deliveryWarehouseId,
        warehouseCode: input.warehouseCode,
        deliveryWarehouseName: input.deliveryWarehouseName,
        currency: input.currency || "INR",
        paymentTerms: input.paymentTerms || "Net 30",
        vendorReference: input.vendorReference,
        vendorId: input.vendorId,
        vendorName: input.vendorName,
        purchaseType: input.purchaseType || "inventory_product",
        status: input.status || "draft",
        subtotal: input.subtotal,
        discountAmount: input.discountAmount || 0,
        taxPercent: input.taxPercent || 0,
        taxAmount: input.taxAmount,
        cgstAmount: input.cgstAmount,
        sgstAmount: input.sgstAmount,
        igstAmount: input.igstAmount,
        freightAmount: input.freightAmount || 0,
        otherCharges: input.otherCharges || 0,
        roundOff: input.roundOff || 0,
        totalAmount: input.totalAmount,
        interstate: input.interstate,
        buyerStateCode: input.buyerStateCode,
        notes: input.notes,
        termsAndConditions: input.termsAndConditions,
        internalNotes: input.internalNotes,
        vendorContact: input.vendorContact,
        createdBy: "Amir",
        isDeleted: false,
        lines: input.lines.map((l, i) => ({
          id: `pol-${i + 1}`,
          poId: `po-${Date.now()}`,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          amount: (l as any).amount ?? l.quantity * l.unitPrice,
          uom: l.uom || "pcs",
          sku: l.sku,
          hsn: l.hsn,
          productId: l.productId,
          gstRate: l.gstRate || 0,
          cgstAmount: (l as any).cgstAmount ?? 0,
          sgstAmount: (l as any).sgstAmount ?? 0,
          igstAmount: (l as any).igstAmount ?? 0,
          taxAmount: (l as any).taxAmount ?? 0,
          intent: l.intent || "sellable",
        })),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      this.fallbackOrders.push(order);
      return order;
    }
  }

  async getOrder(organizationId: string, workspaceId: string, id: string): Promise<PurchaseOrder | null> {
    try {
      const raw = await db.purchaseOrder.findFirst({
        where: {
          workspaceId,
          isDeleted: false,
          OR: [{ id }, { poNumber: id }],
        },
        include: { lines: true },
      });
      if (raw) return mapPrismaOrderToDomain(raw);
    } catch (err: any) {
      console.warn("[PurchaseRepository] DB getOrder failed, using memory:", err?.message);
    }
    const mem = this.fallbackOrders.find((o) => o.id === id || o.poNumber === id);
    return mem || null;
  }

  async listOrders(organizationId: string, workspaceId: string): Promise<PurchaseOrder[]> {
    try {
      const list = await db.purchaseOrder.findMany({
        where: { workspaceId, isDeleted: false },
        include: { lines: true },
        orderBy: { createdAt: "desc" },
      });
      return list.map(mapPrismaOrderToDomain);
    } catch (err: any) {
      console.warn("[PurchaseRepository] DB listOrders failed, returning memory:", err?.message);
      return [...this.fallbackOrders];
    }
  }

  async updateOrderStatus(organizationId: string, workspaceId: string, id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    try {
      const updated = await db.purchaseOrder.update({
        where: { workspaceId_id: { workspaceId, id } },
        data: { status },
        include: { lines: true },
      });
      return mapPrismaOrderToDomain(updated);
    } catch (err: any) {
      console.warn("[PurchaseRepository] DB updateOrderStatus failed, updating memory:", err?.message);
      const mem = this.fallbackOrders.find((o) => o.id === id || o.poNumber === id);
      if (mem) {
        mem.status = status;
        mem.updatedAt = nowIso();
        return mem;
      }
      throw new PurchaseNotFoundError("Purchase Order not found.");
    }
  }
}

export const purchaseRepository = new PrismaPurchaseRepository();

eventBus.subscribe<{ billId?: string; poNumber?: string; isPartial?: boolean }>(
  "warehouse.receiving.completed",
  async (event) => {
    const payload = event.payload;
    if (payload && (payload.poNumber || payload.billId)) {
      try {
        await purchaseRepository.handleReceivingCompletedEvent({
          billId: payload.poNumber || payload.billId!,
          isPartial: Boolean(payload.isPartial),
        });
      } catch {
        // Ignore if bill already updated
      }
    }
  },
);

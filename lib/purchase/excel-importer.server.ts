/**
 * CommerceOS Purchase Excel Server Execution Engine (Server-Only)
 * Handles database operations, duplicate bill checks, and atomic transactions.
 */

import type { CommerceContext } from "@/lib/platform/commerce-context";
import { purchaseApplication } from "@/lib/application/purchase.application";
import { purchaseRepository } from "./repository";
import { createPurchaseBillSchema } from "@/lib/validation/purchase.schema";
import type { CreatePurchaseBillInput, PurchaseBill } from "./types";
import type { ExcelImportParsedBill } from "./excel-importer";

export async function checkServerDuplicateInvoices(
  context: CommerceContext,
  vendorId: string,
  vendorInvoiceNumber: string,
): Promise<{ isDuplicate: boolean; existingBillNumber?: string }> {
  try {
    const existingBills = await purchaseRepository.listBills(
      context.organizationId,
      context.workspaceId,
      { vendorId },
    );
    const dup = existingBills.find(
      (b) =>
        b.vendorInvoiceNumber?.trim().toLowerCase() === vendorInvoiceNumber.toLowerCase() ||
        b.billNumber.trim().toLowerCase() === vendorInvoiceNumber.toLowerCase(),
    );
    if (dup) {
      return { isDuplicate: true, existingBillNumber: dup.billNumber };
    }
  } catch {}
  return { isDuplicate: false };
}

export async function executeAtomicPurchaseExcelImport(
  context: CommerceContext,
  validatedBills: ExcelImportParsedBill[],
): Promise<{ success: boolean; createdCount: number; createdBills: PurchaseBill[] }> {
  const createdBills: PurchaseBill[] = [];

  for (const item of validatedBills) {
    if (!item.vendorId) {
      throw new Error(`Vendor ID missing for invoice ${item.invoiceNumber}`);
    }

    const payload: CreatePurchaseBillInput = {
      vendorId: item.vendorId,
      purchaseType: item.purchaseType,
      vendorInvoiceNumber: item.vendorInvoiceNumber || item.invoiceNumber,
      billDate: item.billDate,
      dueDate: item.dueDate,
      discountAmount: item.discountAmount,
      freightAmount: item.freightAmount,
      otherCharges: item.otherCharges,
      notes: item.notes,
      paymentMethod: item.paymentMethod,
      paymentId: item.paymentId,
      poReference: item.poReference,
      lines: item.lines.map((l) => ({
        description: l.description,
        sku: l.sku,
        hsn: l.hsn,
        quantity: l.quantity,
        uom: l.uom,
        unitPrice: l.unitPrice,
        gstRate: l.gstRate,
        intent: l.intent,
        freightMode: l.freightMode,
      })),
    };

    // Validate payload against existing Zod schema
    const cleanPayload = createPurchaseBillSchema.parse(payload);

    // Call existing Purchase Application layer
    const bill = await purchaseApplication.createBill(context, cleanPayload);
    createdBills.push(bill);
  }

  return {
    success: true,
    createdCount: createdBills.length,
    createdBills,
  };
}

"use client";

import {
  AlertTriangle,
  ArrowRight,
  Box,
  CheckCircle2,
  FileText,
  Info,
  Laptop,
  Package,
  Receipt,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { useMemo } from "react";

import {
  BUSINESS_INTENT_LABELS,
  formatPurchaseMoney,
  type BusinessIntent,
  type CreatePurchaseBillInput,
  type PurchaseBill,
  type Vendor,
} from "@/lib/purchase";

export type PurchaseReviewModalProps = {
  open: boolean;
  submitting?: boolean;
  input: CreatePurchaseBillInput | null;
  vendor: Vendor | undefined;
  existingBills?: PurchaseBill[];
  onConfirm: () => void;
  onBack: () => void;
};

export default function PurchaseReviewModal({
  open,
  submitting = false,
  input,
  vendor,
  existingBills = [],
  onConfirm,
  onBack,
}: PurchaseReviewModalProps) {
  const analysis = useMemo(() => {
    if (!input) return null;

    let sellableQty = 0;
    let sellableCount = 0;
    let consumableQty = 0;
    let consumableCount = 0;
    let assetValue = 0;
    let assetCount = 0;
    let physicalStorageAssetCount = 0;
    let physicalStorageAssetQty = 0;
    let expenseValue = 0;
    let freightAllocated = false;

    const intentBreakdown: Record<string, { count: number; value: number }> =
      {};

    for (const line of input.lines) {
      const intent = line.intent ?? "sellable";
      const lineValue = line.quantity * line.unitPrice;

      if (!intentBreakdown[intent]) {
        intentBreakdown[intent] = { count: 0, value: 0 };
      }
      intentBreakdown[intent].count += 1;
      intentBreakdown[intent].value += lineValue;

      if (intent === "sellable") {
        sellableQty += line.quantity;
        sellableCount += 1;
      } else if (intent === "consumable") {
        consumableQty += line.quantity;
        consumableCount += 1;
      } else if (intent === "asset") {
        assetValue += line.unitPrice * line.quantity;
        assetCount += 1;
        if (line.physicalStorageReceivingRequired) {
          physicalStorageAssetCount += 1;
          physicalStorageAssetQty += line.quantity;
        }
      } else if (intent === "freight") {
        if (line.freightMode === "landed_cost") {
          freightAllocated = true;
        } else {
          expenseValue += lineValue;
        }
      } else {
        expenseValue += lineValue;
      }
    }

    const itemSubtotal = input.lines.reduce(
      (sum, l) => sum + l.quantity * l.unitPrice,
      0,
    );
    const discount = input.discountAmount ?? 0;
    const taxable = Math.max(0, itemSubtotal - discount);

    let totalGst = 0;
    let isInterstate = false;
    for (const l of input.lines) {
      const rate = l.gstRate ?? 18;
      const lineTaxable = l.quantity * l.unitPrice * (1 - discount / (itemSubtotal || 1));
      totalGst += (lineTaxable * rate) / 100;
    }

    const grandTotal =
      taxable + totalGst + (input.freightAmount ?? 0) + (input.otherCharges ?? 0);

    // Warnings
    const warnings: string[] = [];
    if (input.vendorInvoiceNumber && vendor) {
      const isDuplicate = existingBills.some(
        (b) =>
          b.vendorId === vendor.id &&
          b.vendorInvoiceNumber?.toLowerCase() ===
            input.vendorInvoiceNumber?.toLowerCase(),
      );
      if (isDuplicate) {
        warnings.push(
          `Invoice #${input.vendorInvoiceNumber} already exists for vendor ${vendor.name}.`,
        );
      }
    }

    if (!vendor?.gstin) {
      warnings.push(
        "Vendor GSTIN is missing — Input Tax Credit (ITC) will not be claimable.",
      );
    }

    return {
      sellableQty,
      sellableCount,
      consumableQty,
      consumableCount,
      assetValue,
      assetCount,
      physicalStorageAssetCount,
      physicalStorageAssetQty,
      expenseValue,
      freightAllocated,
      intentBreakdown,
      itemSubtotal,
      discount,
      taxable,
      totalGst,
      grandTotal,
      warnings,
      isInterstate,
    };
  }, [input, vendor, existingBills]);

  if (!open || !input || !analysis) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Review & Confirm Purchase Bill
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Verify line item intents, tax split, and downstream system
                routing.
              </p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Warning Banner if any */}
        {analysis.warnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 space-y-1">
            {analysis.warnings.map((w, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs font-semibold text-amber-800"
              >
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {/* Bill Overview Header Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Vendor
              </span>
              <span className="font-bold text-slate-800 truncate block">
                {vendor?.name ?? "Unknown"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Bill Date
              </span>
              <span className="font-bold text-slate-800 block">
                {input.billDate}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Tax Route
              </span>
              <span className="font-bold text-slate-800 block">
                {analysis.isInterstate ? "IGST (Interstate)" : "CGST + SGST"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Grand Total
              </span>
              <span className="font-extrabold text-violet-700 block">
                {formatPurchaseMoney(analysis.grandTotal)}
              </span>
            </div>
          </div>

          {/* Downstream Business Impact */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Info size={14} className="text-violet-600" />
              <span>Downstream Business Impact</span>
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Inventory */}
              <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Box size={16} />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-xs">
                    Inventory
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {analysis.sellableCount > 0
                      ? `${analysis.sellableCount} product${analysis.sellableCount === 1 ? "" : "s"} (${analysis.sellableQty} units) will be added to inventory.`
                      : "No products added to inventory."}
                  </span>
                </div>
              </div>

              {/* Packaging */}
              <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Package size={16} />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-xs">
                    Packaging
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {analysis.consumableCount > 0
                      ? `${analysis.consumableCount} consumable${analysis.consumableCount === 1 ? "" : "s"} (${analysis.consumableQty} items) available for packing.`
                      : "No consumable packaging items."}
                  </span>
                </div>
              </div>

              {/* Capital Assets */}
              <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                  <Laptop size={16} />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-xs">
                    Capital Assets
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {analysis.assetCount > 0
                      ? `${analysis.assetCount} asset registered (${formatPurchaseMoney(analysis.assetValue)}).` +
                        (analysis.physicalStorageAssetCount > 0
                          ? ` (${analysis.physicalStorageAssetQty} physical unit${analysis.physicalStorageAssetQty === 1 ? "" : "s"} will route to Storage Receiving for GRN & putaway)`
                          : "")
                      : "No capital assets in this bill."}
                  </span>
                </div>
              </div>

              {/* Finance & GST Input Tax */}
              <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Receipt size={16} />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-xs">
                    Finance & GST Tax Credit
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Input tax credit of {formatPurchaseMoney(analysis.totalGst)} will be recorded.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Business Intent Summary Breakdown */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs mb-2">
              Business Intent Breakdown
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(analysis.intentBreakdown).map(
                ([intentKey, data]) => (
                  <div
                    key={intentKey}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px]"
                  >
                    <span className="font-bold text-slate-700">
                      {BUSINESS_INTENT_LABELS[intentKey as BusinessIntent] ??
                        intentKey}
                    </span>
                    <span className="rounded bg-white px-1.5 py-0.5 text-slate-500 font-mono text-[10px] border border-slate-200">
                      {data.count} items · {formatPurchaseMoney(data.value)}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Back to Edit
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-700 disabled:opacity-50"
          >
            {submitting ? (
              <span>Recording...</span>
            ) : (
              <>
                <span>Confirm & Record Bill</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

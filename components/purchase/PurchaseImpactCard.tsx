"use client";

import { useMemo } from "react";
import {
  Box,
  CheckCircle2,
  FileText,
  Info,
  Laptop,
  Package,
  Receipt,
  ShieldAlert,
  Sparkles,
  Truck,
} from "lucide-react";

import {
  BUSINESS_INTENT_LABELS,
  formatPurchaseMoney,
  type BusinessIntent,
  type FreightAllocationMode,
} from "@/lib/purchase";

export type ImpactLineInput = {
  intent: BusinessIntent;
  quantity: number;
  unitPrice: number;
  amount: number;
  description: string;
  freightMode?: FreightAllocationMode;
};

export type PurchaseImpactCardProps = {
  lines: ImpactLineInput[];
  freightAmount?: number;
  allocateFreightToLandedCost?: boolean;
  gstAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  interstate?: boolean;
  vendorName?: string;
};

export default function PurchaseImpactCard({
  lines,
  freightAmount = 0,
  allocateFreightToLandedCost = false,
  gstAmount = 0,
  cgstAmount = 0,
  sgstAmount = 0,
  igstAmount = 0,
  interstate = false,
  vendorName,
}: PurchaseImpactCardProps) {
  const analysis = useMemo(() => {
    let sellableQty = 0;
    let sellableItemsCount = 0;
    let consumableQty = 0;
    let consumableItemsCount = 0;
    let assetCount = 0;
    let assetTotal = 0;
    let expenseTotal = 0;
    let expenseItemsCount = 0;

    for (const line of lines) {
      if (line.intent === "sellable") {
        sellableQty += line.quantity;
        sellableItemsCount += 1;
      } else if (line.intent === "consumable") {
        consumableQty += line.quantity;
        consumableItemsCount += 1;
      } else if (line.intent === "asset") {
        assetCount += 1;
        assetTotal += line.amount;
      } else if (
        line.intent === "expense" ||
        line.intent === "service" ||
        line.intent === "marketing" ||
        line.intent === "other"
      ) {
        expenseItemsCount += 1;
        expenseTotal += line.amount;
      } else if (line.intent === "freight") {
        if (line.freightMode === "landed_cost") {
          // allocated to landed cost
        } else {
          expenseItemsCount += 1;
          expenseTotal += line.amount;
        }
      }
    }

    return {
      sellableQty,
      sellableItemsCount,
      consumableQty,
      consumableItemsCount,
      assetCount,
      assetTotal,
      expenseItemsCount,
      expenseTotal,
    };
  }, [lines]);

  const hasAnyItems = lines.some((l) => l.description.trim().length > 0);

  return (
    <div className="rounded-xl border border-sky-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900 to-sky-950/40 p-4 text-slate-100 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              CommerceOS Purchase Impact Preview
            </h4>
            <p className="text-[11px] text-slate-400">
              Downstream engine routing & financial ledger preview before saving
            </p>
          </div>
        </div>
        <span className="rounded-full bg-sky-950 px-2.5 py-0.5 text-[10px] font-medium text-sky-300 border border-sky-800">
          Line-Item Driven
        </span>
      </div>

      {!hasAnyItems ? (
        <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
          <Info className="h-4 w-4 text-slate-500 shrink-0" />
          <span>Add item lines above to preview inventory, asset, and finance impacts.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Inventory Impact Box */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3">
            <div className="flex items-center gap-2 text-emerald-400 font-medium mb-1.5">
              <Package className="h-4 w-4" />
              <span>Inventory Impact</span>
            </div>
            {analysis.sellableItemsCount > 0 ? (
              <p className="text-[11px] text-emerald-200">
                <span className="font-semibold text-emerald-400">
                  {analysis.sellableQty} units ({analysis.sellableItemsCount} SKUs)
                </span>{" "}
                will enter the <span className="underline decoration-emerald-500/50">Receiving Engine</span> queue for stock update.
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">No sellable inventory lines in this bill.</p>
            )}

            {analysis.consumableItemsCount > 0 && (
              <div className="mt-2 pt-2 border-t border-emerald-900/50 flex items-center gap-1.5 text-[11px] text-emerald-300">
                <Box className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>
                  {analysis.consumableQty} units packaging supplies → Packing Inventory (never sellable).
                </span>
              </div>
            )}
          </div>

          {/* Asset & Finance Impact Box */}
          <div className="rounded-lg border border-purple-500/20 bg-purple-950/20 p-3">
            <div className="flex items-center gap-2 text-purple-400 font-medium mb-1.5">
              <Laptop className="h-4 w-4" />
              <span>Asset & Finance Impact</span>
            </div>
            {analysis.assetCount > 0 && (
              <p className="text-[11px] text-purple-200 mb-1">
                <span className="font-semibold text-purple-300">
                  {analysis.assetCount} Asset(s) ({formatPurchaseMoney(analysis.assetTotal)})
                </span>{" "}
                will be registered in the Asset Register.
              </p>
            )}
            {analysis.expenseItemsCount > 0 || analysis.expenseTotal > 0 ? (
              <p className="text-[11px] text-purple-200">
                <span className="font-semibold text-purple-300">
                  {formatPurchaseMoney(analysis.expenseTotal)}
                </span>{" "}
                expense entries generated for Finance Ledger.
              </p>
            ) : analysis.assetCount === 0 ? (
              <p className="text-[11px] text-slate-400">No direct asset or operating expense lines.</p>
            ) : null}

            {freightAmount > 0 && (
              <div className="mt-2 pt-2 border-t border-purple-900/50 flex items-center gap-1.5 text-[11px] text-amber-300">
                <Truck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>
                  Freight ({formatPurchaseMoney(freightAmount)}):{" "}
                  {allocateFreightToLandedCost
                    ? "Allocated to Product Landed Cost"
                    : "Finance Transport Expense"}
                </span>
              </div>
            )}
          </div>

          {/* GST & Tax Ledger Box */}
          <div className="rounded-lg border border-indigo-500/20 bg-indigo-950/20 p-3">
            <div className="flex items-center gap-2 text-indigo-400 font-medium mb-1.5">
              <Receipt className="h-4 w-4" />
              <span>GST Tax Ledger</span>
            </div>
            <p className="text-[11px] text-indigo-200">
              Tax Mode:{" "}
              <span className="font-semibold text-indigo-300">
                {interstate ? "Inter-State (IGST)" : "Intra-State (CGST + SGST)"}
              </span>
            </p>
            <div className="mt-1 text-[11px] text-slate-300 space-y-0.5">
              {interstate ? (
                <div>IGST (Input Tax): <span className="font-mono font-medium text-indigo-300">{formatPurchaseMoney(igstAmount || gstAmount)}</span></div>
              ) : (
                <>
                  <div>CGST: <span className="font-mono font-medium text-indigo-300">{formatPurchaseMoney(cgstAmount || gstAmount / 2)}</span></div>
                  <div>SGST: <span className="font-mono font-medium text-indigo-300">{formatPurchaseMoney(sgstAmount || gstAmount / 2)}</span></div>
                </>
              )}
            </div>
            <div className="mt-2 text-[10px] text-slate-400">
              Input Tax Credit (ITC) recorded for GST return reconciliation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

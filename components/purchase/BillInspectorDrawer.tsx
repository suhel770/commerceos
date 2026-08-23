"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Eye, Pencil, Printer, Trash2, X, AlertTriangle, PackageCheck, Receipt, CheckCircle2 } from "lucide-react";
import { locationStockRepository } from "@/lib/storage/engine/receiving.engine";

import {
  openPurchaseBillPdf,
  PURCHASE_STATUS_LABELS,
  PURCHASE_TYPE_LABELS,
  formatPurchaseMoney,
  isStockPathType,
  lineDamagedQty,
  lineSellableQty,
  type PurchaseBill,
  type Vendor,
} from "@/lib/purchase";

import { paymentLabel, workflowLabel } from "./purchase-ops";

type BillInspectorDrawerProps = {
  bill: PurchaseBill | null;
  vendor?: Vendor | null;
  onClose(): void;
  onEditBill?: (bill: PurchaseBill) => void;
  onDeleteBill?: (billId: string) => void;
};

export default function BillInspectorDrawer({
  bill,
  vendor,
  onClose,
  onEditBill,
  onDeleteBill,
}: BillInspectorDrawerProps) {
  const open = Boolean(bill);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const totalDamagedInBill = bill?.lines.reduce((sum, line) => sum + lineDamagedQty(line), 0) ?? 0;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {bill ? (
        <>
          <motion.button
            type="button"
            aria-label="Close bill details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] cursor-default bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`Bill ${bill.billNumber}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="fixed inset-y-0 right-0 z-[100] flex h-screen w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl"
          >
            <header className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                    Bill details
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {bill.billNumber}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {bill.vendorName}
                    {bill.vendorInvoiceNumber
                      ? ` · Inv ${bill.vendorInvoiceNumber}`
                      : ""}
                    {` · ${bill.lines.length} ${bill.lines.length === 1 ? "item" : "items"}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void openPurchaseBillPdf(bill, vendor, "view")}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Eye size={14} />
                  View PDF
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void openPurchaseBillPdf(bill, vendor, "print")
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Printer size={14} />
                  Print PDF
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void openPurchaseBillPdf(bill, vendor, "download")
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-700"
                >
                  <Download size={14} />
                  Download PDF
                </button>
                {onEditBill ? (
                  <button
                    type="button"
                    onClick={() => {
                      onEditBill(bill);
                      onClose();
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                  >
                    <Pencil size={14} />
                    Edit Bill
                  </button>
                ) : null}
                {onDeleteBill ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to delete/void purchase bill ${bill.billNumber}?`,
                        )
                      ) {
                        onDeleteBill(bill.id);
                        onClose();
                      }
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    <Trash2 size={14} />
                    Delete Bill
                  </button>
                ) : null}
              </div>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {actionMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-900 shadow-sm animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{actionMsg}</span>
                </div>
              )}

              {/* DAMAGED GOODS WORKFLOW ACTIONS PANEL */}
              {totalDamagedInBill > 0 && (
                <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-3 font-sans">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                      <h3 className="text-xs font-black uppercase text-amber-900 tracking-wide">
                        Damaged Goods Actions ({totalDamagedInBill} pcs)
                      </h3>
                    </div>
                    <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-black text-amber-900 uppercase">
                      Action Available
                    </span>
                  </div>

                  <p className="text-xs text-amber-800 font-medium">
                    {bill.vendorName} has {totalDamagedInBill} pcs damaged. Choose how to handle them:
                  </p>

                  <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
                    {/* 1. Receive Replacement */}
                    <button
                      type="button"
                      onClick={() => {
                        const qtyStr = prompt(
                          `Vendor is sending fresh replacement stock.\nEnter replacement quantity (max ${totalDamagedInBill}):`,
                          String(totalDamagedInBill)
                        );
                        if (!qtyStr) return;
                        const qty = parseInt(qtyStr, 10);
                        if (!qty || qty <= 0) return;
                        const replacedQty = Math.min(qty, totalDamagedInBill);

                        locationStockRepository.addStock({
                          storageLocationId: "LOC-2045",
                          productId: bill.lines[0]?.id || "p1",
                          sku: bill.lines[0]?.sku || "SKU-001",
                          productName: bill.lines[0]?.description || "Item",
                          intent: "sellable",
                          availableQty: replacedQty,
                          receivedFromBillId: bill.id,
                        });

                        setActionMsg(`✓ Successfully received ${replacedQty} replacement pcs into Sellable Storage Stock!`);
                      }}
                      className="flex flex-col items-center justify-center rounded-xl border border-emerald-300 bg-white p-2.5 text-center text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-50 transition-colors"
                    >
                      <PackageCheck className="h-4 w-4 text-emerald-600 mb-1" />
                      <span>Receive Swap</span>
                      <span className="text-[9px] font-normal text-emerald-600">Stock in fresh pcs</span>
                    </button>

                    {/* 2. Claim Debit Note */}
                    <button
                      type="button"
                      onClick={() => {
                        let damagedValue = 0;
                        bill.lines.forEach((l) => {
                          damagedValue += lineDamagedQty(l) * l.unitPrice;
                        });
                        setActionMsg(`✓ Claimed Debit Note of ${formatPurchaseMoney(damagedValue)} against ${bill.vendorName}!`);
                      }}
                      className="flex flex-col items-center justify-center rounded-xl border border-indigo-300 bg-white p-2.5 text-center text-xs font-bold text-indigo-800 shadow-xs hover:bg-indigo-50 transition-colors"
                    >
                      <Receipt className="h-4 w-4 text-indigo-600 mb-1" />
                      <span>Debit Note Claim</span>
                      <span className="text-[9px] font-normal text-indigo-600">Vendor refund/credit</span>
                    </button>

                    {/* 3. Scrap Disposal */}
                    <button
                      type="button"
                      onClick={() => {
                        setActionMsg(`✓ Marked ${totalDamagedInBill} damaged pcs as Written-Off Scrap.`);
                      }}
                      className="flex flex-col items-center justify-center rounded-xl border border-rose-300 bg-white p-2.5 text-center text-xs font-bold text-rose-800 shadow-xs hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-rose-600 mb-1" />
                      <span>Scrap Write-Off</span>
                      <span className="text-[9px] font-normal text-rose-600">Dispose damaged items</span>
                    </button>
                  </div>
                </section>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Meta label="Date" value={bill.billDate} />
                <Meta label="Due" value={bill.dueDate ?? "—"} />
                <Meta
                  label="Type"
                  value={PURCHASE_TYPE_LABELS[bill.purchaseType]}
                />
                <Meta label="Status" value={workflowLabel(bill.status)} />
                <Meta
                  label="Payment"
                  value={paymentLabel(bill.paymentStatus)}
                />
                <Meta
                  label="Method"
                  value={bill.paymentMethod.replaceAll("_", " ")}
                />
                {bill.paymentDate ? (
                  <Meta label="Payment date" value={bill.paymentDate} />
                ) : null}
                {bill.paymentId ? (
                  <Meta label="Payment ID" value={bill.paymentId} />
                ) : null}
                <Meta
                  label="Amount paid"
                  value={formatPurchaseMoney(
                    typeof bill.amountPaid === "number"
                      ? bill.amountPaid
                      : bill.paymentStatus === "paid"
                        ? bill.totalAmount
                        : 0,
                  )}
                />
                <Meta
                  label="Tax mode"
                  value={bill.interstate ? "IGST (interstate)" : "CGST + SGST"}
                />
                <Meta label="Attachment" value={bill.billUploadName ?? "—"} />
              </div>

              <section id="bill-purchased-items">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                    Purchased items
                  </h3>
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                    {bill.lines.length}{" "}
                    {bill.lines.length === 1 ? "item" : "items"}
                  </span>
                </div>
                {bill.lines.length === 0 ? (
                  <p className="mt-2 rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
                    No line items on this bill.
                  </p>
                ) : (
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-3 py-2.5 font-bold">#</th>
                          <th className="px-3 py-2.5 font-bold">Item</th>
                          <th className="px-2 py-2.5 text-right font-bold">
                            Qty
                          </th>
                          {isStockPathType(bill.purchaseType) ? (
                            <>
                              <th className="px-2 py-2.5 text-right font-bold">
                                Dmg
                              </th>
                              <th className="px-2 py-2.5 text-right font-bold">
                                Sell
                              </th>
                            </>
                          ) : null}
                          <th className="px-2 py-2.5 text-right font-bold">
                            Rate
                          </th>
                          <th className="px-3 py-2.5 text-right font-bold">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bill.lines.map((line, index) => {
                          const damaged = lineDamagedQty(line);
                          const sellable = lineSellableQty(line);
                          return (
                            <tr
                              key={line.id ? `${line.id}-${index}` : `line-${index}-${line.sku || ""}`}
                              className="border-t border-slate-100 align-top text-xs"
                            >
                              <td className="px-3 py-2.5 text-slate-400 font-medium">
                                {index + 1}
                              </td>
                              <td className="px-3 py-2.5">
                                <p className="font-bold text-slate-900 text-xs">
                                  {line.description}
                                </p>
                                <p className="text-xs text-slate-500 font-mono">
                                  {[
                                    line.sku,
                                    line.hsn ? `HSN ${line.hsn}` : null,
                                    `${line.gstRate}% GST`,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              </td>
                              <td className="px-2 py-2.5 text-right font-semibold text-slate-700 font-mono">
                                {line.quantity}
                                <span className="ml-1 text-xs text-slate-400 font-sans">
                                  {line.uom ?? "pcs"}
                                </span>
                              </td>
                              {isStockPathType(bill.purchaseType) ? (
                                <>
                                  <td className="px-2 py-2.5 text-right font-bold text-amber-700 font-mono">
                                    {damaged}
                                  </td>
                                  <td className="px-2 py-2.5 text-right font-bold text-emerald-700 font-mono">
                                    {sellable}
                                  </td>
                                </>
                              ) : null}
                              <td className="px-2 py-2.5 text-right font-semibold text-slate-700 font-mono">
                                {formatPurchaseMoney(line.unitPrice)}
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold text-slate-900 font-mono">
                                {formatPurchaseMoney(line.amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <Row
                  label="Subtotal"
                  value={formatPurchaseMoney(bill.subtotal)}
                />
                <Row
                  label="Discount"
                  value={formatPurchaseMoney(bill.discountAmount)}
                />
                <Row
                  label="CGST"
                  value={formatPurchaseMoney(bill.cgstAmount)}
                />
                <Row
                  label="SGST"
                  value={formatPurchaseMoney(bill.sgstAmount)}
                />
                <Row
                  label="IGST"
                  value={formatPurchaseMoney(bill.igstAmount)}
                />
                <Row
                  label="Freight"
                  value={formatPurchaseMoney(bill.freightAmount)}
                />
                <Row
                  label="Other charges"
                  value={formatPurchaseMoney(bill.otherCharges)}
                />
                <Row
                  label="Round off"
                  value={formatPurchaseMoney(bill.roundOff)}
                />
                <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                  <span>Grand total</span>
                  <span>{formatPurchaseMoney(bill.totalAmount)}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Workflow: {PURCHASE_STATUS_LABELS[bill.status]}
                </p>
              </section>

              {bill.notes ? (
                <section>
                  <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                    Notes
                  </h3>
                  <p className="mt-1 text-sm text-slate-700">{bill.notes}</p>
                </section>
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
        {label}
      </p>
      <p className="mt-0.5 font-semibold capitalize text-slate-800">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-slate-600">
      <span>{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

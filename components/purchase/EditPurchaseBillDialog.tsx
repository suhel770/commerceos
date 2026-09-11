"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

import CommerceDatePicker from "@/components/ui/CommerceDatePicker";
import CommerceSelect from "@/components/ui/CommerceSelect";
import {
  ALL_BUSINESS_INTENTS,
  BUSINESS_INTENT_LABELS,
  GST_RATE_SLABS,
  PAYMENT_METHOD_LABELS,
  PURCHASE_TYPE_LABELS,
  formatPurchaseMoney,
  normalizeGstRate,
  type BusinessIntent,
  type FreightAllocationMode,
  type PaymentMethod,
  type PurchaseBill,
  type PurchaseUom,
  type Vendor,
} from "@/lib/purchase";

type EditLineDraft = {
  key: string;
  id?: string;
  description: string;
  quantity: string;
  unitPrice: string;
  hsn: string;
  gstRate: string;
  uom: PurchaseUom;
  sku?: string;
  productId?: string;
  intent: BusinessIntent;
  physicalStorageReceivingRequired?: boolean;
  freightMode?: FreightAllocationMode;
};

type EditPurchaseBillDialogProps = {
  open: boolean;
  submitting: boolean;
  bill: PurchaseBill | null;
  vendors: Vendor[];
  onClose(): void;
  onUpdate(
    billId: string,
    patch: Partial<PurchaseBill>,
  ): Promise<boolean>;
};

const PAYMENT_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const INTENT_OPTIONS = ALL_BUSINESS_INTENTS.map((value) => ({
  value,
  label: BUSINESS_INTENT_LABELS[value] || value,
}));

const GST_SLAB_OPTIONS = GST_RATE_SLABS.map((rate) => ({
  value: String(rate),
  label: `${rate}%`,
}));

export default function EditPurchaseBillDialog({
  open,
  submitting,
  bill,
  vendors,
  onClose,
  onUpdate,
}: EditPurchaseBillDialogProps) {
  const [vendorId, setVendorId] = useState("");
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState("");
  const [billDate, setBillDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("unpaid");
  const [paymentRef, setPaymentRef] = useState("");
  const [notes, setNotes] = useState("");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [freightAmount, setFreightAmount] = useState("0");
  const [otherCharges, setOtherCharges] = useState("0");
  const [lines, setLines] = useState<EditLineDraft[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !bill) return;
    setVendorId(bill.vendorId);
    setVendorInvoiceNumber(bill.vendorInvoiceNumber ?? "");
    setBillDate(bill.billDate);
    setDueDate(bill.dueDate ?? "");
    setPaymentMethod(bill.paymentMethod ?? "unpaid");
    setPaymentRef(bill.paymentId ?? "");
    setNotes(bill.notes ?? "");
    setDiscountAmount(String(bill.discountAmount ?? 0));
    setFreightAmount(String(bill.freightAmount ?? 0));
    setOtherCharges(String(bill.otherCharges ?? 0));
    setLines(
      bill.lines.map((l) => ({
        key: crypto.randomUUID(),
        id: l.id,
        description: l.description,
        quantity: String(l.quantity),
        unitPrice: String(l.unitPrice),
        hsn: l.hsn ?? "",
        gstRate: String(l.gstRate ?? 18),
        uom: l.uom ?? "pcs",
        sku: l.sku ?? "",
        productId: l.productId,
        intent: l.intent ?? "sellable",
        physicalStorageReceivingRequired: l.physicalStorageReceivingRequired,
        freightMode: l.freightMode,
      })),
    );
    setError(null);
  }, [open, bill]);

  const activeVendors = useMemo(
    () => vendors.filter((v) => v.status === "active"),
    [vendors],
  );

  const selectedVendor = activeVendors.find((v) => v.id === vendorId);

  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    for (const l of lines) {
      const qty = Number(l.quantity) || 0;
      const rate = Number(l.unitPrice) || 0;
      const gst = Number(l.gstRate) || 0;
      const lineVal = qty * rate;
      subtotal += lineVal;
      totalTax += (lineVal * gst) / 100;
    }

    const discount = Number(discountAmount) || 0;
    const freight = Number(freightAmount) || 0;
    const other = Number(otherCharges) || 0;
    const exactTotal = Math.max(0, subtotal - discount) + totalTax + freight + other;
    const roundOff = Number((Math.round(exactTotal) - exactTotal).toFixed(2));
    const grandTotal = Number((exactTotal + roundOff).toFixed(2));

    return {
      subtotal,
      totalTax,
      discount,
      freight,
      other,
      roundOff,
      grandTotal,
    };
  }, [lines, discountAmount, freightAmount, otherCharges]);

  if (!open || !bill) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vendorId) {
      setError("Please select a vendor.");
      return;
    }

    const parsedLines = lines.map((l) => {
      const qty = Number(l.quantity) || 0;
      const price = Number(l.unitPrice) || 0;
      const gst = normalizeGstRate(Number(l.gstRate) || 0);
      const val = qty * price;
      const tax = (val * gst) / 100;

      return {
        id: l.id,
        description: l.description.trim(),
        quantity: qty,
        unitPrice: price,
        amount: Number(val.toFixed(2)),
        hsn: l.hsn.trim() || undefined,
        gstRate: gst,
        cgstAmount: tax / 2,
        sgstAmount: tax / 2,
        igstAmount: tax,
        taxAmount: tax,
        qtyReceived: 0,
        qtyDamaged: 0,
        uom: l.uom,
        sku: l.sku?.trim() || undefined,
        productId: l.productId,
        intent: l.intent,
        physicalStorageReceivingRequired: l.physicalStorageReceivingRequired,
        freightMode: l.freightMode,
      };
    }).filter((l) => l.description);

    if (!parsedLines.length) {
      setError("Add at least one purchased item.");
      return;
    }

    const patch: Partial<PurchaseBill> = {
      vendorId,
      vendorName: selectedVendor?.name ?? bill.vendorName,
      vendorInvoiceNumber: vendorInvoiceNumber.trim() || undefined,
      billDate,
      dueDate: dueDate || undefined,
      paymentMethod,
      paymentId: paymentRef.trim() || undefined,
      notes: notes.trim() || undefined,
      discountAmount: totals.discount,
      freightAmount: totals.freight,
      otherCharges: totals.other,
      roundOff: totals.roundOff,
      lines: parsedLines as any,
      totalAmount: totals.grandTotal,
      subtotal: totals.subtotal,
      taxAmount: totals.totalTax,
    };

    try {
      const success = await onUpdate(bill.id, patch);
      if (success) {
        onClose();
      } else {
        setError("Failed to save changes. Please check input details and try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update purchase bill.");
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Edit Purchase Bill — {bill.billNumber}
            </h2>
            <p className="text-xs text-slate-500">
              Update invoice details, rates, and line items
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto custom-scrollbar p-6">
          {error ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <CommerceSelect
                label="Vendor *"
                value={vendorId}
                onChange={setVendorId}
                options={activeVendors.map((v) => ({
                  value: v.id,
                  label: v.name,
                }))}
                searchable
              />

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">
                  Vendor invoice / GST bill #
                </span>
                <input
                  value={vendorInvoiceNumber}
                  onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
              </label>

              <CommerceDatePicker
                label="Bill date"
                required
                value={billDate}
                onChange={setBillDate}
              />

              <CommerceDatePicker
                label="Due date"
                value={dueDate}
                onChange={setDueDate}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <CommerceSelect
                label="Payment method"
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(val as PaymentMethod)}
                options={PAYMENT_OPTIONS}
              />

              {paymentMethod !== "unpaid" && paymentMethod !== "credit" && paymentMethod !== "cash" ? (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">
                    Transaction ID / Ref #
                  </span>
                  <input
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. UTR-9901 / UPI-1234"
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-sm uppercase"
                  />
                </label>
              ) : null}

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Notes</span>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Remarks..."
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Freight / Logistics (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={freightAmount}
                  onChange={(e) => setFreightAmount(e.target.value)}
                  placeholder="0"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Discount (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="0"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-sm text-amber-700"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Other Charges (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(e.target.value)}
                  placeholder="0"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-sm"
                />
              </label>
            </div>

            {/* Line Items */}
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Purchased Items
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Specify item name, rates, GST slab, and business intent / type (Sellable, Consumable, Asset, Expense, etc.)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLines((prev) => [
                      ...prev,
                      {
                        key: crypto.randomUUID(),
                        description: "",
                        quantity: "1",
                        unitPrice: "0",
                        hsn: "",
                        gstRate: "18",
                        uom: "pcs",
                        sku: "",
                        intent: "sellable",
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition"
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>

              <div className="overflow-x-auto pb-1">
                <div className="min-w-[720px]">
                  <div className="mb-1.5 grid grid-cols-[minmax(0,1.8fr)_5rem_4.5rem_5.5rem_5rem_10.5rem_2rem] gap-2 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Item name *</span>
                    <span>HSN</span>
                    <span className="text-right">Qty</span>
                    <span className="text-right">Rate (₹)</span>
                    <span>GST %</span>
                    <span className="text-violet-700 font-bold">Item Type / Intent *</span>
                    <span className="text-center"></span>
                  </div>

                  <div className="space-y-2">
                    {lines.map((l) => (
                      <div
                        key={l.key}
                        className="grid grid-cols-[minmax(0,1.8fr)_5rem_4.5rem_5.5rem_5rem_10.5rem_2rem] items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs shadow-sm hover:border-violet-200 transition"
                      >
                        <input
                          placeholder="Item name *"
                          value={l.description}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((row) =>
                                row.key === l.key
                                  ? { ...row, description: e.target.value }
                                  : row,
                              ),
                            )
                          }
                          className="h-9 w-full rounded-md border border-slate-200 px-2 font-medium text-slate-800 focus:border-violet-500 focus:outline-none"
                        />

                        <input
                          placeholder="HSN"
                          value={l.hsn}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((row) =>
                                row.key === l.key
                                  ? { ...row, hsn: e.target.value }
                                  : row,
                              ),
                            )
                          }
                          className="h-9 w-full rounded-md border border-slate-200 px-2 font-mono focus:border-violet-500 focus:outline-none"
                        />

                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={l.quantity}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((row) =>
                                row.key === l.key
                                  ? { ...row, quantity: e.target.value }
                                  : row,
                              ),
                            )
                          }
                          className="h-9 w-full rounded-md border border-slate-200 px-2 text-right font-mono font-semibold focus:border-violet-500 focus:outline-none"
                        />

                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Rate ₹"
                          value={l.unitPrice}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((row) =>
                                row.key === l.key
                                  ? { ...row, unitPrice: e.target.value }
                                  : row,
                              ),
                            )
                          }
                          className="h-9 w-full rounded-md border border-slate-200 px-2 text-right font-mono focus:border-violet-500 focus:outline-none"
                        />

                        <CommerceSelect
                          value={String(normalizeGstRate(Number(l.gstRate)))}
                          onChange={(next) =>
                            setLines((prev) =>
                              prev.map((row) =>
                                row.key === l.key
                                  ? { ...row, gstRate: next }
                                  : row,
                              ),
                            )
                          }
                          options={GST_SLAB_OPTIONS}
                          searchable={false}
                          size="sm"
                          placeholder="GST"
                        />

                        <CommerceSelect
                          value={l.intent}
                          onChange={(next) =>
                            setLines((prev) =>
                              prev.map((row) =>
                                row.key === l.key
                                  ? { ...row, intent: next as BusinessIntent }
                                  : row,
                              ),
                            )
                          }
                          options={INTENT_OPTIONS}
                          searchable={false}
                          size="sm"
                          placeholder="Select Type"
                        />

                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            disabled={lines.length === 1}
                            onClick={() =>
                              setLines((prev) =>
                                prev.filter((row) => row.key !== l.key),
                              )
                            }
                            title="Remove line item"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE PURCHASE INVOICE TOTAL & TAX BREAKDOWN CARD */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-6">
                <div className="space-y-0.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                  <span className="block text-[10px] font-bold uppercase text-slate-500">Subtotal</span>
                  <p className="font-mono font-bold text-slate-900">
                    {formatPurchaseMoney(totals.subtotal)}
                  </p>
                </div>

                <div className="space-y-0.5 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5">
                  <span className="block text-[10px] font-bold uppercase text-amber-800">Discount</span>
                  <p className="font-mono font-bold text-amber-700">
                    - {formatPurchaseMoney(totals.discount)}
                  </p>
                </div>

                <div className="space-y-0.5 rounded-xl border border-blue-200 bg-blue-50/70 p-2.5">
                  <span className="block text-[10px] font-bold uppercase text-blue-800">Freight</span>
                  <p className="font-mono font-bold text-blue-700">
                    + {formatPurchaseMoney(totals.freight)}
                  </p>
                </div>

                <div className="space-y-0.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                  <span className="block text-[10px] font-bold uppercase text-slate-500">Other</span>
                  <p className="font-mono font-bold text-slate-900">
                    + {formatPurchaseMoney(totals.other)}
                  </p>
                </div>

                <div className="space-y-0.5 rounded-xl border border-purple-200 bg-purple-50/70 p-2.5">
                  <span className="block text-[10px] font-bold uppercase text-purple-800">GST Tax</span>
                  <p className="font-mono font-bold text-purple-700">
                    + {formatPurchaseMoney(totals.totalTax)}
                  </p>
                </div>

                <div className="space-y-0.5 rounded-xl border border-violet-700 bg-violet-600 p-2.5 text-white shadow-sm">
                  <span className="block text-[10px] font-extrabold uppercase text-violet-200">Grand Total</span>
                  <p className="font-mono text-sm font-extrabold text-white">
                    {formatPurchaseMoney(totals.grandTotal)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

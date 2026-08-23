"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet, X } from "lucide-react";

import CommerceDatePicker from "@/components/ui/CommerceDatePicker";
import CommerceSelect from "@/components/ui/CommerceSelect";
import {
  PAYMENT_METHOD_LABELS,
  billAmountPaid,
  billPendingAmount,
  formatPurchaseMoney,
  type PaymentMethod,
  type PurchaseBill,
} from "@/lib/purchase";

type RecordPaymentDialogProps = {
  open: boolean;
  submitting: boolean;
  bills: PurchaseBill[];
  /** Prefill when opened from a bill row Pay action */
  initialBillId?: string | null;
  onClose(): void;
  onRecord(input: {
    billId: string;
    paymentMethod: PaymentMethod;
    paymentId?: string;
    amount: number;
    paymentDate: string;
  }): Promise<boolean>;
};

const PAID_METHODS = (
  Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]
).filter((method) => method !== "unpaid");

const PAYMENT_ID_HINT: Partial<
  Record<PaymentMethod, { label: string; placeholder: string; required: boolean }>
> = {
  neft_rtgs: {
    label: "Payment ID / UTR",
    placeholder: "e.g. UTR123456789012",
    required: true,
  },
  cheque: {
    label: "Cheque number",
    placeholder: "e.g. CHQ-452198",
    required: true,
  },
  upi: {
    label: "UPI reference / Transaction ID",
    placeholder: "e.g. 241567890123 (optional)",
    required: false,
  },
  card: {
    label: "Card transaction ID",
    placeholder: "e.g. TXN984512",
    required: false,
  },
  wallet: {
    label: "Wallet transaction ID",
    placeholder: "e.g. WALLET-88901",
    required: false,
  },
  cash: {
    label: "Receipt / Payment ID",
    placeholder: "e.g. CASH-REC-12",
    required: false,
  },
  credit: {
    label: "Credit note / Payment ID",
    placeholder: "e.g. CN-104",
    required: false,
  },
};

function todayInput() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function RecordPaymentDialog({
  open,
  submitting,
  bills,
  initialBillId = null,
  onClose,
  onRecord,
}: RecordPaymentDialogProps) {
  const pending = useMemo(
    () =>
      bills.filter(
        (bill) =>
          bill.status !== "void" &&
          bill.status !== "draft" &&
          bill.paymentStatus !== "paid" &&
          billPendingAmount(bill) > 0,
      ),
    [bills],
  );

  const [billId, setBillId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [paymentId, setPaymentId] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayInput);
  const [amountText, setAmountText] = useState("");
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

  const selected = pending.find((bill) => bill.id === billId) ?? null;
  const pendingDue = selected ? billPendingAmount(selected) : 0;
  const alreadyPaid = selected ? billAmountPaid(selected) : 0;
  const idHint = PAYMENT_ID_HINT[paymentMethod];

  useEffect(() => {
    if (!open) return;
    setPaymentDate(todayInput());
    setError(null);
    if (initialBillId) setBillId(initialBillId);
  }, [open, initialBillId]);

  useEffect(() => {
    if (!selected) {
      setAmountText("");
      return;
    }
    setAmountText(String(billPendingAmount(selected)));
  }, [selected?.id]);

  if (!open) return null;

  const payingNow = Number(amountText);
  const isPartial =
    Number.isFinite(payingNow) &&
    payingNow > 0 &&
    payingNow < pendingDue - 0.009;

  const submit = async () => {
    setError(null);
    if (!billId || !selected) {
      setError("Select a pending bill.");
      return;
    }
    if (!paymentDate) {
      setError("Select a payment date.");
      return;
    }
    if (!Number.isFinite(payingNow) || payingNow <= 0) {
      setError("Enter a payment amount greater than zero.");
      return;
    }
    if (payingNow > pendingDue + 0.009) {
      setError(
        `Amount cannot exceed pending ${formatPurchaseMoney(pendingDue)}.`,
      );
      return;
    }
    const trimmedId = paymentId.trim();
    if (idHint?.required && !trimmedId) {
      setError(
        `${idHint.label} is required for ${PAYMENT_METHOD_LABELS[paymentMethod]}.`,
      );
      return;
    }
    const ok = await onRecord({
      billId,
      paymentMethod,
      paymentId: trimmedId || undefined,
      amount: Number(payingNow.toFixed(2)),
      paymentDate,
    });
    if (ok) {
      setBillId("");
      setPaymentMethod("upi");
      setPaymentId("");
      setPaymentDate(todayInput());
      setAmountText("");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Record Payment"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              Quick action
            </p>
            <h2 className="mt-0.5 flex items-center gap-2 text-lg font-bold text-slate-900">
              <Wallet size={18} />
              Record Payment
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pay full or partial amount against a pending bill.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          {pending.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No pending payments right now.
            </p>
          ) : (
            <>
              <CommerceSelect
                label="Pending bill"
                value={billId}
                onChange={setBillId}
                options={pending.map((bill) => ({
                  value: bill.id,
                  label: `${bill.billNumber} · ${bill.vendorName} · pending ${formatPurchaseMoney(billPendingAmount(bill))}`,
                }))}
                placeholder="Select bill"
              />

              {selected ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p>
                      <span className="font-semibold text-slate-800">
                        {selected.vendorName}
                      </span>{" "}
                      · Due {selected.dueDate ?? "—"}
                    </p>
                    <p className="font-semibold text-slate-800">
                      Bill {formatPurchaseMoney(selected.totalAmount)}
                    </p>
                  </div>
                  <p className="mt-1">
                    Already paid {formatPurchaseMoney(alreadyPaid)} · Pending{" "}
                    <span className="font-semibold text-amber-700">
                      {formatPurchaseMoney(pendingDue)}
                    </span>
                  </p>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <CommerceDatePicker
                  label="Payment date"
                  required
                  value={paymentDate}
                  onChange={setPaymentDate}
                  placeholder="Select payment date"
                />
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">
                    Amount paying now
                    <span className="text-rose-500"> *</span>
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={amountText}
                      onChange={(event) => setAmountText(event.target.value)}
                      disabled={!selected}
                      placeholder={
                        selected
                          ? String(pendingDue)
                          : "Select a bill first"
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 py-2 pl-7 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50"
                    />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={!selected}
                      onClick={() => setAmountText(String(pendingDue))}
                      className="rounded-md bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-40"
                    >
                      Pay full pending
                    </button>
                    {selected && isPartial ? (
                      <span className="text-[11px] font-semibold text-amber-700">
                        Partial —{" "}
                        {formatPurchaseMoney(
                          Number((pendingDue - payingNow).toFixed(2)),
                        )}{" "}
                        will remain
                      </span>
                    ) : null}
                  </div>
                </label>
              </div>

              <CommerceSelect
                label="Payment method"
                value={paymentMethod}
                onChange={(value) => {
                  setPaymentMethod(value as PaymentMethod);
                  setPaymentId("");
                }}
                options={PAID_METHODS.map((method) => ({
                  value: method,
                  label: PAYMENT_METHOD_LABELS[method],
                }))}
              />

              {idHint ? (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">
                    {idHint.label}
                    {idHint.required ? (
                      <span className="text-rose-500"> *</span>
                    ) : (
                      <span className="ml-1 text-xs font-normal text-slate-400">
                        (optional)
                      </span>
                    )}
                  </span>
                  <input
                    value={paymentId}
                    onChange={(event) => setPaymentId(event.target.value)}
                    placeholder={idHint.placeholder}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Use UTR for NEFT/RTGS, cheque number for cheque, or bank /
                    UPI transaction reference.
                  </p>
                </label>
              ) : null}
            </>
          )}
          {error ? (
            <p className="text-sm font-medium text-rose-600">{error}</p>
          ) : null}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || pending.length === 0}
            onClick={() => void submit()}
            className="h-10 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {submitting
              ? "Saving…"
              : isPartial
                ? "Record partial payment"
                : "Record payment"}
          </button>
        </footer>
      </div>
    </div>
  );
}

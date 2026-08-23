"use client";

import { useEffect, useMemo, useState } from "react";
import { PackageCheck, X } from "lucide-react";

import CommerceSelect from "@/components/ui/CommerceSelect";
import {
  formatPurchaseMoney,
  isStockPathType,
  type PurchaseBill,
} from "@/lib/purchase";

type ReceiveGoodsDialogProps = {
  open: boolean;
  submitting: boolean;
  bills: PurchaseBill[];
  onClose(): void;
  onReceive(billId: string): Promise<boolean>;
};

export default function ReceiveGoodsDialog({
  open,
  submitting,
  bills,
  onClose,
  onReceive,
}: ReceiveGoodsDialogProps) {
  const receivable = useMemo(
    () =>
      bills.filter(
        (bill) =>
          isStockPathType(bill.purchaseType) &&
          bill.status !== "void" &&
          bill.status !== "draft" &&
          bill.status !== "completed",
      ),
    [bills],
  );

  const [billId, setBillId] = useState("");
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

  if (!open) return null;

  const selected = receivable.find((bill) => bill.id === billId) ?? null;

  const submit = async () => {
    setError(null);
    if (!billId) {
      setError("Select a stock purchase to receive.");
      return;
    }
    const ok = await onReceive(billId);
    if (ok) setBillId("");
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Receive Goods"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              Quick action
            </p>
            <h2 className="mt-0.5 flex items-center gap-2 text-lg font-bold text-slate-900">
              <PackageCheck size={18} />
              Receive Goods
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Complete an inventory / packaging purchase after goods arrive.
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
          {receivable.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No open stock purchases waiting to be received.
            </p>
          ) : (
            <>
              <CommerceSelect
                label="Stock purchase"
                value={billId}
                onChange={setBillId}
                options={receivable.map((bill) => ({
                  value: bill.id,
                  label: `${bill.billNumber} · ${bill.vendorName} · ${bill.status}`,
                }))}
                placeholder="Select purchase"
              />
              {selected ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">
                    {selected.vendorName}
                  </p>
                  <p className="mt-0.5">
                    {formatPurchaseMoney(selected.totalAmount)} ·{" "}
                    {selected.lines.length} line
                    {selected.lines.length === 1 ? "" : "s"}
                  </p>
                </div>
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
            disabled={submitting || receivable.length === 0}
            onClick={() => void submit()}
            className="h-10 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {submitting ? "Receiving…" : "Confirm receive"}
          </button>
        </footer>
      </div>
    </div>
  );
}

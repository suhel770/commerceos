"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import {
  PURCHASE_STATUS_LABELS,
  PURCHASE_TYPE_LABELS,
  VENDOR_REGISTRATION_TYPE_LABELS,
  extractPanFromGstin,
  formatPurchaseMoney,
  type PurchaseBill,
  type VendorWithStats,
} from "@/lib/purchase";

type VendorInspectorDrawerProps = {
  vendor: VendorWithStats | null;
  bills: PurchaseBill[];
  onClose(): void;
  onOpenBill(bill: PurchaseBill): void;
  /** When false, Escape is ignored (e.g. a higher drawer is open). */
  escapeEnabled?: boolean;
};

export default function VendorInspectorDrawer({
  vendor,
  bills,
  onClose,
  onOpenBill,
  escapeEnabled = true,
}: VendorInspectorDrawerProps) {
  const open = Boolean(vendor);

  const history = vendor
    ? bills
        .filter((bill) => bill.vendorId === vendor.id)
        .sort((a, b) => b.billDate.localeCompare(a.billDate))
    : [];

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && escapeEnabled) onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, escapeEnabled]);

  return (
    <AnimatePresence>
      {vendor ? (
        <>
          <motion.button
            type="button"
            aria-label="Close vendor drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] cursor-default bg-slate-900/30 backdrop-blur-sm"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`Vendor ${vendor.name}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="fixed inset-y-0 right-0 z-[80] flex h-screen w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Vendor
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  {vendor.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {[vendor.city, vendor.state].filter(Boolean).join(", ") || "—"}
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
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              <section className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase text-slate-400">
                    Outstanding
                  </p>
                  <p className="mt-1 text-lg font-bold text-rose-600">
                    {formatPurchaseMoney(vendor.outstandingBalance)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase text-slate-400">
                    Purchases
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {vendor.purchaseCount}
                  </p>
                </div>
              </section>

              <section className="space-y-2 text-sm">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Tax & bank
                </h3>
                <p>
                  <span className="text-slate-500">Registration:</span>{" "}
                  <span className="font-medium text-slate-800">
                    {VENDOR_REGISTRATION_TYPE_LABELS[vendor.registrationType]}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">GSTIN:</span>{" "}
                  <span className="font-medium text-slate-800">
                    {vendor.gstin || "—"}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">PAN/TAN:</span>{" "}
                  <span className="font-medium text-slate-800">
                    {vendor.pan || extractPanFromGstin(vendor.gstin) || "—"}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Bank:</span>{" "}
                  <span className="font-medium text-slate-800">
                    {vendor.bankName || "—"}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">A/C:</span>{" "}
                  <span className="font-medium text-slate-800">
                    {vendor.bankAccountNumber || "—"}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">IFSC:</span>{" "}
                  <span className="font-medium text-slate-800">
                    {vendor.bankIfsc || "—"}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Terms:</span>{" "}
                  <span className="font-medium text-slate-800">
                    {vendor.paymentTermsDays}d pay · {vendor.leadTimeDays}d lead
                  </span>
                </p>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Purchase history
                </h3>
                <div className="space-y-2">
                  {history.length === 0 ? (
                    <p className="text-sm text-slate-500">No purchases yet.</p>
                  ) : (
                    history.map((bill) => (
                      <button
                        key={bill.id}
                        type="button"
                        onClick={() => onOpenBill(bill)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-left transition hover:border-violet-200 hover:bg-violet-50/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {bill.billNumber}
                            </p>
                            <p className="text-xs text-slate-500">
                              {PURCHASE_TYPE_LABELS[bill.purchaseType]} ·{" "}
                              {bill.billDate}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-slate-900">
                            {formatPurchaseMoney(bill.totalAmount)}
                          </p>
                        </div>
                        <p className="mt-1 text-[11px] font-semibold text-violet-700">
                          {PURCHASE_STATUS_LABELS[bill.status]} ·{" "}
                          {bill.paymentStatus}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </section>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

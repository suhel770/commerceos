"use client";

import { safeFetchJson, safeResponseJson } from "@/lib/api/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileInput,
  FileText,
  Plus,
  RefreshCw,
  Wallet,
} from "lucide-react";

import {
  billAmountPaid,
  billPendingAmount,
  buildPurchaseBillsExcel,
  formatPurchaseMoney,
  type CreatePurchaseBillInput,
  type CreatePurchaseOrderInput,
  type CreateVendorInput,
  type PaymentMethod,
  type PurchaseBill,
  type PurchaseOrder,
  type PurchaseStatus,
  type Vendor,
  type VendorWithStats,
} from "@/lib/purchase";

import BillInspectorDrawer from "./BillInspectorDrawer";
import EditPurchaseBillDialog from "./EditPurchaseBillDialog";
import NewPurchaseBillDialog from "./NewPurchaseBillDialog";
import NewPurchaseOrderDialog from "./NewPurchaseOrderDialog";
import NewVendorDialog from "./NewVendorDialog";
import PurchaseQuickActions from "./PurchaseQuickActions";
import PurchaseDataTable from "./PurchaseDataTable";
import RecordPaymentDialog from "./RecordPaymentDialog";
import ImportPurchasesDialog from "./ImportPurchasesDialog";
import { isPurchaseBillOverdue, type PurchaseTab } from "./purchase-ops";

function KpiCard({
  label,
  value,
  footer,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  footer: string;
  icon: LucideIcon;
  tone: "violet" | "amber" | "rose" | "emerald" | "blue";
}) {
  const tones = {
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}
      >
        <Icon className="h-4.5 w-4.5" size={18} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-slate-500">{label}</p>
        <p className="truncate text-lg font-bold tracking-tight text-slate-900">
          {value}
        </p>
        <p className="truncate text-[10px] font-semibold text-slate-400">
          {footer}
        </p>
      </div>
    </div>
  );
}

export default function BillsWorkspace() {
  const [vendors, setVendors] = useState<VendorWithStats[]>([]);
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [newBillOpen, setNewBillOpen] = useState(false);
  const [newPoOpen, setNewPoOpen] = useState(false);
  const [newVendorOpen, setNewVendorOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [payBillId, setPayBillId] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);
  const [editingBill, setEditingBill] = useState<PurchaseBill | null>(null);
  const [tab, setTab] = useState<PurchaseTab>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vendorsPayload, billsPayload] = await Promise.all([
        safeFetchJson<{ success: boolean; data: VendorWithStats[] }>(
          "/api/v1/purchase/vendors",
        ).catch((err) => {
          console.warn("[BillsWorkspace] load vendors warning:", err);
          return { success: true, data: [] as VendorWithStats[] };
        }),
        safeFetchJson<{ success: boolean; data: PurchaseBill[] }>(
          "/api/v1/purchase/bills",
        ).catch((err) => {
          console.warn("[BillsWorkspace] load bills warning:", err);
          return { success: true, data: [] as PurchaseBill[] };
        }),
      ]);

      setVendors((vendorsPayload?.data as VendorWithStats[]) || []);
      setBills((billsPayload?.data as PurchaseBill[]) || []);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("commerceos_purchase_bills_v1");
        } catch {}
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bills.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const kpis = useMemo(() => {
    const active = bills.filter((bill) => bill.status !== "void");
    const pendingBills = active.filter(
      (bill) => bill.paymentStatus !== "paid" && bill.status !== "draft",
    );
    const pendingAmount = pendingBills.reduce(
      (sum, bill) => sum + billPendingAmount(bill),
      0,
    );
    const overdueCount = pendingBills.filter((bill) =>
      isPurchaseBillOverdue(bill),
    ).length;
    const paidCount = active.filter(
      (bill) => bill.paymentStatus === "paid",
    ).length;
    const totalAmountPaid = active.reduce(
      (sum, bill) => sum + billAmountPaid(bill),
      0,
    );
    return {
      total: active.length,
      pendingCount: pendingBills.length,
      pendingAmount,
      overdueCount,
      paidCount,
      totalAmountPaid,
    };
  }, [bills]);

  const createBill = async (input: CreatePurchaseBillInput) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/purchase/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await safeResponseJson(response);
      const newBill = payload.data as PurchaseBill;
      await load();
      setTab("all");
      setNewBillOpen(false);
      setMessage(`Bill ${newBill.billNumber} saved successfully.`);
      return newBill;
    } finally {
      setSubmitting(false);
    }
  };

  const createPO = async (input: CreatePurchaseOrderInput) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/purchase/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await safeResponseJson(response);
      const newPO = payload.data as PurchaseOrder;
      await load();
      setNewPoOpen(false);
      setMessage(`Purchase Order ${newPO.poNumber} saved successfully.`);
      return newPO;
    } finally {
      setSubmitting(false);
    }
  };

  const onCreateVendor = async (input: CreateVendorInput) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/purchase/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await safeResponseJson(response);
      await load();
      setNewVendorOpen(false);
      setNewBillOpen(true);
      return payload.data as Vendor;
    } finally {
      setSubmitting(false);
    }
  };

  const onTransition = async (billId: string, status: PurchaseStatus) => {
    const response = await fetch(
      `/api/v1/purchase/bills/${billId}/transition`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );
    const payload = await safeResponseJson(response);
    await load();
    setSelectedBill((current) =>
      current?.id === billId ? (payload.data as PurchaseBill) : current,
    );
  };

  const onBulkVoid = async (ids: string[]) => {
    if (ids.length === 0) {
      throw new Error("Select at least one bill first.");
    }
    const results = await Promise.all(
      ids.map(async (id) => {
        const response = await fetch(
          `/api/v1/purchase/bills/${id}/transition`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "void" }),
          },
        );
        const payload = await safeResponseJson(response);
        return { id, ok: response.ok && payload.success, payload };
      }),
    );
    const failed = results.filter((row) => !row.ok);
    await load();
    if (failed.length === ids.length) {
      throw new Error(
        failed[0]?.payload?.error?.message ??
          "Could not void selected bills (already completed/void).",
      );
    }
  };

  const onBulkDelete = async (ids: string[]) => {
    if (ids.length === 0) {
      throw new Error("Select at least one bill first.");
    }
    const results = await Promise.all(
      ids.map(async (id) => {
        const response = await fetch(
          `/api/v1/purchase/bills/${id}?permanent=true`,
          {
            method: "DELETE",
          },
        );
        const payload = await safeResponseJson(response);
        return { id, ok: response.ok && payload.success, payload };
      }),
    );
    const failed = results.filter((row) => !row.ok);
    await load();
    if (failed.length === ids.length) {
      throw new Error(
        failed[0]?.payload?.error?.message ??
          "Could not delete selected bills.",
      );
    }
  };

  const onDeleteBill = async (billId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/purchase/bills/${billId}`, {
        method: "DELETE",
      });
      const payload = await safeResponseJson(response);
      await load();
      setSelectedBill(null);
      setMessage("Purchase bill moved to Trash (30 days retention).");
    } catch (err: any) {
      setError(err?.message || "Failed to delete bill.");
    } finally {
      setSubmitting(false);
    }
  };

  const onRestoreBill = async (billId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/purchase/bills/${billId}/restore`, {
        method: "POST",
      });
      const payload = await safeResponseJson(response);
      await load();
      setMessage("Purchase bill restored from trash.");
    } catch (err: any) {
      setError(err?.message || "Failed to restore bill.");
    } finally {
      setSubmitting(false);
    }
  };

  const onPermanentDeleteBill = async (billId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/purchase/bills/${billId}?permanent=true`, {
        method: "DELETE",
      });
      const payload = await safeResponseJson(response);
      await load();
      setSelectedBill(null);
      setMessage("Purchase bill permanently deleted.");
    } catch (err: any) {
      setError(err?.message || "Failed to delete bill.");
    } finally {
      setSubmitting(false);
    }
  };

  const onUpdateBill = async (
    billId: string,
    patch: Partial<PurchaseBill>,
  ): Promise<boolean> => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/purchase/bills/${billId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await safeResponseJson(response);
      await load();
      setEditingBill(null);
      setMessage("Purchase bill updated successfully.");
      return true;
    } catch (err: any) {
      setMessage(err?.message || "Failed to update purchase bill.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const onExport = (rows: PurchaseBill[]) => {
    if (rows.length === 0) return;
    const excel = buildPurchaseBillsExcel(rows);
    const blob = new Blob([excel.body as any], { type: excel.contentType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = excel.filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const openPay = (bill?: PurchaseBill) => {
    setPayBillId(bill?.id ?? null);
    setPaymentOpen(true);
    setMessage(null);
    setError(null);
  };

  const recordPayment = async (input: {
    billId: string;
    paymentMethod: PaymentMethod;
    paymentId?: string;
    amount: number;
    paymentDate: string;
  }) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/purchase/bills/${input.billId}/payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethod: input.paymentMethod,
            paymentId: input.paymentId,
            amount: input.amount,
            paymentDate: input.paymentDate,
          }),
        },
      );
      const payload = await safeResponseJson(response);
      const bill = payload.data as PurchaseBill;
      await load();
      setPaymentOpen(false);
      setPayBillId(null);
      setMessage(
        bill.paymentStatus === "partial"
          ? `Partial payment of ${formatPurchaseMoney(input.amount)} recorded for ${bill.billNumber}.`
          : `Payment of ${formatPurchaseMoney(input.amount)} recorded for ${bill.billNumber}.`,
      );
      return true;
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Failed to record payment.",
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1700px] space-y-4 px-4 py-4 xl:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/purchase"
              aria-label="Back to Purchase dashboard"
              title="Back to Purchase dashboard"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            >
              <ArrowLeft size={16} />
            </Link>
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-2 leading-none"
            >
              <FileText
                className="h-[18px] w-[18px] shrink-0 text-violet-600"
                aria-hidden
              />
              <Link
                href="/purchase"
                className="text-lg font-bold tracking-tight text-slate-400 transition hover:text-violet-700"
              >
                Purchase
              </Link>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-slate-300"
                aria-hidden
              />
              <h1 className="text-lg font-bold tracking-tight text-slate-950">
                Bills
              </h1>
            </nav>
          </div>
          <p className="mt-1.5 text-sm text-slate-500 sm:pl-12">
            Track every bill — payment date, payment ID, and editable pending
            amounts for partial pay.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => openPay()}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 text-sm font-semibold text-violet-800 hover:bg-violet-100"
          >
            <Wallet size={15} />
            Record Payment
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FileInput size={15} />
            Import Purchases
          </button>
          <button
            type="button"
            onClick={() => setNewBillOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <Plus size={16} />
            New Purchase
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>{message}</p>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs font-semibold text-slate-500"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {!loading ? (
        <section className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
          <KpiCard
            label="Active bills"
            value={String(kpis.total)}
            footer="Non-void purchases"
            icon={FileText}
            tone="violet"
          />
          <KpiCard
            label="Pending amount"
            value={formatPurchaseMoney(kpis.pendingAmount)}
            footer={`${kpis.pendingCount} bill${kpis.pendingCount === 1 ? "" : "s"} open`}
            icon={Wallet}
            tone="amber"
          />
          <KpiCard
            label="Overdue"
            value={String(kpis.overdueCount)}
            footer="Past due date"
            icon={Clock3}
            tone="rose"
          />
          <KpiCard
            label="Paid bills"
            value={String(kpis.paidCount)}
            footer="Fully settled"
            icon={CheckCircle2}
            tone="emerald"
          />
          <KpiCard
            label="Total amount paid"
            value={formatPurchaseMoney(kpis.totalAmountPaid)}
            footer="Including partial payments"
            icon={Banknote}
            tone="blue"
          />
        </section>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-500">
          Loading bills…
        </div>
      ) : (
        <PurchaseDataTable
          tab={tab}
          bills={bills}
          vendors={vendors}
          showPaymentDetails
          onTabChange={(next) => {
            if (next === "vendors") return;
            setTab(next);
          }}
          onNewBill={() => setNewBillOpen(true)}
          onSelectVendor={() => undefined}
          onViewBill={(bill) => setSelectedBill(bill)}
          onEditBill={(bill) => setEditingBill(bill)}
          onDeleteBill={onDeleteBill}
          onRestoreBill={onRestoreBill}
          onPermanentDeleteBill={onPermanentDeleteBill}
          onPayBill={(bill) => openPay(bill)}
          onExport={onExport}
          onTransition={onTransition}
          onBulkVoid={onBulkVoid}
          onBulkDelete={onBulkDelete}
        />
      )}

      <NewPurchaseBillDialog
        open={newBillOpen}
        submitting={submitting}
        vendors={vendors}
        onClose={() => setNewBillOpen(false)}
        onCreateVendor={() => {
          setNewBillOpen(false);
          setNewVendorOpen(true);
        }}
        onSwitchToPO={() => {
          setNewBillOpen(false);
          setNewPoOpen(true);
        }}
        onCreate={createBill}
      />

      <NewPurchaseOrderDialog
        open={newPoOpen}
        submitting={submitting}
        vendors={vendors}
        onClose={() => setNewPoOpen(false)}
        onCreateVendor={() => {
          setNewPoOpen(false);
          setNewVendorOpen(true);
        }}
        onSwitchToDirectBill={() => {
          setNewPoOpen(false);
          setNewBillOpen(true);
        }}
        onCreatePO={createPO}
      />

      <NewVendorDialog
        open={newVendorOpen}
        submitting={submitting}
        onClose={() => {
          setNewVendorOpen(false);
          setNewBillOpen(true);
        }}
        onCreate={onCreateVendor}
      />

      <RecordPaymentDialog
        open={paymentOpen}
        submitting={submitting}
        bills={bills}
        initialBillId={payBillId}
        onClose={() => {
          setPaymentOpen(false);
          setPayBillId(null);
        }}
        onRecord={recordPayment}
      />

      <ImportPurchasesDialog
        open={importOpen}
        submitting={submitting}
        vendors={vendors}
        onClose={() => setImportOpen(false)}
        onImportSuccess={async (count: number) => {
          setSubmitting(true);
          setError(null);
          try {
            await load();
            setImportOpen(false);
            setMessage(`Imported ${count} purchase${count === 1 ? "" : "s"} successfully.`);
          } catch (err) {
            setError("Failed to load workspace after import.");
          } finally {
            setSubmitting(false);
          }
        }}
      />

      <BillInspectorDrawer
        bill={selectedBill}
        vendor={
          selectedBill
            ? vendors.find((row) => row.id === selectedBill.vendorId) ?? null
            : null
        }
        onClose={() => setSelectedBill(null)}
        onEditBill={(bill) => setEditingBill(bill)}
        onDeleteBill={onDeleteBill}
      />

      <EditPurchaseBillDialog
        open={Boolean(editingBill)}
        submitting={submitting}
        bill={editingBill}
        vendors={vendors}
        onClose={() => setEditingBill(null)}
        onUpdate={onUpdateBill}
      />
    </div>
  );
}

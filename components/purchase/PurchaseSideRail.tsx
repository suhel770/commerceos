"use client";

import {
  CalendarClock,
  Receipt,
  Wallet,
} from "lucide-react";

import { formatPurchaseMoney } from "@/lib/purchase";

type ExpenseRow = {
  label: string;
  amount: number;
};

type UpcomingRow = {
  id: string;
  label: string;
  dueDate: string;
  amount: number;
  overdue: boolean;
};

type PurchaseSideRailProps = {
  summary: {
    totalPurchases: number;
    totalBills: number;
    paidBills: number;
    pendingBills: number;
    overdueBills: number;
    paymentsMade: number;
    inventorySpend: number;
    expenseSpend: number;
    assetSpend: number;
    pendingAmount: number;
    outstandingVendors: number;
    cashOutflow: number;
  };
  expenses: ExpenseRow[];
  upcoming: UpcomingRow[];
};

const EXPENSE_RANK = [
  "bg-orange-500 text-white",
  "bg-amber-500 text-white",
  "bg-yellow-500 text-amber-950",
  "bg-orange-400 text-white",
  "bg-amber-400 text-amber-950",
  "bg-orange-300 text-orange-950",
  "bg-amber-300 text-amber-950",
  "bg-orange-200 text-orange-900",
] as const;

export default function PurchaseSideRail({
  summary,
  expenses,
  upcoming,
}: PurchaseSideRailProps) {
  const summaryRows = [
    ["Total Purchases", String(summary.totalPurchases), "text-violet-800"],
    ["Total Bills", String(summary.totalBills), "text-violet-800"],
    ["Paid Bills", String(summary.paidBills), "text-emerald-700"],
    ["Pending Bills", String(summary.pendingBills), "text-amber-700"],
    ["Overdue Bills", String(summary.overdueBills), "text-rose-600"],
    [
      "Outstanding Vendors",
      String(summary.outstandingVendors),
      "text-violet-800",
    ],
  ] as const;

  const spendRows = [
    ["Inventory & Packaging", summary.inventorySpend, "bg-blue-50 text-blue-800"],
    ["Expenses & Services", summary.expenseSpend, "bg-amber-50 text-amber-800"],
    ["Assets", summary.assetSpend, "bg-emerald-50 text-emerald-800"],
    ["Pending payable", summary.pendingAmount, "bg-rose-50 text-rose-700"],
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {/* Summary — violet */}
      <section className="overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 shadow-sm">
        <header className="flex items-center gap-2.5 border-b border-violet-100 bg-violet-600/95 px-4 py-3 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
            <Wallet className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold tracking-tight">
            Purchase Summary (This Month)
          </h2>
        </header>
        <div className="space-y-3 p-4">
          <div className="space-y-2">
            {summaryRows.map(([label, value, tone]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg bg-white/70 px-2.5 py-1.5 text-sm"
              >
                <span className="text-slate-600">{label}</span>
                <span className={`font-bold ${tone}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {spendRows.map(([label, amount, chip]) => (
              <div
                key={label}
                className={`rounded-xl px-2.5 py-2 ${chip}`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                  {label}
                </p>
                <p className="mt-0.5 text-sm font-bold">
                  {formatPurchaseMoney(amount)}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-xl bg-violet-600 px-3 py-2.5 text-white">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-violet-100">Cash outflow</span>
              <span className="font-bold">
                {formatPurchaseMoney(summary.cashOutflow)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-violet-100">
                Payments made
              </span>
              <span className="font-bold text-emerald-200">
                {formatPurchaseMoney(summary.paymentsMade)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Expenses — amber */}
      <section className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-sm">
        <header className="flex items-center gap-2.5 border-b border-amber-100 bg-amber-500 px-4 py-3 text-amber-950">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/30">
            <Receipt className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold tracking-tight">
            Top Expense Lines
          </h2>
        </header>
        <div className="space-y-2 p-4">
          {expenses.length === 0 ? (
            <p className="text-xs text-amber-800/70">No expense bills yet.</p>
          ) : (
            expenses.map((row, index) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-2 rounded-xl border border-amber-100/80 bg-white/80 px-2.5 py-2 text-sm shadow-sm"
              >
                <span className="flex min-w-0 items-center gap-2 text-slate-700">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                      EXPENSE_RANK[index] ?? "bg-orange-200 text-orange-900"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate font-medium">{row.label}</span>
                </span>
                <span className="shrink-0 font-bold text-amber-800">
                  {formatPurchaseMoney(row.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Upcoming — sky / rose accents */}
      <section className="overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-teal-50 shadow-sm md:col-span-2 xl:col-span-1">
        <header className="flex items-center gap-2.5 border-b border-sky-100 bg-sky-600 px-4 py-3 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
            <CalendarClock className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold tracking-tight">
            Upcoming Payments
          </h2>
        </header>
        <div className="space-y-2 p-4">
          {upcoming.length === 0 ? (
            <p className="text-xs text-sky-800/70">No upcoming dues.</p>
          ) : (
            upcoming.map((row) => (
              <div
                key={row.id}
                className={`flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-sm shadow-sm ${
                  row.overdue
                    ? "border-rose-200 bg-rose-50/90"
                    : "border-sky-100 bg-white/80"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-800">
                    {row.label}
                  </span>
                  <span
                    className={`text-[11px] font-bold ${
                      row.overdue ? "text-rose-600" : "text-sky-700"
                    }`}
                  >
                    {row.overdue ? "Overdue · " : "Due · "}
                    {row.dueDate}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${
                    row.overdue
                      ? "bg-rose-600 text-white"
                      : "bg-sky-600 text-white"
                  }`}
                >
                  {formatPurchaseMoney(row.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

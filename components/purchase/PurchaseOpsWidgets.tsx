"use client";

import { formatPurchaseMoney } from "@/lib/purchase";

import type {
  BusinessActivity,
  OpsTask,
  PurchaseCapabilities,
  PurchaseHealthReason,
} from "./purchase-ops";

type UpcomingRow = {
  id: string;
  label: string;
  dueDate: string;
  amount: number;
  overdue: boolean;
  billId: string;
};

type PurchaseOpsWidgetsProps = {
  capabilities: PurchaseCapabilities;
  todayTasks: OpsTask[];
  upcoming: UpcomingRow[];
  activity: BusinessActivity[];
  healthScore: number;
  healthReasons: PurchaseHealthReason[];
  onTaskNavigate(key: OpsTask["onNavigateKey"]): void;
  onOpenBill(billId: string): void;
  onOpenVendor(vendorId: string): void;
  onOpenPending(): void;
};

export default function PurchaseOpsWidgets({
  capabilities,
  todayTasks,
  upcoming,
  activity,
  healthScore,
  healthReasons,
  onTaskNavigate,
  onOpenBill,
  onOpenVendor,
  onOpenPending,
}: PurchaseOpsWidgetsProps) {
  return (
    <div className="space-y-3">
      <section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Today&apos;s tasks
          </h3>
          {todayTasks.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No urgent procurement tasks right now.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {todayTasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => onTaskNavigate(task.onNavigateKey)}
                    className="w-full rounded-lg bg-slate-50 px-2.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-800"
                  >
                    {task.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={onOpenPending}
            className="mt-3 text-xs font-semibold text-violet-700 hover:underline"
          >
            Open pending bills
          </button>
        </div>

        {capabilities.finance ? (
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Upcoming payments
            </h3>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No due dates in view.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {upcoming.slice(0, 4).map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => onOpenBill(row.billId)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-left hover:bg-violet-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {row.label}
                      </p>
                      <p
                        className={`text-xs font-semibold ${
                          row.overdue ? "text-rose-600" : "text-slate-500"
                        }`}
                      >
                        {row.overdue ? "Overdue · " : "Due · "}
                        {row.dueDate}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-slate-900 font-mono">
                      {formatPurchaseMoney(row.amount)}
                    </span>
                  </button>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recent activity
          </h3>
          {activity.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No recent events.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {activity.slice(0, 5).map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => {
                    if (event.billId) onOpenBill(event.billId);
                    else if (event.vendorId) onOpenVendor(event.vendorId);
                  }}
                  className="flex w-full items-start gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-left hover:bg-violet-50"
                >
                  <span className="shrink-0 text-xs font-bold text-slate-400 font-mono">
                    {event.timeLabel}
                  </span>
                  <span className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800">
                      {event.title}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {event.detail}
                    </p>
                  </span>
                </button>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Purchase health
          </h3>
          <p className="mt-2 text-2xl font-bold text-slate-900">{healthScore}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${
                healthScore >= 85
                  ? "bg-emerald-500"
                  : healthScore >= 60
                    ? "bg-amber-500"
                    : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(100, healthScore)}%` }}
            />
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
            Reasons
          </p>
          <ul className="mt-1 space-y-1">
            {healthReasons.map((reason) => (
              <li
                key={reason.id}
                className={`text-xs font-semibold ${
                  reason.ok ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {reason.ok ? "✓" : "!"} {reason.label}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

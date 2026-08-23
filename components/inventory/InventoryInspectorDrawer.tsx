"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { motion } from "framer-motion";
import { safeResponseJson } from "@/lib/api/client";

import type { Reservation, StockBalance, StockMovement } from "@/lib/inventory/types";
import {
  DEFAULT_WAREHOUSE_ID,
  SECONDARY_WAREHOUSE_ID,
} from "@/lib/inventory/types";

import {
  formatDateTime,
  formatQty,
  movementLabel,
  productImageSrc,
  productTotals,
  rowTotal,
  stockStatusChip,
  stockStatusForRow,
  warehouseLabel,
  buildHealthMap,
} from "./inventory-ops";
import type { InventoryHealthRow, InventoryPlanRow } from "@/lib/inventory/planning/types";

type DrawerTab =
  | "summary"
  | "warehouses"
  | "ledger"
  | "reservations"
  | "operations";

const TABS: Array<[DrawerTab, string]> = [
  ["summary", "Summary"],
  ["warehouses", "Warehouses"],
  ["ledger", "Ledger"],
  ["reservations", "Reservations"],
  ["operations", "Operations"],
];

interface InventoryInspectorDrawerProps {
  row: StockBalance;
  allBalances: StockBalance[];
  healthRows: InventoryHealthRow[];
  plans: InventoryPlanRow[];
  submitting?: boolean;
  onClose(): void;
  onAdjust(input: {
    productId: string;
    warehouseId: string;
    delta: number;
    reason: string;
  }): void;
  onReserve(input: {
    productId: string;
    warehouseId: string;
    quantity: number;
    reference: string;
  }): void;
  onRelease(reservationId: string): void;
  onTransfer(input: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    reason: string;
  }): void;
}

export default function InventoryInspectorDrawer({
  row,
  allBalances,
  healthRows,
  plans,
  submitting,
  onClose,
  onAdjust,
  onReserve,
  onRelease,
  onTransfer,
}: InventoryInspectorDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>("summary");
  const [snapshot, setSnapshot] = useState<{
    balances: StockBalance[];
    movements: StockMovement[];
    reservations: Reservation[];
  } | null>(null);
  const [delta, setDelta] = useState("10");
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("Manual adjustment");
  const [toWarehouse, setToWarehouse] = useState("");

  const healthByProduct = buildHealthMap(healthRows, plans);
  const status = row ? stockStatusForRow(row, healthByProduct) : "in_stock";
  const chip = stockStatusChip(status);
  const productRows = row ? allBalances.filter((b) => b.productId === row.productId) : [];
  const totals = row ? productTotals(allBalances, row.productId) : { available: 0, reserved: 0, incoming: 0, damaged: 0, inTransit: 0 };

  useEffect(() => {
    setTab("summary");
    if (!row) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/v1/inventory/${row.productId}`);
        const payload = await safeResponseJson(response);
        if (!cancelled && payload.success) {
          setSnapshot({
            balances: payload.data.balances,
            movements: payload.data.movements,
            reservations: payload.data.reservations,
          });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [row.productId, row.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const balances = snapshot?.balances ?? productRows;
  const movements = snapshot?.movements ?? [];
  const reservations = snapshot?.reservations ?? [];

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close inventory inspector"
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
        aria-label={`Inventory ${row.sku}`}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="fixed inset-y-0 right-0 z-[100] flex h-screen w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl"
      >
        <div className="border-b border-slate-200 bg-white px-5 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2">
              <button
                type="button"
                onClick={onClose}
                className="mt-0.5 shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex min-w-0 items-start gap-3">
                <span className="inline-flex h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <img
                    src={productImageSrc(row.productId)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-bold text-slate-900">
                      {row.productName}
                    </h2>
                    <span
                      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold leading-none ${chip.className}`}
                    >
                      {chip.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {row.sku} · {warehouseLabel(row.warehouseId)}
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex gap-1 overflow-x-auto">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold ${
                  tab === id
                    ? "border-violet-600 text-violet-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "summary" ? (
            <div className="space-y-3">
              <section className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Inventory Summary
                </h3>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  {(
                    [
                      ["Sellable", totals.available],
                      ["Reserved", totals.reserved],
                      ["Incoming", totals.incoming],
                      ["In Transit", totals.inTransit],
                      ["Damaged", totals.damaged],
                      ["This WH total", rowTotal(row)],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-slate-500">{label}</dt>
                      <dd className="mt-0.5 font-semibold text-slate-900">
                        {formatQty(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
              {movements[0] ? (
                <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <h3 className="font-semibold text-slate-900">Last movement</h3>
                  <p className="mt-2 text-slate-700">
                    {movementLabel(movements[0])} ·{" "}
                    <span
                      className={
                        movements[0].quantity >= 0
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }
                    >
                      {movements[0].quantity >= 0 ? "+" : ""}
                      {formatQty(movements[0].quantity)}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(movements[0].createdAt)}
                  </p>
                </section>
              ) : null}
            </div>
          ) : null}

          {tab === "warehouses" ? (
            <div className="space-y-2">
              {balances.map((balance) => (
                <section
                  key={balance.id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <h3 className="text-sm font-semibold text-slate-900">
                    {warehouseLabel(balance.warehouseId)}
                  </h3>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div>
                      <dt className="text-slate-500">Available</dt>
                      <dd className="font-semibold">{formatQty(balance.available)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Reserved</dt>
                      <dd className="font-semibold">{formatQty(balance.reserved)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Damaged</dt>
                      <dd className="font-semibold">{formatQty(balance.damaged)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">In Transit</dt>
                      <dd className="font-semibold">{formatQty(balance.inTransit)}</dd>
                    </div>
                  </dl>
                </section>
              ))}
            </div>
          ) : null}

          {tab === "ledger" ? (
            <ol className="space-y-2">
              {movements.length === 0 ? (
                <p className="text-sm text-slate-500">No ledger entries.</p>
              ) : (
                movements.map((movement) => (
                  <li
                    key={movement.id}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-900">
                        {movementLabel(movement)}
                      </span>
                      <span
                        className={`font-bold ${
                          movement.quantity >= 0
                            ? "text-emerald-700"
                            : "text-rose-700"
                        }`}
                      >
                        {movement.quantity >= 0 ? "+" : ""}
                        {formatQty(movement.quantity)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {warehouseLabel(movement.warehouseId)} ·{" "}
                      {formatDateTime(movement.createdAt)}
                      {movement.reason ? ` · ${movement.reason}` : ""}
                      {movement.reference ? ` · ${movement.reference}` : ""}
                    </p>
                  </li>
                ))
              )}
            </ol>
          ) : null}

          {tab === "reservations" ? (
            <div className="space-y-2">
              {reservations.length === 0 ? (
                <p className="text-sm text-slate-500">No open reservations.</p>
              ) : (
                reservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatQty(reservation.quantity)} units
                      </p>
                      <p className="text-xs text-slate-500">
                        {warehouseLabel(reservation.warehouseId)} ·{" "}
                        {reservation.reference ?? "No reference"}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => onRelease(reservation.id)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Release
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : null}

          {tab === "operations" ? (
            <div className="space-y-3">
              <section className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Stock adjustment
                </h3>
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    value={delta}
                    onChange={(event) => setDelta(event.target.value)}
                    className="h-9 w-28 rounded-lg border border-slate-200 px-2 text-sm"
                  />
                  <input
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 px-2 text-sm"
                    placeholder="Reason"
                  />
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      onAdjust({
                        productId: row.productId,
                        warehouseId: row.warehouseId,
                        delta: Number(delta),
                        reason,
                      })
                    }
                    className="rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Reserve stock
                </h3>
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(event) => setQty(event.target.value)}
                    className="h-9 w-28 rounded-lg border border-slate-200 px-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      onReserve({
                        productId: row.productId,
                        warehouseId: row.warehouseId,
                        quantity: Number(qty),
                        reference: reason || "Manual reserve",
                      })
                    }
                    className="rounded-lg border border-orange-300 bg-orange-50 px-3 text-xs font-semibold text-orange-900 disabled:opacity-50"
                  >
                    Reserve
                  </button>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Transfer warehouse
                </h3>
                <div className="mt-2 space-y-2">
                  <select
                    value={toWarehouse}
                    onChange={(event) => setToWarehouse(event.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm"
                  >
                    <option value={DEFAULT_WAREHOUSE_ID}>
                      {warehouseLabel(DEFAULT_WAREHOUSE_ID)}
                    </option>
                    <option value={SECONDARY_WAREHOUSE_ID}>
                      {warehouseLabel(SECONDARY_WAREHOUSE_ID)}
                    </option>
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(event) => setQty(event.target.value)}
                      className="h-9 w-28 rounded-lg border border-slate-200 px-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={submitting || toWarehouse === row.warehouseId}
                      onClick={() =>
                        onTransfer({
                          productId: row.productId,
                          fromWarehouseId: row.warehouseId,
                          toWarehouseId: toWarehouse,
                          quantity: Number(qty),
                          reason: reason || "Warehouse transfer",
                        })
                      }
                      className="rounded-lg border border-sky-300 bg-sky-50 px-3 text-xs font-semibold text-sky-900 disabled:opacity-50"
                    >
                      Transfer
                    </button>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </motion.aside>
    </>
  );
}

"use client";

import { useState } from "react";
import ConsumablesTableHeader from "./ConsumablesTableHeader";
import ConsumablesRow from "./ConsumablesRow";
import type { ConsumableItem } from "@/lib/consumables/consumable.service";
import { Boxes } from "lucide-react";
import BillInspectorDrawer from "@/components/purchase/BillInspectorDrawer";
import { safeResponseJson } from "@/lib/api/client";
import type { PurchaseBill } from "@/lib/purchase";

interface ConsumablesDataTableProps {
  consumables: ConsumableItem[];
  loading: boolean;
}

export default function ConsumablesDataTable({
  consumables,
  loading,
}: ConsumablesDataTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);
  const [openingSku, setOpeningSku] = useState<string | null>(null);

  const openSourceBill = async (consumable: ConsumableItem) => {
    setOpeningSku(consumable.sku);
    try {
      // Bill search does not index every legacy line-* SKU, so resolve from
      // the live bill lines before opening the shared inspector drawer.
      const response = await fetch("/api/v1/purchase/bills");
      const payload = await safeResponseJson(response);
      const bills: PurchaseBill[] = Array.isArray(payload?.data) ? payload.data : [];
      const sourceBill = bills.find((bill) =>
        bill.lines.some((line) =>
          line.id === consumable.sku ||
          line.sku === consumable.sku ||
          line.productId === consumable.sku ||
          line.description.trim().toLowerCase() === consumable.name.trim().toLowerCase(),
        ),
      );
      if (sourceBill) setSelectedBill(sourceBill);
    } finally {
      setOpeningSku(null);
    }
  };

  const allSelected =
    consumables.length > 0 && selectedIds.size === consumables.length;

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(consumables.map((c) => c.id)));
    }
  };

  const handleToggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <ConsumablesTableHeader
            allSelected={allSelected}
            onToggleAll={handleToggleAll}
          />
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    <p className="mt-3 text-xs font-bold text-slate-500">
                      Loading packaging consumables...
                    </p>
                  </div>
                </td>
              </tr>
            ) : consumables.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Boxes className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-extrabold text-slate-700">
                      No consumables found
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      No packaging items match the selected filter criteria.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              consumables.map((consumable) => (
                <ConsumablesRow
                  key={consumable.id}
                  consumable={consumable}
                  selected={selectedIds.has(consumable.id)}
                  onToggle={() => handleToggleOne(consumable.id)}
                  onOpenSourceBill={openSourceBill}
                  openingSourceBill={openingSku === consumable.sku}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <BillInspectorDrawer bill={selectedBill} onClose={() => setSelectedBill(null)} />
    </div>
  );
}

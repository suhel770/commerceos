"use client";

import { safeResponseJson } from "@/lib/api/client";
import { useEffect, useState, useRef } from "react";
import { X, PackageCheck, AlertTriangle, ChevronDown, ChevronUp, MapPin, Building, ShieldCheck, CheckCircle2 } from "lucide-react";
import type { PurchaseBill } from "@/lib/purchase/types";
import { receivingEngine, type ReceivingItemAllocation } from "@/lib/storage/engine/receiving.engine";
import type { SecurityContext } from "@/lib/storage/domain/types";
import type { StorageLocationCardData } from "../StorageLocationCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BulkReceivingWorkspaceModalProps {
  isOpen: boolean;
  bills: PurchaseBill[];
  onClose: () => void;
  onBulkReceivingComplete: (receivedCount: number) => void;
}

const mockSecurityContext: SecurityContext = {
  tenantId: "tenant-default",
  organizationId: "org-commerceos",
  workspaceId: "ws-default",
  actorId: "usr-solo-founder",
  actorName: "Amir (Solo Seller)",
};

interface BillAllocationMap {
  [billId: string]: ReceivingItemAllocation[];
}

export default function BulkReceivingWorkspaceModal({
  isOpen,
  bills,
  onClose,
  onBulkReceivingComplete,
}: BulkReceivingWorkspaceModalProps) {
  const [allocationsByBill, setAllocationsByBill] = useState<BillAllocationMap>({});
  const [expandedBills, setExpandedBills] = useState<{ [billId: string]: boolean }>({});
  const [availableLocations, setAvailableLocations] = useState<StorageLocationCardData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize bill-wise allocations
  useEffect(() => {
    if (isOpen && bills.length > 0) {
      let active = true;
      fetch("/api/v1/storage/locations")
        .then((res) => safeResponseJson(res))
        .then((payload) => {
          const locs: StorageLocationCardData[] = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
          if (!active) return;
          setAvailableLocations(locs);
          const defaultLocId = locs.find((l) => l.isDefault)?.id || locs[0]?.id || "";

          const newMap: BillAllocationMap = {};
          for (const bill of bills) {
            const lines = receivingEngine.filterReceivableLines(bill);
            newMap[bill.id] = lines.map((line) => {
              const alreadyReceived = line.qcRecord?.receivedQty ?? 0;
              const pending = Math.max(0, line.quantity - alreadyReceived);
              return {
                lineId: line.id,
                sku: line.sku || line.id,
                description: line.description,
                orderedQty: line.quantity,
                alreadyReceivedQty: alreadyReceived,
                receivingQty: pending,
                damagedQty: 0,
                destinationLocationId: defaultLocId,
                intent:
                  line.intent === "asset"
                    ? "asset"
                    : line.intent === "consumable"
                      ? "consumable"
                      : "sellable",
                isPhysicalAsset: line.intent === "asset",
              };
            });
          }
          setAllocationsByBill(newMap);
          const initialExpanded: { [billId: string]: boolean } = {};
          for (const bill of bills) initialExpanded[bill.id] = true;
          setExpandedBills(initialExpanded);
          setErrorMsg(null);
        })
        .catch(() => {
          if (active) setAvailableLocations([]);
        });
      return () => {
        active = false;
      };
    }
  }, [isOpen, bills]);

  if (!isOpen || bills.length === 0) return null;

  const toggleAccordion = (billId: string) => {
    setExpandedBills((prev) => ({ ...prev, [billId]: !prev[billId] }));
  };

  const handleQtyChange = (billId: string, lineId: string, val: number) => {
    setAllocationsByBill((prev) => {
      const list = prev[billId] || [];
      const updated = list.map((item) => {
        if (item.lineId !== lineId) return item;
        const newReceiving = Math.max(0, val);
        const newDamaged = Math.min(item.damagedQty || 0, newReceiving);
        return { ...item, receivingQty: newReceiving, damagedQty: newDamaged };
      });
      return { ...prev, [billId]: updated };
    });
  };

  const handleDamagedChange = (billId: string, lineId: string, val: number) => {
    setAllocationsByBill((prev) => {
      const list = prev[billId] || [];
      const updated = list.map((item) => {
        if (item.lineId !== lineId) return item;
        return { ...item, damagedQty: Math.max(0, val) };
      });
      return { ...prev, [billId]: updated };
    });
  };

  const handleLocationChange = (billId: string, lineId: string, locId: string) => {
    setAllocationsByBill((prev) => {
      const list = prev[billId] || [];
      const updated = list.map((item) =>
        item.lineId === lineId ? { ...item, destinationLocationId: locId } : item
      );
      return { ...prev, [billId]: updated };
    });
  };

  // Compute grand totals across all selected bills
  let grandReceivingQty = 0;
  let grandDamagedQty = 0;
  let grandSellableQty = 0;

  Object.values(allocationsByBill).forEach((allocs) => {
    allocs.forEach((a) => {
      grandReceivingQty += a.receivingQty;
      grandDamagedQty += a.damagedQty || 0;
      grandSellableQty += Math.max(0, a.receivingQty - (a.damagedQty || 0));
    });
  });

  const handleBulkSubmit = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    let successCount = 0;

    try {
      for (const bill of bills) {
        const allocs = allocationsByBill[bill.id] || [];
        if (allocs.length === 0) continue;

        await receivingEngine.executeReceiving({
          billId: bill.id,
          allocations: allocs,
          securityContext: mockSecurityContext,
        });
        successCount += 1;
      }

      onBulkReceivingComplete(successCount);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete bulk receiving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 my-6 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-violet-100 p-1.5 text-violet-700">
                <PackageCheck className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Bulk Receiving Workspace — {bills.length} Purchase Bills
              </h2>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Configure bill-wise receiving & damaged QC quantities for selected dispatches.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Summary Strip */}
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3 shrink-0 text-center">
          <div>
            <div className="text-[10px] font-extrabold uppercase text-slate-500">Receiving Now</div>
            <div className="text-base font-black text-violet-900">{grandReceivingQty} units</div>
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase text-slate-500">Sellable Stock</div>
            <div className="text-base font-black text-emerald-700">+{grandSellableQty} units</div>
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase text-slate-500">Damaged (QC)</div>
            <div className="text-base font-black text-rose-700">{grandDamagedQty} units</div>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-800 shrink-0">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Accordion Bill-Wise Receiving List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {bills.map((bill) => {
            const isExpanded = expandedBills[bill.id] ?? true;
            const allocs = allocationsByBill[bill.id] || [];
            const billReceivingSum = allocs.reduce((sum, a) => sum + a.receivingQty, 0);
            const billDamagedSum = allocs.reduce((sum, a) => sum + (a.damagedQty || 0), 0);

            return (
              <div key={bill.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                {/* Accordion Header */}
                <div
                  onClick={() => toggleAccordion(bill.id)}
                  className="flex items-center justify-between bg-slate-50 px-4 py-3 cursor-pointer hover:bg-slate-100/80 transition-colors border-b border-slate-100 select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <span className="rounded-md bg-violet-600 px-2 py-0.5 text-xs text-white">
                        {bill.billNumber}
                      </span>
                      <span>{bill.vendorName}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-500">· {bill.billDate}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-xs font-bold text-slate-700">
                      Receiving: <span className="text-violet-700 font-extrabold">{billReceivingSum}</span> units
                      {billDamagedSum > 0 && (
                        <span className="ml-2 text-rose-700 font-extrabold">({billDamagedSum} Damaged)</span>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </div>

                {/* Accordion Table Body */}
                {isExpanded && (
                  <div className="p-3 overflow-x-auto">
                    <table className="w-full text-left text-xs table-fixed">
                      <thead className="bg-slate-50/60 text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-100">
                        <tr>
                          <th className="px-3 py-2">Item / SKU</th>
                          <th className="px-2 py-2 text-center w-20">Ordered</th>
                          <th className="px-2 py-2 text-center w-20">Recv&apos;d</th>
                          <th className="px-2 py-2 text-center w-28">Receiving Now</th>
                          <th className="px-2 py-2 text-center w-28 font-bold text-rose-700">Damaged (QC)</th>
                          <th className="px-3 py-2 w-52">Destination Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {allocs.map((item) => (
                          <tr key={item.lineId} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2.5">
                              <div className="font-bold text-slate-900 leading-snug">{item.description}</div>
                              <div className="text-[11px] font-mono text-slate-400">SKU: {item.sku}</div>
                            </td>

                            <td className="px-2 py-2.5 text-center font-bold text-slate-800">{item.orderedQty}</td>

                            <td className="px-2 py-2.5 text-center font-bold text-slate-400">{item.alreadyReceivedQty}</td>

                            <td className="px-2 py-2.5 text-center">
                              <input
                                type="number"
                                min={0}
                                max={item.orderedQty - item.alreadyReceivedQty}
                                value={item.receivingQty}
                                onChange={(e) => handleQtyChange(bill.id, item.lineId, parseInt(e.target.value, 10) || 0)}
                                className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center font-bold text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                              />
                              <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                                Good: <span className="font-bold text-emerald-700">{Math.max(0, item.receivingQty - (item.damagedQty || 0))}</span>
                              </div>
                            </td>

                            <td className="px-2 py-2.5 text-center">
                              <input
                                type="number"
                                min={0}
                                max={item.receivingQty}
                                value={item.damagedQty ?? 0}
                                onChange={(e) => handleDamagedChange(bill.id, item.lineId, parseInt(e.target.value, 10) || 0)}
                                className="w-20 rounded-lg border border-rose-300 bg-rose-50/40 px-2 py-1 text-center font-bold text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none"
                              />
                              <div className="text-[10px] font-semibold text-amber-700 mt-0.5">
                                Pending: <span className="font-bold text-amber-800">{Math.max(0, item.orderedQty - item.alreadyReceivedQty - item.receivingQty)}</span>
                              </div>
                            </td>

                            <td className="px-3 py-2.5">
                              <Select
                                value={item.destinationLocationId}
                                onValueChange={(val) => handleLocationChange(bill.id, item.lineId, val)}
                              >
                                <SelectTrigger size="sm" className="h-8 border-slate-300 bg-white font-bold text-slate-800">
                                  <SelectValue placeholder="Select facility..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableLocations.map((loc) => (
                                    <SelectItem key={loc.id} value={loc.id}>
                                      <span className="font-bold text-slate-900">{loc.name}</span>
                                      {loc.code && <span className="ml-1 text-[10px] text-slate-400 font-mono">({loc.code})</span>}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleBulkSubmit}
            disabled={isSubmitting || grandReceivingQty <= 0}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-black text-white hover:bg-violet-700 shadow-md transition-all disabled:opacity-50"
          >
            <PackageCheck className="h-4 w-4" />
            <span>{isSubmitting ? "Processing Bulk Receiving..." : `Complete Bulk Receiving (${bills.length} Bills)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

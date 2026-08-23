"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X, PackageCheck, AlertCircle, ArrowRight, ShieldCheck, MapPin, ChevronDown, Check, Layers, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import type { PurchaseBill } from "@/lib/purchase/types";
import type { StorageLocationCardData } from "../StorageLocationCard";
import { receivingEngine, type ReceivingItemAllocation } from "@/lib/storage/engine/receiving.engine";
import type { SecurityContext } from "@/lib/storage/domain/types";

interface ReceivingWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: PurchaseBill | null;
  availableLocations: StorageLocationCardData[];
  securityContext: SecurityContext;
  onReceivingComplete: (billNumber: string) => void;
}

interface CustomLocationSelectProps {
  value: string;
  onChange: (locationId: string) => void;
  locations: StorageLocationCardData[];
}

function CustomLocationSelect({ value, onChange, locations }: CustomLocationSelectProps) {
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLoc = locations.find((l) => l.id === value) || locations[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpenMenu((prev) => !prev)}
        className="w-full flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 shadow-sm transition-all hover:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
      >
        <div className="flex items-center gap-2 truncate">
          <MapPin className="h-4 w-4 text-violet-600 shrink-0" />
          <span className="truncate">{selectedLoc?.name || "Select Location"}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpenMenu ? "rotate-180" : ""}`} />
      </button>

      {isOpenMenu && (
        <div className="absolute left-0 right-0 z-[200] top-full mt-1.5 max-h-56 overflow-y-auto custom-scrollbar rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-100">
          {locations.map((loc) => {
            const isSelected = loc.id === value;
            return (
              <div
                key={loc.id}
                onClick={() => {
                  onChange(loc.id);
                  setIsOpenMenu(false);
                }}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-violet-50 text-violet-900 font-black"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MapPin className={`h-3.5 w-3.5 ${isSelected ? "text-violet-600" : "text-slate-400"}`} />
                  <span className="truncate">{loc.name}</span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-violet-600 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface CustomBinSelectProps {
  location?: StorageLocationCardData;
  value: string;
  onChange: (binCode: string) => void;
}

function CustomBinSelect({ location, value, onChange }: CustomBinSelectProps) {
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!location?.subLocationConfig) {
    return null;
  }

  const { bays = 1, racks = 1, shelves = 1, binsPerShelf = 1 } = location.subLocationConfig;

  const binOptions: string[] = ["Unassigned Buffer Bay"];
  for (let b = 1; b <= Math.min(bays, 2); b++) {
    for (let r = 1; r <= Math.min(racks, 2); r++) {
      for (let s = 1; s <= Math.min(shelves, 2); s++) {
        for (let bin = 1; bin <= Math.min(binsPerShelf, 2); bin++) {
          binOptions.push(`BAY${b}-R${r}-S${s}-B${bin}`);
        }
      }
    }
  }

  const selectedBin = value || "Unassigned Buffer Bay";

  return (
    <div ref={containerRef} className="relative w-full mt-1.5">
      <button
        type="button"
        onClick={() => setIsOpenMenu((prev) => !prev)}
        className="w-full flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50/50 px-2.5 py-1.5 text-[11px] font-extrabold text-violet-900 shadow-xs hover:bg-violet-50 focus:outline-none"
      >
        <div className="flex items-center gap-1.5 truncate">
          <Layers className="h-3.5 w-3.5 text-violet-600 shrink-0" />
          <span className="truncate">Bin: {selectedBin}</span>
        </div>
        <ChevronDown className={`h-3 w-3 text-violet-500 shrink-0 transition-transform ${isOpenMenu ? "rotate-180" : ""}`} />
      </button>

      {isOpenMenu && (
        <div className="absolute left-0 right-0 z-[210] top-full mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-2xl space-y-0.5 animate-in fade-in duration-100">
          <div className="px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            Target Shelf / Bin:
          </div>
          {binOptions.map((code) => {
            const isSelected = selectedBin === code;
            return (
              <div
                key={code}
                onClick={() => {
                  onChange(code);
                  setIsOpenMenu(false);
                }}
                className={`flex items-center justify-between rounded-lg px-2 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                  isSelected ? "bg-violet-100 text-violet-900 font-black" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{code}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-violet-600" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ReceivingWorkspaceModal({
  isOpen,
  onClose,
  bill,
  availableLocations,
  securityContext,
  onReceivingComplete,
}: ReceivingWorkspaceModalProps) {
  const [allocations, setAllocations] = useState<ReceivingItemAllocation[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  type AllocationSortField = "description" | "intent" | "orderedQty" | "alreadyReceivedQty" | "receivingQty";
  type SortDirection = "asc" | "desc";

  const [sortField, setSortField] = useState<AllocationSortField>("description");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  const handleSort = (field: AllocationSortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const renderSortIcon = (field: AllocationSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1 inline-block" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-violet-600 shrink-0 font-bold ml-1 inline-block" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-violet-600 shrink-0 font-bold ml-1 inline-block" />
    );
  };

  const sortedAllocations = useMemo(() => {
    return [...allocations].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (sortField === "description") {
        valA = a.description.toLowerCase();
        valB = b.description.toLowerCase();
      } else if (sortField === "intent") {
        valA = a.intent;
        valB = b.intent;
      } else if (sortField === "orderedQty") {
        valA = a.orderedQty;
        valB = b.orderedQty;
      } else if (sortField === "alreadyReceivedQty") {
        valA = a.alreadyReceivedQty;
        valB = b.alreadyReceivedQty;
      } else if (sortField === "receivingQty") {
        valA = a.receivingQty;
        valB = b.receivingQty;
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [allocations, sortField, sortDir]);

  // ESC key handler to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const initializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (bill && isOpen) {
      if (initializedRef.current === bill.id) return;
      initializedRef.current = bill.id;

      setErrorMsg(null);
      // Filter destinations: Internal Physical Locations only (excludes Amazon FBA / external fulfillment)
      const internalOnlyLocations = availableLocations.filter((l) => l.locationScope !== "external_fulfillment");
      const defaultLocation = internalOnlyLocations.find((l) => l.isDefault) || internalOnlyLocations[0] || availableLocations[0];
      const defaultLocationId = defaultLocation?.id || "";
      const defaultLocationName = defaultLocation?.name || "";

      // Filter for receivable lines (sellable, consumable, or physical storage fixed assets)
      const receivableLines = receivingEngine.filterReceivableLines(bill);

      const initialAllocations: ReceivingItemAllocation[] = receivableLines.map((line) => {
        const alreadyReceived = line.qcRecord?.receivedQty ?? 0;
        const pending = Math.max(0, line.quantity - alreadyReceived);
        const intent: "sellable" | "consumable" | "asset" =
          line.intent === "asset"
            ? "asset"
            : line.intent === "consumable"
              ? "consumable"
              : "sellable";

        return {
          lineId: line.id,
          sku: line.sku || line.id,
          description: line.description,
          orderedQty: line.quantity,
          alreadyReceivedQty: alreadyReceived,
          receivingQty: pending,
          damagedQty: 0,
          destinationLocationId: defaultLocationId,
          destinationLocationName: defaultLocationName,
          intent,
          isPhysicalAsset: line.intent === "asset",
        };
      });

      setAllocations(initialAllocations);
    } else {
      initializedRef.current = null;
    }
  }, [bill, isOpen, availableLocations]);

  if (!isOpen || !bill) return null;

  const handleQtyChange = (lineId: string, val: number) => {
    setAllocations((prev) =>
      prev.map((item) => {
        if (item.lineId !== lineId) return item;
        const newReceiving = Math.max(0, val);
        const newDamaged = Math.min(item.damagedQty || 0, newReceiving);
        return { ...item, receivingQty: newReceiving, damagedQty: newDamaged };
      })
    );
  };

  const handleDamagedChange = (lineId: string, val: number) => {
    setAllocations((prev) =>
      prev.map((item) => {
        if (item.lineId !== lineId) return item;
        const newDamaged = Math.max(0, val);
        return { ...item, damagedQty: newDamaged };
      })
    );
  };

  const handleLocationChange = (lineId: string, locationId: string) => {
    setAllocations((prev) =>
      prev.map((item) => (item.lineId === lineId ? { ...item, destinationLocationId: locationId, targetBin: undefined } : item))
    );
  };

  const handleBinChange = (lineId: string, binCode: string) => {
    setAllocations((prev) =>
      prev.map((item) => (item.lineId === lineId ? { ...item, targetBin: binCode } : item))
    );
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const result = await receivingEngine.executeReceiving({
        billId: bill.id,
        allocations,
        securityContext,
      });

      if (result.success) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("commerceos_stock_updated"));
        }
        onReceivingComplete(result.billNumber);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete receiving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-700">
                <PackageCheck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Receiving Workspace — {bill.billNumber}
              </h2>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Supplier: <span className="text-slate-900 font-extrabold">{bill.vendorName}</span> • Date: {bill.billDate}
            </p>
          </div>

          <button
            onClick={onClose}
            title="Close (ESC)"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Business Rule Banner */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs text-slate-700 font-medium">
          <ShieldCheck className="h-4 w-4 shrink-0 text-violet-600" />
          <span>
            Physical goods for this bill: <strong>Sellable Inventory</strong>, <strong>Consumables</strong>, and <strong>Storage Equipment (Racks, Shelves, Physical Assets)</strong>. Non-physical expenses and services bypass Storage.
          </span>
        </div>

        {/* Validation Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3.5 border border-rose-200 text-xs font-bold text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Item Allocations Table Container */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Fixed Header Table (No Scrollbar overlap) */}
          <table className="w-full text-left text-xs font-sans table-fixed">
            <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <tr>
                <th
                  onClick={() => handleSort("description")}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                >
                  <div className="flex items-center">
                    <span>Item / SKU</span>
                    {renderSortIcon("description")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("intent")}
                  className="px-3 py-3 text-center w-28 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                >
                  <div className="flex items-center justify-center">
                    <span>Type</span>
                    {renderSortIcon("intent")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("orderedQty")}
                  className="px-3 py-3 text-center w-20 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                >
                  <div className="flex items-center justify-center">
                    <span>Ordered</span>
                    {renderSortIcon("orderedQty")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("alreadyReceivedQty")}
                  className="px-3 py-3 text-center w-20 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                >
                  <div className="flex items-center justify-center">
                    <span>Recv&apos;d</span>
                    {renderSortIcon("alreadyReceivedQty")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("receivingQty")}
                  className="px-3 py-3 text-center w-28 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                >
                  <div className="flex items-center justify-center">
                    <span>Receiving Now</span>
                    {renderSortIcon("receivingQty")}
                  </div>
                </th>
                <th className="px-3 py-3 text-center w-28 font-extrabold text-rose-700">Damaged (QC)</th>
                <th className="px-4 py-3 w-64">Destination Storage Location</th>
              </tr>
            </thead>
          </table>

          {/* Scrollable Items List (Scrollbar starts strictly BELOW the header!) */}
          <div className="max-h-[440px] overflow-y-auto overflow-x-hidden custom-scrollbar [&>table]:relative">
            <table className="w-full text-left text-xs font-sans table-fixed">
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {sortedAllocations.map((item) => (
                  <tr key={item.lineId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 leading-snug">{item.description}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">SKU: {item.sku}</div>
                    </td>

                    <td className="px-3 py-3.5 text-center w-28">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          item.intent === "asset"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : item.intent === "consumable"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {item.intent === "asset"
                          ? "Equipment"
                          : item.intent === "consumable"
                            ? "Consumable"
                            : "Inventory"}
                      </span>
                    </td>

                    <td className="px-3 py-3.5 text-center font-bold text-slate-900 w-20">{item.orderedQty}</td>

                    <td className="px-3 py-3.5 text-center font-bold text-slate-500 w-20">{item.alreadyReceivedQty}</td>

                    <td className="px-3 py-3.5 text-center w-28">
                      <input
                        type="number"
                        min={0}
                        max={item.orderedQty - item.alreadyReceivedQty}
                        value={item.receivingQty}
                        onChange={(e) => handleQtyChange(item.lineId, parseInt(e.target.value, 10) || 0)}
                        className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-center font-bold text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                      />
                      <div className="text-[10px] font-semibold text-slate-500 mt-1">
                        Good: <span className="font-bold text-emerald-700">{Math.max(0, item.receivingQty - (item.damagedQty || 0))}</span>
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-center w-28">
                      <input
                        type="number"
                        min={0}
                        max={item.receivingQty}
                        value={item.damagedQty ?? 0}
                        onChange={(e) => handleDamagedChange(item.lineId, parseInt(e.target.value, 10) || 0)}
                        title="Enter damaged quantity for QC record"
                        className="w-20 rounded-lg border border-rose-300 bg-rose-50/40 px-2.5 py-1.5 text-center font-bold text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none"
                      />
                      <div className="text-[10px] font-semibold text-amber-700 mt-1">
                        Pending: <span className="font-bold text-amber-800">{Math.max(0, item.orderedQty - item.alreadyReceivedQty - item.receivingQty)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 w-64">
                      <CustomLocationSelect
                        value={item.destinationLocationId}
                        onChange={(locationId) => handleLocationChange(item.lineId, locationId)}
                        locations={availableLocations.filter((l) => l.locationScope !== "external_fulfillment")}
                      />
                      <CustomBinSelect
                        location={availableLocations.find((l) => l.id === item.destinationLocationId)}
                        value={item.targetBin || "Unassigned Buffer Bay"}
                        onChange={(binCode) => handleBinChange(item.lineId, binCode)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-extrabold text-white hover:bg-violet-700 active:scale-95 transition-all shadow-md shadow-violet-200 disabled:opacity-50"
          >
            {isSubmitting ? "Completing..." : "Complete Receiving"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

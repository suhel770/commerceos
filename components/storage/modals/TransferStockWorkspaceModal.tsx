"use client";

import { safeResponseJson } from "@/lib/api/client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowRightLeft, MapPin, CheckCircle2, ArrowRight, AlertTriangle, Plus } from "lucide-react";
import SearchableSkuSelect from "./SearchableSkuSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StockBalance } from "@/lib/inventory/types";

interface TransferStockWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocationId: string;
  currentLocationName: string;
  balances: StockBalance[];
  onTransferComplete: (data: { sku: string; qty: number; destinationLocName: string }) => void;
}

export default function TransferStockWorkspaceModal({
  isOpen,
  onClose,
  currentLocationId,
  currentLocationName,
  balances,
  onTransferComplete,
}: TransferStockWorkspaceModalProps) {
  const router = useRouter();
  const [selectedSkuKey, setSelectedSkuKey] = useState<string>("");
  const [targetLocId, setTargetLocId] = useState<string>("");
  const [transferQty, setTransferQty] = useState<number>(1);
  const [isSuccess, setIsSuccess] = useState(false);

  const [availableDestinationLocations, setAvailableDestinationLocations] = useState<Array<{ id: string; name: string; code: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      let active = true;
      fetch("/api/v1/storage/locations")
        .then((res) => safeResponseJson(res))
        .then((payload) => {
          const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
          if (!active) return;
          const filtered = items
            .filter((l: any) => !l.isArchived)
            .filter(
              (l: any) =>
                l.id !== currentLocationId &&
                l.id?.toLowerCase() !== currentLocationId?.toLowerCase() &&
                l.code?.toLowerCase() !== currentLocationId?.toLowerCase()
            )
            .map((l: any) => ({
              id: l.id || l.code,
              name: l.name || l.code || "Storage Facility",
              code: l.code || "",
            }));
          setAvailableDestinationLocations(filtered);
          if (filtered.length > 0 && !targetLocId) {
            setTargetLocId(filtered[0].id);
          }
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }
  }, [isOpen, currentLocationId, targetLocId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const selectedItem = useMemo(() => {
    if (!selectedSkuKey && balances.length > 0) return balances[0];
    return balances.find((b) => (b.sku || b.id) === selectedSkuKey) || balances[0];
  }, [balances, selectedSkuKey]);

  if (!isOpen) return null;

  const hasMultipleLocations = availableDestinationLocations.length > 0;
  const targetLoc = availableDestinationLocations.find((l) => l.id === targetLocId) || availableDestinationLocations[0];
  const maxAvailable = selectedItem ? selectedItem.available || 0 : 0;

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExecuteTransfer = async () => {
    if (!selectedItem || !targetLoc || transferQty <= 0 || transferQty > maxAvailable) return;

    setErrorMsg(null);
    try {
      const res = await fetch("/api/v1/storage/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operationType: "transfer",
          sku: selectedItem.sku,
          qty: transferQty,
          sourceLocationId: currentLocationId,
          targetLocationId: targetLoc.id,
          reason: `Inter-facility stock transfer`,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to execute transfer.");
      }

      setIsSuccess(true);
      setTimeout(() => {
        onTransferComplete({
          sku: selectedItem.sku,
          qty: transferQty,
          destinationLocName: targetLoc.name,
        });
        setIsSuccess(false);
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete transfer.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl transition-all border border-slate-100">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">Inter-Facility Stock Transfer</h3>
                <p className="text-xs font-semibold text-slate-400">Relocate inventory between storage nodes</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!hasMultipleLocations ? (
            /* Warning Banner if only 1 location exists */
            <div className="py-8 text-center space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h4 className="text-sm font-extrabold text-slate-900">No Destination Facility Available</h4>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                  Inter-facility stock transfer requires at least <span className="font-extrabold text-slate-900">2 active storage locations</span>. Currently, only <span className="font-extrabold text-indigo-600">{currentLocationName}</span> exists.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push("/storage?action=create");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create 2nd Storage Facility</span>
                </button>
              </div>
            </div>
          ) : isSuccess ? (
            /* Success Feedback */
            <div className="py-12 text-center space-y-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h4 className="text-base font-black text-slate-900">Stock Transfer Executed!</h4>
              <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto">
                Transferred {transferQty} units of {selectedItem?.productName} to {targetLoc?.name}.
              </p>
            </div>
          ) : (
            /* Form Fields when multiple locations exist */
            <div className="mt-5 space-y-4">
              {errorMsg && (
                <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100">
                  {errorMsg}
                </div>
              )}
              {/* Origin & Destination Nodes */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Source Location</span>
                  <div className="text-xs font-black text-slate-900 truncate flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-indigo-600 shrink-0" />
                    <span className="truncate">{currentLocationName}</span>
                  </div>
                </div>

                <div className="space-y-1 border-l border-slate-200 pl-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Destination Location</span>
                  <Select value={targetLocId} onValueChange={setTargetLocId}>
                    <SelectTrigger size="sm" className="h-8 border-slate-200 bg-white font-extrabold text-indigo-700">
                      <SelectValue placeholder="Choose destination..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDestinationLocations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          <span className="font-bold text-slate-900">{l.name}</span>
                          {l.code && <span className="ml-1 text-[10px] text-slate-400 font-mono">({l.code})</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* SKU Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select SKU / Product to Transfer</label>
                <SearchableSkuSelect
                  balances={balances}
                  selectedSkuKey={selectedSkuKey || (balances[0]?.sku || balances[0]?.id || "")}
                  onSelectSkuKey={setSelectedSkuKey}
                  placeholder="Search and select SKU / Product..."
                  unitLabel="Units Available"
                  accentColor="indigo"
                />
              </div>

              {/* Quantity Input */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Transfer Quantity</span>
                  <span className="text-slate-400">Max Available: {maxAvailable} Units</span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={maxAvailable}
                  value={transferQty}
                  onChange={(e) => setTransferQty(Math.max(1, Math.min(maxAvailable, parseInt(e.target.value) || 1)))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-black text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={maxAvailable === 0}
                  onClick={handleExecuteTransfer}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-black text-white hover:bg-indigo-700 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <span>Execute Transfer</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

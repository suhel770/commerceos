"use client";

import React, { useState } from "react";
import { X, Search, ChevronDown, Check, AlertCircle, Package, Box, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inventoryConsumptionLedger, type InventoryType, type UsageType } from "@/lib/inventory/consumption-ledger";
import { notificationEngine } from "@/lib/core/notification-engine";

export interface RecordUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  skuMetricsList: Array<{
    sku: string;
    productName: string;
    availableQty: number;
  }>;
  initialSku?: string;
  onSuccess?: () => void;
}

export default function RecordUsageModal({
  isOpen,
  onClose,
  skuMetricsList,
  initialSku,
  onSuccess,
}: RecordUsageModalProps) {
  const [selectedSku, setSelectedSku] = useState(initialSku || skuMetricsList[0]?.sku || "");
  const [skuSearchQuery, setSkuSearchQuery] = useState("");
  const [isSkuDropdownOpen, setIsSkuDropdownOpen] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [usageType, setUsageType] = useState<UsageType>("MANUAL_CONSUMPTION");
  const [reason, setReason] = useState("Internal Operations");
  const [customReason, setCustomReason] = useState("");
  const [relatedProductSku, setRelatedProductSku] = useState("");
  const [relatedOrderId, setRelatedOrderId] = useState("");
  const [reference, setReference] = useState("");
  const [locationName, setLocationName] = useState("Main Facility");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentMetric = skuMetricsList.find(
    (m) => m.sku.toLowerCase().trim() === selectedSku.toLowerCase().trim()
  );
  const availableQty = currentMetric?.availableQty ?? 0;
  const isConsumable = inventoryConsumptionLedger.detectInventoryType(
    selectedSku,
    currentMetric?.productName || ""
  ) === "CONSUMABLE";

  const handleSelectSku = (sku: string) => {
    setSelectedSku(sku);
    setIsSkuDropdownOpen(false);
    setError(null);
    const metric = skuMetricsList.find((m) => m.sku.toLowerCase().trim() === sku.toLowerCase().trim());
    const isCons = inventoryConsumptionLedger.detectInventoryType(sku, metric?.productName || "") === "CONSUMABLE";
    if (isCons) {
      setUsageType("PACKAGING");
      setReason("Order Packaging");
    } else {
      setUsageType("MANUAL_CONSUMPTION");
      setReason("Internal Operations");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      setError("Please enter a valid positive integer quantity.");
      setIsSubmitting(false);
      return;
    }

    if (qty > availableQty) {
      setError(
        `Insufficient available stock for ${selectedSku}. Only ${availableQty} units available on hand. Cannot consume ${qty} units.`
      );
      setIsSubmitting(false);
      return;
    }

    if (reason === "Other" && !customReason.trim()) {
      setError("Please provide specific reason details for 'Other'.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/v1/inventory/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: selectedSku,
          productName: currentMetric?.productName || selectedSku,
          inventoryType: isConsumable ? "CONSUMABLE" : "SELLABLE",
          quantity: qty,
          usageType,
          reason: reason === "Other" ? customReason.trim() : reason,
          customReason: customReason.trim() || undefined,
          relatedProductSku: isConsumable ? relatedProductSku.trim() || undefined : undefined,
          relatedOrderId: relatedOrderId.trim() || undefined,
          reference: reference.trim() || (relatedOrderId ? `Order #${relatedOrderId.trim()}` : "Internal Usage"),
          sourceLocationName: locationName,
          notes: notes.trim() || undefined,
          actorName: "Warehouse Operator",
        }),
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || "Failed to record consumption.");
      }

      notificationEngine.send({
        recipientId: "usr-amir-patel",
        channels: ["in_app"],
        priority: "medium",
        title: `Inventory Consumed: ${selectedSku}`,
        body: `${qty} units consumed for "${reason}". Remaining on hand: ${resJson.data?.remainingAvailable ?? 0}.`,
        actionUrl: "/inventory/stock",
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in cursor-pointer"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4 cursor-default relative max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                Authoritative Usage Ledger
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isConsumable ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                }`}
              >
                {isConsumable ? "Consumable / Packaging" : "Sellable SKU"}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">Record Stock Usage / Consumption</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Target SKU Dropdown */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Target Inventory SKU</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSkuDropdownOpen(!isSkuDropdownOpen)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-left flex items-center justify-between text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <div className="truncate">
                  <span className="font-mono text-slate-900">{selectedSku || "Select SKU"}</span>
                  <span className="text-xs text-slate-500 font-normal ml-2">
                    ({currentMetric?.productName || "No description"})
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
              </button>

              {isSkuDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSkuDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 mt-1 rounded-xl bg-white border border-slate-200 shadow-2xl z-50 p-2 space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search SKU or product..."
                        value={skuSearchQuery}
                        onChange={(e) => setSkuSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-0.5 [scrollbar-width:none]">
                      {skuMetricsList
                        .filter(
                          (m) =>
                            m.sku.toLowerCase().includes(skuSearchQuery.toLowerCase()) ||
                            m.productName.toLowerCase().includes(skuSearchQuery.toLowerCase())
                        )
                        .map((m) => (
                          <div
                            key={m.sku}
                            onClick={() => handleSelectSku(m.sku)}
                            className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between transition ${
                              selectedSku === m.sku
                                ? "bg-rose-50 border border-rose-200"
                                : "hover:bg-slate-50 border border-transparent"
                            }`}
                          >
                            <div className="truncate pr-2">
                              <span className="font-bold font-mono text-slate-900 text-xs block">{m.sku}</span>
                              <span className="text-[10px] text-slate-500 block truncate">{m.productName}</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                              {m.availableQty} available
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quantity to Consume */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 block">Quantity to Consume</label>
              <span className="text-[11px] font-bold text-slate-500">
                Available on hand:{" "}
                <strong className="text-emerald-700">{availableQty}</strong>
              </span>
            </div>
            <input
              type="number"
              required
              min="1"
              max={availableQty > 0 ? availableQty : 1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          {/* Usage Type & Reason */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Usage Category</label>
              <Select value={usageType} onValueChange={(val) => setUsageType(val as UsageType)}>
                <SelectTrigger className="h-11 border-slate-200 bg-slate-50 font-bold text-xs text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PACKAGING">📦 Order Packaging</SelectItem>
                  <SelectItem value="ORDER_FULFILLMENT">🚚 Customer Fulfillment</SelectItem>
                  <SelectItem value="INTERNAL_OPERATIONS">🏢 Internal Operations</SelectItem>
                  <SelectItem value="PRODUCTION">⚙ Production / Assembly</SelectItem>
                  <SelectItem value="SAMPLE">🎁 Marketing Sample</SelectItem>
                  <SelectItem value="DAMAGED_WRITEOFF">⚠ Damaged Write-off</SelectItem>
                  <SelectItem value="MANUAL_CONSUMPTION">✋ Manual Consumption</SelectItem>
                  <SelectItem value="OTHER">📝 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Specific Reason</label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="h-11 border-slate-200 bg-slate-50 font-bold text-xs text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Order Packaging">Order Packaging & Dispatch</SelectItem>
                  <SelectItem value="Customer Fulfillment">Customer Order Fulfillment</SelectItem>
                  <SelectItem value="Internal Operations">Facility & Warehouse Use</SelectItem>
                  <SelectItem value="Production">Production & Kitting</SelectItem>
                  <SelectItem value="Sample">Customer Trial / Marketing</SelectItem>
                  <SelectItem value="Damaged/Write-off">Quality Quarantine Scrap</SelectItem>
                  <SelectItem value="Other">Other (Specify below)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {reason === "Other" && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Specify Reason Details *</label>
              <input
                type="text"
                required
                placeholder="e.g. Courier damaged packaging during handling"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          )}

          {/* Consumable Context: Related Product SKU (if packaging box, tape, etc.) */}
          {isConsumable && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-amber-900 block">
                Consumable Context ("Where is this being used?")
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-amber-800 block mb-1">
                    Related Product SKU (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SKU-NOVA-SAND-PNK"
                    value={relatedProductSku}
                    onChange={(e) => setRelatedProductSku(e.target.value)}
                    className="w-full p-2 bg-white border border-amber-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-800 block mb-1">
                    Related Order ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ORD-1025"
                    value={relatedOrderId}
                    onChange={(e) => setRelatedOrderId(e.target.value)}
                    className="w-full p-2 bg-white border border-amber-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sellable Context: Related Order / Reference */}
          {!isConsumable && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Order ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ORD-1025"
                  value={relatedOrderId}
                  onChange={(e) => setRelatedOrderId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Audit Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Task #TSK-88"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>
          )}

          {/* Storage Facility */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Storage Location / Facility</label>
            <Select value={locationName} onValueChange={setLocationName}>
              <SelectTrigger className="h-11 border-slate-200 bg-slate-50 font-bold text-xs text-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Main Facility">Main Warehouse Facility (Primary)</SelectItem>
                <SelectItem value="Home Storage">Home Storage (Koramangala)</SelectItem>
                <SelectItem value="Bengaluru Central Hub">Bengaluru Central Hub</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || availableQty <= 0}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition"
          >
            {isSubmitting ? "Processing..." : "Confirm & Record Consumption"}
          </button>
        </div>
      </form>
    </div>
  );
}

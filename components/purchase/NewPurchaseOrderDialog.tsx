"use client";

import { safeResponseJson } from "@/lib/api/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Box,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Laptop,
  Megaphone,
  Package,
  Plus,
  Receipt,
  ShieldAlert,
  Trash2,
  Truck,
  X,
} from "lucide-react";

import CommerceDatePicker from "@/components/ui/CommerceDatePicker";
import CommerceSelect from "@/components/ui/CommerceSelect";
import type { BusinessProfile } from "@/lib/business-profile";
import { products } from "@/lib/mocks/products";
import {
  ALL_BUSINESS_INTENTS,
  ALL_PURCHASE_TYPES,
  BUSINESS_INTENT_LABELS,
  DEFAULT_BUYER_STATE_CODE,
  GST_RATE_SLABS,
  PAYMENT_TERMS_OPTIONS,
  PO_STATUS_LABELS,
  PURCHASE_TYPE_LABELS,
  PURCHASE_UOM_OPTIONS,
  describeGstApplication,
  getVendorCode,
  isInterstateSupply,
  lookupGstRateByHsn,
  normalizeGstRate,
  splitGst,
  stateCodeFromGstin,
  stateName,
  suggestSkuFromName,
  vendorIsGstRegistered,
  type BusinessIntent,
  type CreatePurchaseOrderInput,
  type PurchaseOrderStatus,
  type PurchaseType,
  type PurchaseUom,
  type Vendor,
} from "@/lib/purchase";

const GST_SLAB_OPTIONS = GST_RATE_SLABS.map((rate) => ({
  value: String(rate),
  label: `${rate}%`,
}));

const INTENT_OPTIONS = ALL_BUSINESS_INTENTS.map((value) => ({
  value,
  label: BUSINESS_INTENT_LABELS[value],
}));

const DEFAULT_WAREHOUSES = [
  { id: "wh-main", code: "WH-BHIWANDI", name: "Main Fulfillment Center (Bhiwandi, MH)" },
  { id: "wh-central", code: "WH-MUMBAI", name: "Central Warehouse (Mumbai, MH)" },
  { id: "wh-north", code: "WH-DELHI", name: "North Regional Hub (Delhi NCR)" },
  { id: "wh-south", code: "WH-BLR", name: "South Logistics Depot (Bengaluru, KA)" },
];

type POLineDraft = {
  key: string;
  itemName: string;
  quantity: string;
  unitPrice: string;
  uom: PurchaseUom;
  sku: string;
  hsn: string;
  gstRate: string;
  productId?: string;
  skuTouched: boolean;
  intent: BusinessIntent;
};

type NewPurchaseOrderDialogProps = {
  open: boolean;
  submitting: boolean;
  vendors: Vendor[];
  initialVendorId?: string;
  initialType?: PurchaseType;
  onClose(): void;
  onCreateVendor(): void;
  onSwitchToDirectBill?(): void;
  onCreatePO(input: CreatePurchaseOrderInput): Promise<any>;
};

function todayInput() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function emptyPOLine(): POLineDraft {
  return {
    key: `pol-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    itemName: "",
    quantity: "1",
    unitPrice: "",
    uom: "pcs",
    sku: "",
    hsn: "",
    gstRate: "18",
    skuTouched: false,
    intent: "sellable",
  };
}

export default function NewPurchaseOrderDialog({
  open,
  submitting,
  vendors,
  initialVendorId,
  initialType = "inventory_product",
  onClose,
  onCreateVendor,
  onSwitchToDirectBill,
  onCreatePO,
}: NewPurchaseOrderDialogProps) {
  const activeVendors = useMemo(
    () => vendors.filter((vendor) => vendor.status === "active"),
    [vendors],
  );

  const catalog = useMemo(
    () =>
      products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        hsn: product.hsn ?? "",
        gstRate: normalizeGstRate(
          product.gstRate ?? lookupGstRateByHsn(product.hsn) ?? 18,
        ),
        cost: product.pricing?.costPrice,
      })),
    [],
  );

  const [vendorId, setVendorId] = useState("");
  const [poDate, setPoDate] = useState(todayInput);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [deliveryWarehouseId, setDeliveryWarehouseId] = useState("wh-main");
  const [currency, setCurrency] = useState("INR");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [vendorReference, setVendorReference] = useState("");
  const [vendorContact, setVendorContact] = useState("");
  const [purchaseType, setPurchaseType] = useState<PurchaseType>(initialType);
  const [discountAmount, setDiscountAmount] = useState("0");
  const [freightAmount, setFreightAmount] = useState("0");
  const [otherCharges, setOtherCharges] = useState("0");
  const [notes, setNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState(
    "1. Goods must be delivered to the specified warehouse by the expected delivery date.\n2. All shipments must include physical packing slip referencing this PO Number.\n3. Defective items will be rejected upon warehouse QC inspection.",
  );
  const [internalNotes, setInternalNotes] = useState("");
  const [lines, setLines] = useState<POLineDraft[]>([emptyPOLine()]);
  const [activeSuggestKey, setActiveSuggestKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buyerProfile, setBuyerProfile] = useState<BusinessProfile | null>(null);
  const [workspaceRoot, setWorkspaceRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      setWorkspaceRoot(document.getElementById("commerceos-workspace-root"));
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const preferred =
        initialVendorId &&
        activeVendors.some((vendor) => vendor.id === initialVendorId)
          ? initialVendorId
          : (activeVendors[0]?.id ?? "");
      setVendorId(preferred);
      setPoDate(todayInput());
      setExpectedDeliveryDate("");
      setDeliveryWarehouseId("wh-main");
      setCurrency("INR");
      setPaymentTerms("Net 30");
      setVendorReference("");
      setVendorContact("");
      setPurchaseType(initialType);
      setLines([emptyPOLine()]);
      setDiscountAmount("0");
      setFreightAmount("0");
      setOtherCharges("0");
      setNotes("");
      setInternalNotes("");
      setError(null);
    });

    void (async () => {
      try {
        const response = await fetch("/api/v1/settings/business");
        const payload = await safeResponseJson(response);
        if (payload.success) {
          setBuyerProfile(payload.data as BusinessProfile);
        }
      } catch {
        setBuyerProfile(null);
      }
    })();
  }, [open, initialVendorId, initialType, activeVendors]);

  const buyerStateCode =
    stateCodeFromGstin(buyerProfile?.gstin) ||
    buyerProfile?.buyerStateCode ||
    DEFAULT_BUYER_STATE_CODE;

  const selectedVendor = vendors.find((vendor) => vendor.id === vendorId);
  const gstRegistered = vendorIsGstRegistered(selectedVendor?.registrationType);
  const interstate =
    gstRegistered && isInterstateSupply(selectedVendor?.gstin, buyerStateCode);

  const selectedWarehouse = DEFAULT_WAREHOUSES.find(
    (wh) => wh.id === deliveryWarehouseId,
  );

  const totals = useMemo(() => {
    const itemValue = lines.reduce((sum, line) => {
      const qty = Number(line.quantity) || 0;
      const price = Number(line.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
    const discount = Number(discountAmount) || 0;
    const freight = Number(freightAmount) || 0;
    const other = Number(otherCharges) || 0;
    const discountRatio = itemValue > 0 ? Math.min(discount / itemValue, 1) : 0;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    for (const line of lines) {
      const amount =
        (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
      const taxable = amount * (1 - discountRatio);
      const split = splitGst({
        taxable,
        gstRate: gstRegistered ? Number(line.gstRate) || 0 : 0,
        interstate,
      });
      cgst += split.cgstAmount;
      sgst += split.sgstAmount;
      igst += split.igstAmount;
    }

    const gstTotal = cgst + sgst + igst;
    const taxableValue = Math.max(itemValue - discount, 0);
    const exactTotal = taxableValue + gstTotal + freight + other;
    const roundOff = Number((Math.round(exactTotal) - exactTotal).toFixed(2));
    const grandTotal = Number((exactTotal + roundOff).toFixed(2));

    return {
      itemValue,
      discount,
      taxableValue,
      cgst,
      sgst,
      igst,
      gstTotal,
      freight,
      other,
      roundOff,
      grandTotal,
    };
  }, [
    lines,
    discountAmount,
    freightAmount,
    otherCharges,
    interstate,
    gstRegistered,
  ]);

  const autoEnsureTrailingEmptyLine = (currentLines: POLineDraft[]) => {
    if (currentLines.length === 0) return [emptyPOLine()];
    const lastLine = currentLines[currentLines.length - 1];
    if (lastLine && lastLine.itemName.trim().length > 0) {
      return [...currentLines, emptyPOLine()];
    }
    return currentLines;
  };

  const updateLine = (key: string, patch: Partial<POLineDraft>) => {
    setLines((prev) => {
      const updated = prev.map((line) => {
        if (line.key !== key) return line;
        const next = { ...line, ...patch };
        if (
          patch.itemName !== undefined &&
          !next.skuTouched &&
          patch.itemName.trim()
        ) {
          next.sku = suggestSkuFromName(patch.itemName);
        }
        if (patch.hsn !== undefined) {
          const rate = lookupGstRateByHsn(patch.hsn);
          if (rate !== undefined) {
            next.gstRate = String(normalizeGstRate(rate));
          }
        }
        if (patch.gstRate !== undefined) {
          next.gstRate = String(normalizeGstRate(Number(patch.gstRate)));
        }
        return next;
      });
      return autoEnsureTrailingEmptyLine(updated);
    });
  };

  const applyProductSuggestion = (
    key: string,
    product: (typeof catalog)[number],
  ) => {
    setLines((prev) => {
      const updated = prev.map((line) =>
        line.key === key
          ? {
              ...line,
              itemName: product.name,
              sku: product.sku,
              hsn: product.hsn,
              gstRate: String(product.gstRate),
              unitPrice:
                product.cost !== undefined
                  ? String(product.cost)
                  : line.unitPrice,
              productId: product.id,
              skuTouched: true,
            }
          : line,
      );
      return autoEnsureTrailingEmptyLine(updated);
    });
    setActiveSuggestKey(null);
  };

  const removeLine = (key: string) => {
    setLines((prev) => {
      const filtered = prev.filter((l) => l.key !== key);
      return filtered.length === 0 ? [emptyPOLine()] : filtered;
    });
  };

  const handleSavePO = async (targetStatus: PurchaseOrderStatus) => {
    setError(null);

    if (!vendorId) {
      setError("Please select a vendor for this Purchase Order.");
      return;
    }

    if (selectedVendor && selectedVendor.status !== "active") {
      setError(`Vendor ${selectedVendor.name} is ${selectedVendor.status.toUpperCase()} and cannot be used for new Purchase Orders.`);
      return;
    }

    const validLines = lines.filter(
      (l) => l.itemName.trim().length > 0 && Number(l.quantity) > 0,
    );

    if (validLines.length === 0) {
      setError("Please add at least one line item with valid description and quantity.");
      return;
    }

    const parsedLines = validLines.map((line) => ({
      description: line.itemName.trim(),
      quantity: Math.max(1, Number(line.quantity) || 1),
      unitPrice: Math.max(0, Number(line.unitPrice) || 0),
      uom: line.uom,
      sku: line.sku.trim() || undefined,
      hsn: line.hsn.trim() || undefined,
      gstRate: Number(line.gstRate) || 0,
      productId: line.productId || undefined,
      intent: line.intent,
    }));

    const input: CreatePurchaseOrderInput = {
      vendorId,
      poDate,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      deliveryWarehouseId,
      warehouseCode: selectedWarehouse?.code,
      deliveryWarehouseName: selectedWarehouse?.name,
      currency,
      paymentTerms,
      vendorReference: vendorReference.trim() || undefined,
      vendorContact: vendorContact.trim() || undefined,
      purchaseType,
      discountAmount: Number(discountAmount) || 0,
      freightAmount: Number(freightAmount) || 0,
      otherCharges: Number(otherCharges) || 0,
      notes: notes.trim() || undefined,
      termsAndConditions: termsAndConditions.trim() || undefined,
      internalNotes: internalNotes.trim() || undefined,
      status: targetStatus,
      buyerStateCode,
      lines: parsedLines,
    };

    try {
      const res = await onCreatePO(input);
      if (res) {
        onClose();
      } else {
        setError("Failed to save Purchase Order. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save Purchase Order.");
    }
  };

  if (!open || !workspaceRoot) return null;

  return createPortal(
    <div className="pointer-events-auto absolute inset-0 flex flex-col bg-white">
      {/* PO TOP HEADER */}
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-6 border-b border-slate-200 bg-white px-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold leading-none text-slate-900">
            New Purchase Order (PO)
          </h2>
          <p className="mt-1 truncate text-xs text-slate-500">
            Commercial order commitment sent to vendor BEFORE goods/invoice arrival.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="ml-auto shrink-0 rounded-lg border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </header>

      {/* PO BODY WORKSPACE */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto w-full max-w-5xl space-y-4">
          {/* DOCUMENT MODE SEGMENT SELECTOR (PO vs Direct Bill) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1.5 w-fit border border-slate-200/60">
              <button
                type="button"
                onClick={onSwitchToDirectBill}
                className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer"
              >
                <Receipt className="h-4 w-4 text-slate-500" />
                <span>Direct Purchase Bill</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-black transition-all bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200"
              >
                <Package className="h-4 w-4 text-indigo-600" />
                <span>Purchase Order (PO)</span>
              </button>
            </div>
          </div>

          {/* ERROR ALERT BANNER */}
          {error ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 shadow-sm">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* SECTION 1: PO HEADER INFORMATION */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                1. PO Header & Delivery Details
              </h3>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Draft PO State
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* PO NUMBER (READ ONLY SYSTEM GENERATED) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600">
                  PO Number
                </label>
                <input
                  type="text"
                  value="PO-2026-AUTO"
                  readOnly
                  disabled
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-bold text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400">System auto-generated on save</span>
              </div>

              {/* PO DATE */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  PO Date *
                </label>
                <div className="mt-1">
                  <CommerceDatePicker
                    value={poDate}
                    onChange={setPoDate}
                    placeholder="PO Date"
                  />
                </div>
              </div>

              {/* EXPECTED DELIVERY DATE */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Expected Delivery Date *
                </label>
                <div className="mt-1">
                  <CommerceDatePicker
                    value={expectedDeliveryDate}
                    onChange={setExpectedDeliveryDate}
                    placeholder="Expected Goods Arrival"
                  />
                </div>
                <span className="text-[10px] text-slate-500">Target warehouse receiving date</span>
              </div>

              {/* DELIVERY WAREHOUSE */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Delivery Warehouse *
                </label>
                <div className="mt-1">
                  <CommerceSelect
                    value={deliveryWarehouseId}
                    onChange={setDeliveryWarehouseId}
                    options={DEFAULT_WAREHOUSES.map((wh) => ({
                      value: wh.id,
                      label: `${wh.name} [${wh.code}]`,
                    }))}
                  />
                </div>
              </div>

              {/* VENDOR SELECTOR */}
              <div className="sm:col-span-2">
                <CommerceSelect
                  label="Vendor *"
                  value={vendorId}
                  onChange={setVendorId}
                  options={vendors.map((vendor) => ({
                    value: vendor.id,
                    label: `${vendor.name} (${getVendorCode(vendor)})${
                      vendor.status !== "active" ? ` [${vendor.status.toUpperCase()}]` : ""
                    }`,
                  }))}
                  searchable
                  placeholder="Select vendor"
                />
                {selectedVendor && selectedVendor.status !== "active" && (
                  <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 flex items-center gap-2">
                    <ShieldAlert size={16} className="text-rose-600 shrink-0" />
                    <span>Vendor is <strong>{selectedVendor.status.toUpperCase()}</strong>. PO creation disabled.</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={onCreateVendor}
                  className="mt-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  + Create new vendor
                </button>
              </div>

              {/* PAYMENT TERMS */}
              <div>
                <CommerceSelect
                  label="Payment Terms"
                  value={paymentTerms}
                  onChange={setPaymentTerms}
                  options={PAYMENT_TERMS_OPTIONS}
                />
              </div>

              {/* VENDOR QUOTATION REFERENCE */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Vendor Quotation / Ref #
                </label>
                <input
                  type="text"
                  value={vendorReference}
                  onChange={(e) => setVendorReference(e.target.value)}
                  placeholder="e.g. QUOT-2026-88"
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: LINE ITEMS */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                2. Order Line Items
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Search Master Catalog to auto-fill SKU, HSN & GST %
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                    <th className="py-2.5 px-2 min-w-[220px]">Item / Product *</th>
                    <th className="py-2.5 px-2 w-[120px]">SKU</th>
                    <th className="py-2.5 px-2 w-[90px]">HSN</th>
                    <th className="py-2.5 px-2 w-[80px]">Qty *</th>
                    <th className="py-2.5 px-2 w-[90px]">UOM</th>
                    <th className="py-2.5 px-2 w-[100px]">Rate (₹) *</th>
                    <th className="py-2.5 px-2 w-[90px]">GST %</th>
                    <th className="py-2.5 px-2 w-[110px] text-right">Line Total (₹)</th>
                    <th className="py-2.5 px-1 w-[40px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line) => {
                    const qty = Number(line.quantity) || 0;
                    const rate = Number(line.unitPrice) || 0;
                    const lineTotal = (qty * rate).toFixed(2);

                    const matchingCatalog = catalog.filter((cat) =>
                      cat.name.toLowerCase().includes(line.itemName.toLowerCase()) ||
                      cat.sku.toLowerCase().includes(line.itemName.toLowerCase()),
                    );

                    return (
                      <tr key={line.key} className="hover:bg-slate-50/60">
                        {/* ITEM NAME WITH CATALOG SUGGESTIONS */}
                        <td className="py-2 px-2 relative">
                          <input
                            type="text"
                            value={line.itemName}
                            onChange={(e) => updateLine(line.key, { itemName: e.target.value })}
                            onFocus={() => setActiveSuggestKey(line.key)}
                            placeholder="Type product name or SKU…"
                            className="h-9 w-full rounded-md border border-slate-200 px-2.5 text-xs font-medium"
                          />
                          {activeSuggestKey === line.key &&
                          line.itemName.trim().length > 0 &&
                          matchingCatalog.length > 0 ? (
                            <div className="absolute left-2 right-2 top-11 z-20 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                              {matchingCatalog.map((cat) => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => applyProductSuggestion(line.key, cat)}
                                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-indigo-50"
                                >
                                  <div>
                                    <p className="font-semibold text-slate-900">{cat.name}</p>
                                    <p className="text-[10px] text-slate-500">SKU: {cat.sku} | HSN: {cat.hsn}</p>
                                  </div>
                                  <span className="font-bold text-indigo-700">₹ {cat.cost || 0}</span>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </td>

                        {/* SKU */}
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={line.sku}
                            onChange={(e) => updateLine(line.key, { sku: e.target.value, skuTouched: true })}
                            placeholder="SKU"
                            className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs font-mono"
                          />
                        </td>

                        {/* HSN */}
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={line.hsn}
                            onChange={(e) => updateLine(line.key, { hsn: e.target.value })}
                            placeholder="HSN"
                            className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs font-mono"
                          />
                        </td>

                        {/* QUANTITY */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                            className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs font-bold text-slate-900 text-center"
                          />
                        </td>

                        {/* UOM */}
                        <td className="py-2 px-2">
                          <select
                            value={line.uom}
                            onChange={(e) => updateLine(line.key, { uom: e.target.value as PurchaseUom })}
                            className="h-9 w-full rounded-md border border-slate-200 px-1 text-xs bg-white"
                          >
                            {PURCHASE_UOM_OPTIONS.map((u) => (
                              <option key={u.value} value={u.value}>
                                {u.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* UNIT RATE */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                            placeholder="0.00"
                            className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs font-bold text-slate-900 text-right"
                          />
                        </td>

                        {/* GST % */}
                        <td className="py-2 px-2">
                          <select
                            value={line.gstRate}
                            onChange={(e) => updateLine(line.key, { gstRate: e.target.value })}
                            className="h-9 w-full rounded-md border border-slate-200 px-1 text-xs bg-white"
                          >
                            {GST_SLAB_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* LINE TOTAL */}
                        <td className="py-2 px-2 text-right font-bold text-slate-900">
                          ₹ {lineTotal}
                        </td>

                        {/* REMOVE LINE */}
                        <td className="py-2 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeLine(line.key)}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, emptyPOLine()])}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
            >
              <Plus size={15} />
              <span>Add Line Item</span>
            </button>
          </div>

          {/* SECTION 3: COMMERCIAL SUMMARY & TERMS */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* TERMS & NOTES */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                3. PO Terms & Notes
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Terms & Conditions (Printed on PO PDF)
                </label>
                <textarea
                  rows={3}
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Special Delivery Instructions (Vendor Facing)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Gate instructions, unloading conditions..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Procurement Notes (Private)
                </label>
                <input
                  type="text"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Private internal approval note..."
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs"
                />
              </div>
            </div>

            {/* COMMERCIAL SUMMARY */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
                Estimated Commercial Summary
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-slate-900">₹ {totals.itemValue.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Discount</span>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="h-7 w-28 rounded border border-slate-200 px-2 text-right text-xs font-semibold"
                  />
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Freight / Logistics</span>
                  <input
                    type="number"
                    min="0"
                    value={freightAmount}
                    onChange={(e) => setFreightAmount(e.target.value)}
                    className="h-7 w-28 rounded border border-slate-200 px-2 text-right text-xs font-semibold"
                  />
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Other Charges</span>
                  <input
                    type="number"
                    min="0"
                    value={otherCharges}
                    onChange={(e) => setOtherCharges(e.target.value)}
                    className="h-7 w-28 rounded border border-slate-200 px-2 text-right text-xs font-semibold"
                  />
                </div>

                <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-2">
                  <span>Estimated Tax ({describeGstApplication({ gstRegistered, interstate, gstRate: 18 })})</span>
                  <span className="font-semibold text-slate-900">₹ {totals.gstTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Round Off</span>
                  <span>₹ {totals.roundOff.toFixed(2)}</span>
                </div>

                <div className="flex justify-between border-t-2 border-indigo-900 pt-2 text-base font-black text-indigo-950">
                  <span>PO TOTAL</span>
                  <span>₹ {totals.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PO BOTTOM ACTIONS */}
      <footer className="sticky bottom-0 z-10 flex h-16 shrink-0 items-center justify-between border-t border-slate-200 bg-white px-6">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          Cancel
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSavePO("draft")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            Save Draft PO
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSavePO("pending_approval")}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-800 shadow-2xs hover:bg-indigo-100 disabled:opacity-50 cursor-pointer"
            title="Routes to Purchase Approvals queue for Manager / Owner approval"
          >
            Submit for Approval
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSavePO("sent_to_vendor")}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-black text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
          >
            {submitting ? "Issuing PO…" : "Create & Issue PO"}
          </button>
        </div>
      </footer>
    </div>,
    workspaceRoot,
  );
}

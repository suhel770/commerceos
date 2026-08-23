"use client";

import { safeResponseJson } from "@/lib/api/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Box,
  Calculator,
  FileText,
  Laptop,
  Megaphone,
  Package,
  Plus,
  Receipt,
  ScanLine,
  ShieldAlert,
  Trash2,
  Truck,
  Upload,
  X,
} from "lucide-react";

import { useCapabilities } from "@/providers/ExperienceProvider";
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
  PAYMENT_METHOD_LABELS,
  PURCHASE_TYPE_LABELS,
  PURCHASE_UOM_OPTIONS,
  describeGstApplication,
  getVendorCode,
  isImmediatePaidMethod,
  isInterstateSupply,
  isStockPathType,
  lookupGstRateByHsn,
  normalizeGstRate,
  resolveCreateStatus,
  resolveIntentFromPurchaseType,
  routePlaneForType,
  splitGst,
  stateCodeFromGstin,
  stateName,
  suggestSkuFromName,
  vendorIsGstRegistered,
  type BusinessIntent,
  type CreatePurchaseBillInput,
  type FreightAllocationMode,
  type PaymentMethod,
  type PurchaseBill,
  type PurchaseType,
  type PurchaseUom,
  type Vendor,
} from "@/lib/purchase";

import { hasProcurementCapability } from "@/lib/capabilities/procurement";
import PurchaseReviewModal from "./PurchaseReviewModal";

const GST_SLAB_OPTIONS = GST_RATE_SLABS.map((rate) => ({
  value: String(rate),
  label: `${rate}%`,
}));

const INTENT_OPTIONS = ALL_BUSINESS_INTENTS.map((value) => ({
  value,
  label: BUSINESS_INTENT_LABELS[value],
}));

const TYPE_ICON: Record<PurchaseType, LucideIcon> = {
  inventory_product: Package,
  packaging_material: Box,
  office_expense: FileText,
  asset: Package,
  marketing: Megaphone,
  software: Laptop,
  courier: Truck,
  rent: FileText,
  utilities: FileText,
  service: FileText,
  travel: Truck,
  professional_fees: FileText,
  other: FileText,
};

type LineDraft = {
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
  physicalStorageReceivingRequired?: boolean;
  freightMode?: FreightAllocationMode;
};

export type VendorItemHistoryRecord = {
  id: string;
  vendorId: string;
  itemName: string;
  sku?: string;
  hsn?: string;
  unitPrice: number;
  gstRate: number;
  uom: PurchaseUom;
  intent: BusinessIntent;
  productId?: string;
  lastPurchasedAt: string;
};

type NewPurchaseBillDialogProps = {
  open: boolean;
  submitting: boolean;
  vendors: Vendor[];
  initialVendorId?: string;
  initialType?: PurchaseType;
  /** When "upload", highlight bill upload and prefer file picking. */
  intent?: "create" | "upload";
  aiCreditsRemaining?: number;
  sellerTier?: "solo" | "growing" | "enterprise";
  procurementEnabled?: boolean;
  enablePoReference?: boolean;
  enableDepartment?: boolean;
  enableCostCenter?: boolean;
  onClose(): void;
  onCreateVendor(): void;
  onSwitchToPO?(): void;
  onCreate(input: CreatePurchaseBillInput): Promise<PurchaseBill | null>;
  /** Credit gate for scan / AI autofill. Return false if blocked. */
  onSpendAiCredit?(): boolean;
};

function todayInput() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function emptyLine(defaultType: PurchaseType = "inventory_product"): LineDraft {
  return {
    key: crypto.randomUUID(),
    itemName: "",
    quantity: "1",
    unitPrice: "",
    uom: "pcs",
    sku: "",
    hsn: "",
    gstRate: "18",
    skuTouched: false,
    intent: resolveIntentFromPurchaseType(defaultType),
  };
}

function resolvePurchaseTypeFromIntent(intent: BusinessIntent): PurchaseType {
  switch (intent) {
    case "sellable":
      return "inventory_product";
    case "consumable":
      return "packaging_material";
    case "asset":
      return "asset";
    case "expense":
      return "office_expense";
    case "marketing":
      return "marketing";
    case "service":
      return "service";
    case "freight":
      return "courier";
    case "other":
    default:
      return "other";
  }
}

const TYPE_HINT: Record<PurchaseType, string> = {
  inventory_product:
    "Level 1: Bill → Paid → Done. Stock enters Inventory later via receive events — never on save.",
  packaging_material:
    "Level 1: Bill → Paid → Done. Packaging stock path via events later — no forced GRN/QC.",
  office_expense:
    "Office supplies — Finance / Expense Ledger. No PO/GRN required.",
  asset: "Capital purchase — Asset Register plane when completed.",
  marketing: "Ads & campaigns — Finance / Expense Ledger.",
  software: "SaaS & tools — Finance / Expense Ledger.",
  courier: "Shipping & logistics spend — Finance / Expense Ledger.",
  rent: "Rent & premises — Finance / Expense Ledger.",
  utilities: "Power, internet, utilities — Finance / Expense Ledger.",
  service: "Services — Finance / Expense Ledger.",
  travel: "Travel & lodging — Finance / Expense Ledger.",
  professional_fees: "CA, legal, consulting — Finance / Expense Ledger.",
  other: "Catch-all outgoing spend — Finance / Expense Ledger.",
};

const ROUTE_LABEL = {
  warehouse_inventory: "Warehouse → Inventory",
  finance_expense: "Finance / Expense Ledger",
  asset_register: "Asset Register",
} as const;

const PAYMENT_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export default function NewPurchaseBillDialog({
  open,
  submitting,
  vendors,
  initialVendorId,
  initialType = "inventory_product",
  intent = "create",
  aiCreditsRemaining = 0,
  sellerTier = "growing",
  procurementEnabled = false,
  enablePoReference = false,
  enableDepartment = false,
  enableCostCenter = false,
  onClose,
  onCreateVendor,
  onSwitchToPO,
  onCreate,
  onSpendAiCredit,
}: NewPurchaseBillDialogProps) {
  const uploadSectionRef = useRef<HTMLLabelElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const [purchaseType, setPurchaseType] = useState<PurchaseType>(initialType);
  const [vendorId, setVendorId] = useState("");
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState("");
  const [billDate, setBillDate] = useState(todayInput);
  const [dueDate, setDueDate] = useState("");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [freightAmount, setFreightAmount] = useState("0");
  const [otherCharges, setOtherCharges] = useState("0");
  const [notes, setNotes] = useState("");
  const [billUploadName, setBillUploadName] = useState("");
  const [scanHint, setScanHint] = useState<string | null>(null);
  const [scanPreview, setScanPreview] = useState<{
    vendorName: string;
    vendorInvoiceNumber: string;
    billDate: string;
    itemName: string;
    quantity: string;
    unitPrice: string;
    gstRate: string;
    freightAmount: string;
    confidence: number;
  } | null>(null);
  const [docMode, setDocMode] = useState<"direct_bill" | "po">("direct_bill");
  const [status, setStatus] = useState<"draft" | "ordered">("ordered");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("unpaid");
  const [paymentRef, setPaymentRef] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine(initialType)]);
  const [vendorItemHistory, setVendorItemHistory] = useState<
    VendorItemHistoryRecord[]
  >([]);
  const [pendingReview, setPendingReview] = useState<{
    input: CreatePurchaseBillInput;
    overrideStatus?: "draft" | "ordered";
    nextAction: "close" | "new" | "upload";
  } | null>(null);
  const [existingBills, setExistingBills] = useState<PurchaseBill[]>([]);
  const [allocateFreightToLandedCost, setAllocateFreightToLandedCost] =
    useState(false);
  const [showEnterpriseFields, setShowEnterpriseFields] = useState(false);
  const [poReference, setPoReference] = useState("");
  const [department, setDepartment] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [activeSuggestKey, setActiveSuggestKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buyerProfile, setBuyerProfile] = useState<BusinessProfile | null>(
    null,
  );
  const [workspaceRoot, setWorkspaceRoot] = useState<HTMLElement | null>(null);

  const globalCaps = useCapabilities();
  const effectiveTier = globalCaps.canUseEnterpriseAI
    ? "enterprise"
    : globalCaps.canUseWarehouse
      ? "growing"
      : "solo";
  const activeSellerTier = sellerTier ?? effectiveTier;

  const showProcurementSection = useMemo(() => {
    if (activeSellerTier === "solo" || !globalCaps.canUseWarehouse)
      return false;
    if (activeSellerTier === "growing") return Boolean(procurementEnabled);
    if (activeSellerTier === "enterprise" || globalCaps.canUseDepartments) {
      return Boolean(
        procurementEnabled ||
        enablePoReference ||
        enableDepartment ||
        enableCostCenter ||
        globalCaps.canUseDepartments,
      );
    }
    return false;
  }, [
    activeSellerTier,
    globalCaps,
    procurementEnabled,
    enablePoReference,
    enableDepartment,
    enableCostCenter,
  ]);

  const AUTO_SAVE_DRAFT_KEY = "commerceos_purchase_bill_draft";
  const [recoveredDraft, setRecoveredDraft] = useState<{
    vendorId?: string;
    vendorInvoiceNumber?: string;
    billDate?: string;
    dueDate?: string;
    paymentMethod?: PaymentMethod;
    lines?: LineDraft[];
    discountAmount?: string;
    freightAmount?: string;
    otherCharges?: string;
    notes?: string;
  } | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setWorkspaceRoot(document.getElementById("commerceos-workspace-root"));
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    // Check for auto-saved local draft
    try {
      const rawDraft = localStorage.getItem(AUTO_SAVE_DRAFT_KEY);
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        if (
          parsed &&
          (parsed.vendorInvoiceNumber?.trim() ||
            (Array.isArray(parsed.lines) &&
              parsed.lines.some(
                (l: LineDraft) => l.itemName?.trim().length > 0,
              )))
        ) {
          setRecoveredDraft(parsed);
          setShowDraftBanner(true);
        }
      }
    } catch {
      // ignore JSON errors
    }

    requestAnimationFrame(() => {
      const preferred =
        initialVendorId &&
        activeVendors.some((vendor) => vendor.id === initialVendorId)
          ? initialVendorId
          : (activeVendors[0]?.id ?? "");
      setVendorId(preferred);
      setPurchaseType(initialType);
      setBillDate(todayInput());
      setLines([emptyLine(initialType)]);
      setDiscountAmount("0");
      setFreightAmount("0");
      setOtherCharges("0");
      setAllocateFreightToLandedCost(false);
      setShowEnterpriseFields(false);
      setPoReference("");
      setDepartment("");
      setCostCenter("");
      setBillUploadName("");
      setPaymentMethod("unpaid");
      setScanHint(null);
      setScanPreview(null);
      setError(null);
    });

    // Load vendor item memory from localStorage + API
    let cached: VendorItemHistoryRecord[] = [];
    try {
      const raw = localStorage.getItem("commerceos_vendor_item_memory");
      if (raw) cached = JSON.parse(raw);
    } catch {
      cached = [];
    }

    void (async () => {
      try {
        const response = await fetch("/api/v1/purchase/bills");
        const payload = await safeResponseJson(response);
        if (payload.success && Array.isArray(payload.data)) {
          const apiBills = payload.data as PurchaseBill[];
          const extracted: VendorItemHistoryRecord[] = [];
          for (const bill of apiBills) {
            for (const line of bill.lines) {
              if (!line.description) continue;
              extracted.push({
                id: `${bill.vendorId}-${line.description}`,
                vendorId: bill.vendorId,
                itemName: line.description,
                sku: line.sku,
                hsn: line.hsn,
                unitPrice: line.unitPrice,
                gstRate: line.gstRate,
                uom: line.uom ?? "pcs",
                intent: line.intent ?? "sellable",
                productId: line.productId,
                lastPurchasedAt: bill.billDate,
              });
            }
          }
          const mergedMap = new Map<string, VendorItemHistoryRecord>();
          for (const item of [...extracted, ...cached]) {
            const key = `${item.vendorId.toLowerCase()}:${item.itemName.toLowerCase()}`;
            mergedMap.set(key, item);
          }
          setVendorItemHistory(Array.from(mergedMap.values()));
        } else {
          setVendorItemHistory(cached);
        }
      } catch {
        setVendorItemHistory(cached);
      }
    })();

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

  // Debounced Auto-Save Effect (preserves form state during laptop shutdown or network drop)
  useEffect(() => {
    if (!open) return;
    const hasContent =
      vendorInvoiceNumber.trim().length > 0 ||
      lines.some(
        (l) => l.itemName.trim().length > 0 || l.unitPrice.trim().length > 0,
      );
    if (!hasContent) return;

    const timer = setTimeout(() => {
      try {
        const draftPayload = {
          vendorId,
          vendorInvoiceNumber,
          billDate,
          dueDate,
          paymentMethod,
          lines,
          discountAmount,
          freightAmount,
          otherCharges,
          notes,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(AUTO_SAVE_DRAFT_KEY, JSON.stringify(draftPayload));
      } catch {
        // quota ignore
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    open,
    vendorId,
    vendorInvoiceNumber,
    billDate,
    dueDate,
    paymentMethod,
    lines,
    discountAmount,
    freightAmount,
    otherCharges,
    notes,
  ]);

  const buyerStateCode =
    stateCodeFromGstin(buyerProfile?.gstin) ||
    buyerProfile?.buyerStateCode ||
    DEFAULT_BUYER_STATE_CODE;

  const selectedVendor = vendors.find((vendor) => vendor.id === vendorId);
  const gstRegistered = vendorIsGstRegistered(selectedVendor?.registrationType);
  const interstate =
    gstRegistered && isInterstateSupply(selectedVendor?.gstin, buyerStateCode);
  const vendorState = stateCodeFromGstin(selectedVendor?.gstin);
  const buyerStateLabel = stateName(buyerStateCode);
  const vendorStateLabel = stateName(vendorState);

  useEffect(() => {
    if (!open || !selectedVendor || dueDate) return;
    if (selectedVendor.paymentTermsDays <= 0) return;
    requestAnimationFrame(() => {
      const due = new Date(billDate);
      due.setDate(due.getDate() + selectedVendor.paymentTermsDays);
      const year = due.getFullYear();
      const month = String(due.getMonth() + 1).padStart(2, "0");
      const day = String(due.getDate()).padStart(2, "0");
      setDueDate(`${year}-${month}-${day}`);
    });
  }, [open, selectedVendor, billDate, dueDate]);

  useEffect(() => {
    if (!open || intent !== "upload") return;
    const timer = window.setTimeout(() => {
      uploadSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      fileInputRef.current?.click();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [open, intent]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (activeSuggestKey) {
          setActiveSuggestKey(null);
          return;
        }
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, activeSuggestKey, onClose]);

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

  const autoEnsureTrailingEmptyLine = (currentLines: LineDraft[]) => {
    if (currentLines.length === 0) return [emptyLine(purchaseType)];
    const lastLine = currentLines[currentLines.length - 1];
    if (lastLine && lastLine.itemName.trim().length > 0) {
      return [...currentLines, emptyLine(purchaseType)];
    }
    return currentLines;
  };

  const updateLine = (key: string, patch: Partial<LineDraft>) => {
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
              intent: "sellable" as const,
            }
          : line,
      );
      return autoEnsureTrailingEmptyLine(updated);
    });
    setActiveSuggestKey(null);
  };

  const applyVendorItemSuggestion = (
    key: string,
    item: VendorItemHistoryRecord,
  ) => {
    setLines((prev) => {
      const updated = prev.map((line) =>
        line.key === key
          ? {
              ...line,
              itemName: item.itemName,
              sku: item.sku || suggestSkuFromName(item.itemName),
              hsn: item.hsn || "",
              unitPrice: String(item.unitPrice),
              gstRate: String(item.gstRate),
              uom: item.uom,
              intent: item.intent,
              productId: item.productId,
              skuTouched: true,
            }
          : line,
      );
      return autoEnsureTrailingEmptyLine(updated);
    });
    setActiveSuggestKey(null);
  };

  const recordVendorItemsMemory = (
    savedVendorId: string,
    createdLines: CreatePurchaseBillInput["lines"],
  ) => {
    if (!savedVendorId || !createdLines.length) return;
    const newRecords: VendorItemHistoryRecord[] = createdLines.map((line) => ({
      id: `${savedVendorId}-${line.description}`,
      vendorId: savedVendorId,
      itemName: line.description,
      sku: line.sku,
      hsn: line.hsn,
      unitPrice: line.unitPrice,
      gstRate: line.gstRate ?? 18,
      uom: line.uom ?? "pcs",
      intent: line.intent ?? resolveIntentFromPurchaseType(purchaseType),
      productId: line.productId,
      lastPurchasedAt: todayInput(),
    }));

    setVendorItemHistory((prev) => {
      const mergedMap = new Map<string, VendorItemHistoryRecord>();
      for (const item of [...newRecords, ...prev]) {
        const key = `${item.vendorId.toLowerCase()}:${item.itemName.toLowerCase()}`;
        if (!mergedMap.has(key)) {
          mergedMap.set(key, item);
        }
      }
      const updatedList = Array.from(mergedMap.values());
      try {
        localStorage.setItem(
          "commerceos_vendor_item_memory",
          JSON.stringify(updatedList.slice(0, 500)),
        );
      } catch {
        // quota ignore
      }
      return updatedList;
    });
  };

  const handleScanStub = () => {
    if (!billUploadName.trim()) {
      setScanHint(
        "Add a bill file name first, then Scan will propose a review.",
      );
      setScanPreview(null);
      return;
    }
    if (onSpendAiCredit && !onSpendAiCredit()) {
      setScanHint(
        "Not enough AI credits. Add credits before using CommerceOS AI scan.",
      );
      setScanPreview(null);
      return;
    }
    setScanHint(
      "Scan complete (1 credit used) — no fields auto-filled. Enter values manually, then create the purchase.",
    );
    setScanPreview({
      vendorName: "",
      vendorInvoiceNumber: "",
      billDate: todayInput(),
      itemName: "",
      quantity: "1",
      unitPrice: "",
      gstRate: "18",
      freightAmount: "0",
      confidence: 0,
    });
  };

  const applyScanPreview = () => {
    if (!scanPreview) return;
    const match = activeVendors.find(
      (vendor) => vendor.name === scanPreview.vendorName,
    );
    if (match) setVendorId(match.id);
    setVendorInvoiceNumber(scanPreview.vendorInvoiceNumber);
    setBillDate(scanPreview.billDate);
    setFreightAmount(scanPreview.freightAmount);
    setLines([
      {
        ...emptyLine(),
        itemName: scanPreview.itemName,
        quantity: scanPreview.quantity,
        unitPrice: scanPreview.unitPrice,
        gstRate: String(normalizeGstRate(Number(scanPreview.gstRate))),
      },
    ]);
    setScanHint("Applied scan fields to the form — review and save manually.");
    setScanPreview(null);
  };

  const discardScanPreview = () => {
    setScanPreview(null);
    setScanHint("Discarded extract. Form unchanged.");
  };

  const handleCreate = async (
    overrideStatus?: "draft" | "ordered",
    nextAction: "close" | "new" | "upload" = "close",
  ) => {
    setError(null);
    if (!vendorId) {
      setError("Select or create a vendor first.");
      return;
    }

    const parsedLines = lines
      .map((line) => ({
        description: line.itemName.trim(),
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        uom: line.uom,
        sku: line.sku.trim() || undefined,
        hsn: line.hsn.trim() || undefined,
        productId: line.productId,
        gstRate: gstRegistered ? normalizeGstRate(Number(line.gstRate)) : 0,
        intent: line.intent,
        physicalStorageReceivingRequired:
          line.intent === "asset"
            ? Boolean(line.physicalStorageReceivingRequired)
            : undefined,
        freightMode: (line.intent === "freight"
          ? allocateFreightToLandedCost
            ? "landed_cost"
            : "expense"
          : undefined) as FreightAllocationMode | undefined,
      }))
      .filter((line) => line.description);

    if (!parsedLines.length) {
      setError("Add at least one item name.");
      return;
    }
    if (
      parsedLines.some((line) => !(line.quantity > 0) || line.unitPrice < 0)
    ) {
      setError("Each line needs a valid quantity and rate.");
      return;
    }

    const targetStatus = overrideStatus ?? status;
    const paidNow = isImmediatePaidMethod(paymentMethod);
    const resolvedStatus = resolveCreateStatus({
      requestedStatus: targetStatus,
      paymentMethod,
    });

    const input: CreatePurchaseBillInput = {
      vendorId,
      purchaseType,
      vendorInvoiceNumber: vendorInvoiceNumber.trim() || undefined,
      billDate,
      dueDate: dueDate || undefined,
      discountAmount: Number(discountAmount) || 0,
      freightAmount: Number(freightAmount) || 0,
      otherCharges: Number(otherCharges) || 0,
      roundOff: totals.roundOff,
      notes: notes.trim() || undefined,
      billUploadName: billUploadName.trim() || undefined,
      status: resolvedStatus,
      paymentMethod,
      paymentId: paymentRef.trim() || undefined,
      paymentStatus: paidNow ? "paid" : "unpaid",
      buyerStateCode,
      lines: parsedLines,
    };

    // Open Purchase Review Modal for downstream review & impact confirmation
    setPendingReview({ input, overrideStatus, nextAction });
  };

  const handleRestoreDraft = () => {
    if (!recoveredDraft) return;
    if (recoveredDraft.vendorId) setVendorId(recoveredDraft.vendorId);
    if (recoveredDraft.vendorInvoiceNumber)
      setVendorInvoiceNumber(recoveredDraft.vendorInvoiceNumber);
    if (recoveredDraft.billDate) setBillDate(recoveredDraft.billDate);
    if (recoveredDraft.dueDate) setDueDate(recoveredDraft.dueDate);
    if (recoveredDraft.paymentMethod)
      setPaymentMethod(recoveredDraft.paymentMethod);
    if (Array.isArray(recoveredDraft.lines) && recoveredDraft.lines.length > 0)
      setLines(recoveredDraft.lines);
    if (recoveredDraft.discountAmount)
      setDiscountAmount(recoveredDraft.discountAmount);
    if (recoveredDraft.freightAmount)
      setFreightAmount(recoveredDraft.freightAmount);
    if (recoveredDraft.otherCharges)
      setOtherCharges(recoveredDraft.otherCharges);
    if (recoveredDraft.notes) setNotes(recoveredDraft.notes);

    setShowDraftBanner(false);
  };

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(AUTO_SAVE_DRAFT_KEY);
    } catch {
      // ignore
    }
    setShowDraftBanner(false);
    setRecoveredDraft(null);
  };

  const executeFinalCreate = async () => {
    if (!pendingReview) return;
    const { input, nextAction } = pendingReview;
    setError(null);
    try {
      const bill = await onCreate(input);
      if (bill) {
        recordVendorItemsMemory(input.vendorId, input.lines);
        try {
          localStorage.removeItem(AUTO_SAVE_DRAFT_KEY);
        } catch {
          // ignore
        }
        setVendorInvoiceNumber("");
        setNotes("");
        setPaymentRef("");
        setStatus("ordered");
        setDueDate("");
        setDiscountAmount("0");
        setFreightAmount("0");
        setOtherCharges("0");
        setAllocateFreightToLandedCost(false);
        setLines([emptyLine(purchaseType)]);
        setPendingReview(null);
        setRecoveredDraft(null);
        setShowDraftBanner(false);

        // Guarantees dialog closes and returns user back to source page!
        onClose();

        if (nextAction === "upload") {
          setBillUploadName("");
          fileInputRef.current?.click();
        }
      } else {
        setError(
          "Failed to save purchase bill. Please verify invoice details.",
        );
        setPendingReview(null);
      }
    } catch (createErr: any) {
      setError(createErr?.message || "Failed to save purchase bill.");
      setPendingReview(null);
    }
  };

  if (!open || !workspaceRoot) return null;

  return createPortal(
    <div className="pointer-events-auto absolute inset-0 flex flex-col bg-white">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-6 border-b border-slate-200 bg-white px-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold leading-none text-slate-900">
            New Direct Purchase Bill
          </h2>
          <p className="mt-1 truncate text-xs text-slate-500">
            Direct purchase bill entry — automatically records vendor invoice &
            accounting impact.
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

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto w-full max-w-5xl space-y-4">
          {/* ERROR ALERT BANNER */}
          {error ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 shadow-sm">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* UNSAVED DRAFT RECOVERY BANNER */}
          {showDraftBanner && recoveredDraft ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900 shadow-sm">
              <div className="flex items-center gap-2 font-medium">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800 font-bold">
                  💾
                </span>
                <span>
                  Unsaved draft recovered from previous session (
                  {recoveredDraft.lines?.length ?? 0} item line entries). Do you
                  want to restore it?
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRestoreDraft}
                  className="rounded-lg bg-amber-600 px-3.5 py-1.5 font-bold text-white shadow-sm hover:bg-amber-700"
                >
                  Restore Draft
                </button>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-800 hover:bg-amber-100"
                >
                  Discard
                </button>
              </div>
            </div>
          ) : null}
          {/* DOCUMENT MODE SEGMENT SELECTOR (PO vs Direct Bill) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1.5 w-fit border border-slate-200/60">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-black transition-all bg-white text-violet-900 shadow-xs ring-1 ring-slate-200"
              >
                <Receipt className="h-4 w-4 text-violet-600" />
                <span>Direct Purchase Bill</span>
              </button>
              <button
                type="button"
                onClick={onSwitchToPO ?? (() => { setDocMode("po"); setStatus("ordered"); })}
                className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer"
              >
                <Package className="h-4 w-4 text-slate-500" />
                <span>Purchase Order (PO)</span>
              </button>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">
              What are you purchasing?
            </legend>
            <div className="grid gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
              {ALL_PURCHASE_TYPES.map((value) => {
                const selected = purchaseType === value;
                const Icon = TYPE_ICON[value];
                return (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition ${
                      selected
                        ? "border-violet-500 bg-violet-50 font-semibold text-violet-800 shadow-sm"
                        : "border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="purchase-type"
                      value={value}
                      checked={selected}
                      onChange={() => {
                        setPurchaseType(value);
                        const newIntent = resolveIntentFromPurchaseType(value);
                        setLines((currentLines) =>
                          currentLines.map((line) => ({
                            ...line,
                            intent: newIntent,
                          })),
                        );
                      }}
                      className="sr-only"
                    />
                    <Icon
                      size={14}
                      className={`shrink-0 ${
                        selected ? "text-violet-700" : "text-slate-500"
                      }`}
                    />
                    <span className="truncate">
                      {PURCHASE_TYPE_LABELS[value]}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {TYPE_HINT[purchaseType]} →{" "}
              <span className="font-semibold text-slate-700">
                {ROUTE_LABEL[routePlaneForType(purchaseType)]}
              </span>
            </p>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <CommerceSelect
                label="Vendor *"
                value={vendorId}
                onChange={(id) => {
                  setVendorId(id);
                  const vendor = vendors.find((v) => v.id === id);
                  if (vendor?.defaultPurchaseIntent) {
                    const newPurchaseType = resolvePurchaseTypeFromIntent(
                      vendor.defaultPurchaseIntent,
                    );
                    setPurchaseType(newPurchaseType);
                    setLines((prev) =>
                      prev.map((line) => ({
                        ...line,
                        intent: vendor.defaultPurchaseIntent as BusinessIntent,
                      })),
                    );
                  }
                }}
                options={vendors.map((vendor) => ({
                  value: vendor.id,
                  label: `${vendor.name} (${getVendorCode(vendor)})${
                    vendor.status !== "active"
                      ? ` [${vendor.status.toUpperCase()}]`
                      : ""
                  }`,
                }))}
                searchable
                placeholder="Select vendor"
              />
              {selectedVendor && selectedVendor.status !== "active" && (
                <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                    <ShieldAlert size={15} className="text-rose-600" />
                    <span>
                      Vendor is {selectedVendor.status.toUpperCase()} by Owner
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    New purchase bills cannot be created for{" "}
                    {selectedVendor.status} vendors without an approved Owner
                    exception.
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={onCreateVendor}
                className="mt-1.5 text-xs font-semibold text-violet-700 hover:text-violet-800"
              >
                + Create new vendor
              </button>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Vendor invoice / GST bill #
              </span>
              <input
                value={vendorInvoiceNumber}
                onChange={(event) => setVendorInvoiceNumber(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </label>

            <CommerceDatePicker
              label="Bill date"
              required
              value={billDate}
              onChange={setBillDate}
              placeholder="Select bill date"
            />

            <CommerceDatePicker
              label="Due date"
              value={dueDate}
              onChange={setDueDate}
              placeholder="Select due date"
            />

            <label
              ref={uploadSectionRef}
              className={`block text-sm sm:col-span-2 ${
                intent === "upload"
                  ? "rounded-xl ring-2 ring-violet-300 ring-offset-2"
                  : ""
              }`}
            >
              <span className="mb-1 block font-medium text-slate-700">
                Bill upload
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setBillUploadName(file.name);
                    setScanHint(
                      `Attached “${file.name}”. Scan to autofill, then review before save.`,
                    );
                  }}
                />
                <input
                  value={billUploadName}
                  onChange={(event) => setBillUploadName(event.target.value)}
                  placeholder="e.g. tax-invoice-july.pdf"
                  className="h-12 min-w-[220px] flex-1 rounded-xl border border-slate-200 px-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-12 items-center gap-1 rounded-xl border border-dashed border-violet-300 bg-violet-50 px-3 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                >
                  <Upload size={14} />
                  Choose file
                </button>
                <button
                  type="button"
                  onClick={handleScanStub}
                  className="inline-flex h-12 items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                >
                  <ScanLine size={14} />
                  Scan & autofill
                  <span className="rounded bg-white/80 px-1 text-[10px] font-bold">
                    {aiCreditsRemaining} cr
                  </span>
                </button>
              </div>
              {scanHint ? (
                <p className="mt-1.5 text-xs text-slate-500">{scanHint}</p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-400">
                  {intent === "upload"
                    ? "Upload a vendor bill file, then Scan & autofill or fill the form manually."
                    : "CommerceOS AI scan checks credits first. Review before Apply."}
                </p>
              )}
              {scanPreview ? (
                <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/80 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                      Review extracted fields
                    </p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                      Confidence {Math.round(scanPreview.confidence * 100)}%
                    </span>
                  </div>
                  <dl className="mt-2 grid gap-1.5 text-xs text-slate-700 sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">Vendor</dt>
                      <dd className="font-semibold">
                        {scanPreview.vendorName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Invoice #</dt>
                      <dd className="font-semibold">
                        {scanPreview.vendorInvoiceNumber}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Date</dt>
                      <dd className="font-semibold">{scanPreview.billDate}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Freight</dt>
                      <dd className="font-semibold">
                        ₹{scanPreview.freightAmount}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-slate-500">Line</dt>
                      <dd className="font-semibold">
                        {scanPreview.itemName} · Qty {scanPreview.quantity} · ₹
                        {scanPreview.unitPrice} · GST {scanPreview.gstRate}%
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={applyScanPreview}
                      className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                    >
                      Apply to form
                    </button>
                    <button
                      type="button"
                      onClick={discardScanPreview}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              ) : null}
            </label>
          </div>

          <div className="rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Line items
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {!gstRegistered
                    ? "No GST — vendor unregistered / unknown"
                    : interstate
                      ? `Tax auto: IGST · Vendor ${vendorStateLabel} → You ${buyerStateLabel}`
                      : `Tax auto: CGST + SGST · Vendor ${vendorStateLabel} → You ${buyerStateLabel}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
                className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700"
              >
                <Plus size={13} />
                Add line
              </button>
            </div>

            <div className="space-y-2 p-3">
              {lines.map((line, index) => {
                const query = line.itemName.trim().toLowerCase();

                // Vendor History Pre-fed Suggestions
                const vendorHistorySuggestions = vendorItemHistory
                  .filter((item) => {
                    const isVendorMatch =
                      !vendorId || item.vendorId === vendorId;
                    const isQueryMatch =
                      !query ||
                      item.itemName.toLowerCase().includes(query) ||
                      (item.sku && item.sku.toLowerCase().includes(query));
                    return isVendorMatch && isQueryMatch;
                  })
                  .slice(0, 8);

                // Catalog Suggestions
                const catalogSuggestions = catalog
                  .filter((product) => {
                    const isQueryMatch =
                      !query ||
                      product.name.toLowerCase().includes(query) ||
                      product.sku.toLowerCase().includes(query);
                    return isQueryMatch;
                  })
                  .slice(0, 6);

                const hasSuggestions =
                  vendorHistorySuggestions.length > 0 ||
                  catalogSuggestions.length > 0;

                const taxColumnLabel = !gstRegistered
                  ? "Tax"
                  : interstate
                    ? "IGST %"
                    : "GST %";

                return (
                  <div
                    key={line.key}
                    className={`rounded-lg p-2 transition-all ${
                      activeSuggestKey === line.key
                        ? "relative z-40 bg-violet-50/40 ring-1 ring-violet-200"
                        : "relative z-10 bg-slate-50"
                    }`}
                  >
                    <div className="grid grid-cols-[minmax(0,1.4fr)_5.5rem_6.5rem_4.25rem_4.25rem_5rem_4.5rem_7.5rem_1.75rem] items-end gap-1.5">
                      <label className="relative block min-w-0 text-[11px]">
                        {index === 0 ? (
                          <span className="mb-0.5 block font-medium text-slate-600">
                            Item name *
                          </span>
                        ) : null}
                        <input
                          value={line.itemName}
                          onChange={(event) => {
                            updateLine(line.key, {
                              itemName: event.target.value,
                              productId: undefined,
                            });
                            setActiveSuggestKey(line.key);
                          }}
                          onFocus={() => setActiveSuggestKey(line.key)}
                          onBlur={() =>
                            window.setTimeout(
                              () => setActiveSuggestKey(null),
                              150,
                            )
                          }
                          placeholder="Search catalog or vendor items…"
                          className="h-9 w-full min-w-0 rounded-md border border-slate-200 bg-white px-2 text-xs"
                        />
                        {activeSuggestKey === line.key && hasSuggestions ? (
                          <div className="absolute left-0 top-full z-50 mt-1.5 max-h-64 w-[360px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/20 ring-1 ring-black/5">
                            {vendorHistorySuggestions.length > 0 && (
                              <div className="mb-1">
                                <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50/80 rounded-md">
                                  <span>
                                    🏷️ Vendor Pre-fed Items (
                                    {selectedVendor?.name ?? "Selected Vendor"})
                                  </span>
                                  <span className="font-mono text-[9px] text-violet-600">
                                    History
                                  </span>
                                </div>
                                {vendorHistorySuggestions.map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    className="flex w-full items-center justify-between px-2.5 py-2 text-left text-xs transition hover:bg-violet-50 rounded-lg"
                                    onMouseDown={(event) => {
                                      event.preventDefault();
                                      applyVendorItemSuggestion(line.key, item);
                                    }}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <span className="font-semibold text-slate-800 block truncate">
                                        {item.itemName}
                                      </span>
                                      <span className="text-[11px] text-slate-500 truncate block">
                                        {item.sku ? `SKU ${item.sku} · ` : ""}
                                        {item.hsn ? `HSN ${item.hsn} · ` : ""}₹
                                        {item.unitPrice} · GST {item.gstRate}%
                                      </span>
                                    </div>
                                    <span className="ml-2 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                      {BUSINESS_INTENT_LABELS[item.intent] ??
                                        item.intent}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {catalogSuggestions.length > 0 && (
                              <div>
                                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 rounded-md">
                                  📦 Master Catalog Products
                                </div>
                                {catalogSuggestions.map((product) => (
                                  <button
                                    key={product.id}
                                    type="button"
                                    className="block w-full px-2.5 py-2 text-left text-xs hover:bg-slate-50 rounded-lg"
                                    onMouseDown={(event) => {
                                      event.preventDefault();
                                      applyProductSuggestion(line.key, product);
                                    }}
                                  >
                                    <span className="font-semibold text-slate-800 block truncate">
                                      {product.name}
                                    </span>
                                    <span className="text-[11px] text-slate-500 block truncate">
                                      SKU {product.sku}
                                      {product.hsn
                                        ? ` · HSN ${product.hsn}`
                                        : ""}{" "}
                                      · GST {product.gstRate}%
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </label>

                      <label className="block min-w-0 text-[11px]">
                        {index === 0 ? (
                          <span className="mb-0.5 block font-medium text-slate-600">
                            HSN
                          </span>
                        ) : null}
                        <input
                          value={line.hsn}
                          onChange={(event) =>
                            updateLine(line.key, { hsn: event.target.value })
                          }
                          placeholder="HSN"
                          className="h-9 w-full min-w-0 rounded-md border border-slate-200 bg-white px-2 text-xs"
                        />
                      </label>

                      <label className="block min-w-0 text-[11px]">
                        {index === 0 ? (
                          <span className="mb-0.5 block font-medium text-slate-600">
                            SKU
                          </span>
                        ) : null}
                        <input
                          value={line.sku}
                          onChange={(event) =>
                            updateLine(line.key, {
                              sku: event.target.value,
                              skuTouched: true,
                            })
                          }
                          placeholder="Auto"
                          className="h-9 w-full min-w-0 rounded-md border border-slate-200 bg-white px-2 text-xs font-mono"
                        />
                      </label>

                      <label className="block min-w-0 text-[11px]">
                        {index === 0 ? (
                          <span className="mb-0.5 block font-medium text-slate-600">
                            Qty
                          </span>
                        ) : null}
                        <input
                          type="number"
                          min={0}
                          value={line.quantity}
                          onChange={(event) =>
                            updateLine(line.key, {
                              quantity: event.target.value,
                            })
                          }
                          className="h-9 w-full min-w-0 rounded-md border border-slate-200 bg-white px-2 text-xs font-mono font-semibold"
                        />
                      </label>

                      <div className="min-w-0 text-[11px]">
                        {index === 0 ? (
                          <span className="mb-0.5 block font-medium text-slate-600">
                            UOM
                          </span>
                        ) : null}
                        <CommerceSelect
                          value={line.uom}
                          onChange={(next) =>
                            updateLine(line.key, {
                              uom: next as PurchaseUom,
                            })
                          }
                          options={PURCHASE_UOM_OPTIONS}
                          searchable={false}
                          size="sm"
                          placeholder="UOM"
                        />
                      </div>

                      <label className="block min-w-0 text-[11px]">
                        {index === 0 ? (
                          <span className="mb-0.5 block font-medium text-slate-600">
                            Rate (₹)
                          </span>
                        ) : null}
                        <input
                          type="number"
                          min={0}
                          value={line.unitPrice}
                          onChange={(event) =>
                            updateLine(line.key, {
                              unitPrice: event.target.value,
                            })
                          }
                          className="h-9 w-full min-w-0 rounded-md border border-slate-200 bg-white px-1.5 text-xs"
                        />
                      </label>

                      <div className="min-w-0 text-[11px]">
                        {index === 0 ? (
                          <span
                            className="mb-0.5 block truncate font-medium text-slate-600"
                            title={
                              !gstRegistered
                                ? "No GST"
                                : interstate
                                  ? "IGST %"
                                  : "CGST + SGST %"
                            }
                          >
                            {taxColumnLabel}
                          </span>
                        ) : null}
                        <CommerceSelect
                          value={
                            gstRegistered
                              ? String(normalizeGstRate(Number(line.gstRate)))
                              : "0"
                          }
                          disabled={!gstRegistered}
                          onChange={(next) =>
                            updateLine(line.key, {
                              gstRate: next,
                            })
                          }
                          options={GST_SLAB_OPTIONS}
                          searchable={false}
                          size="sm"
                          placeholder="GST"
                        />
                      </div>

                      <div className="min-w-0 text-[11px]">
                        {index === 0 ? (
                          <span className="mb-0.5 block truncate font-semibold text-violet-700">
                            Intent *
                          </span>
                        ) : null}
                        <CommerceSelect
                          value={line.intent}
                          onChange={(next) =>
                            updateLine(line.key, {
                              intent: next as BusinessIntent,
                            })
                          }
                          options={INTENT_OPTIONS}
                          searchable={false}
                          size="sm"
                          placeholder="Intent"
                        />
                        {selectedVendor &&
                          selectedVendor.allowedPurchaseIntents &&
                          selectedVendor.allowedPurchaseIntents.length > 0 &&
                          !selectedVendor.allowedPurchaseIntents.includes(
                            line.intent,
                          ) && (
                            <p className="mt-1 text-[10px] text-amber-600 font-medium leading-tight">
                              Warning: Intent not in Vendor profile.
                            </p>
                          )}
                      </div>

                      <div className="flex items-end justify-end">
                        <button
                          type="button"
                          disabled={lines.length === 1}
                          onClick={() =>
                            setLines((prev) =>
                              prev.filter((row) => row.key !== line.key),
                            )
                          }
                          className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-rose-600 disabled:opacity-30"
                          aria-label="Remove line"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {line.intent === "asset" && (
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-purple-200 bg-purple-50/70 px-3 py-1.5 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={line.physicalStorageReceivingRequired ?? false}
                            onChange={(e) =>
                              updateLine(line.key, {
                                physicalStorageReceivingRequired: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <span className="font-bold text-purple-950 text-[11px]">
                            Physical Storage Receiving Required
                          </span>
                        </label>
                        <span className="text-[11px] text-purple-700 font-medium">
                          Receive this physical asset (e.g. Rack, Shelf, Equipment) into a warehouse/storage facility with GRN putaway.
                        </span>
                      </div>
                    )}
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      {line.hsn && isStockPathType(purchaseType)
                        ? `HSN ${line.hsn} · `
                        : null}
                      {describeGstApplication({
                        gstRate: gstRegistered
                          ? normalizeGstRate(Number(line.gstRate))
                          : 0,
                        interstate,
                        gstRegistered,
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: Additional Charges & Freight Landed Cost Allocation */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Section 3: Additional Charges
            </h3>
            <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-medium text-slate-700">
                  Discount (₹)
                </span>
                <input
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(event) => setDiscountAmount(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                />
              </label>
              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-medium text-slate-700">
                  Freight / Logistics (₹)
                </span>
                <input
                  type="number"
                  min={0}
                  value={freightAmount}
                  onChange={(event) => setFreightAmount(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                />
              </label>
              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-medium text-slate-700">
                  Other charges (₹)
                </span>
                <input
                  type="number"
                  min={0}
                  value={otherCharges}
                  onChange={(event) => setOtherCharges(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                />
              </label>
            </div>

            {Number(freightAmount) > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-200/60">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allocateFreightToLandedCost}
                    onChange={(e) =>
                      setAllocateFreightToLandedCost(e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span>
                    Allocate Freight into Product Cost (Increases Landed Cost
                    for Sellable SKUs without adding inventory qty)
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* ADAPTIVE PROCUREMENT / ENTERPRISE FIELDS — SHOWN ONLY WHEN PROCUREMENT CAPABILITIES ARE ENABLED */}
          {showProcurementSection && (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                {(enablePoReference || procurementEnabled) && (
                  <label className="block">
                    <span className="mb-1 block font-medium text-slate-700">
                      PO Reference #
                    </span>
                    <input
                      value={poReference}
                      readOnly={Boolean(procurementEnabled)}
                      onChange={(e) => setPoReference(e.target.value)}
                      placeholder="Auto-populated from Purchase Order"
                      className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs font-mono"
                    />
                  </label>
                )}
                {(enableDepartment || procurementEnabled) && (
                  <label className="block">
                    <span className="mb-1 block font-medium text-slate-700">
                      Department
                    </span>
                    <input
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="h-9 w-full rounded-md border border-slate-200 px-2.5 text-xs"
                    />
                  </label>
                )}
                {(enableCostCenter || procurementEnabled) && (
                  <label className="block">
                    <span className="mb-1 block font-medium text-slate-700">
                      Cost Center
                    </span>
                    <input
                      value={costCenter}
                      onChange={(e) => setCostCenter(e.target.value)}
                      className="h-9 w-full rounded-md border border-slate-200 px-2.5 text-xs"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          <div
            className={`grid gap-3 ${paymentMethod !== "unpaid" && paymentMethod !== "credit" && paymentMethod !== "cash" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
          >
            <CommerceSelect
              label="Payment method"
              value={paymentMethod}
              onChange={(value) => setPaymentMethod(value as PaymentMethod)}
              options={PAYMENT_OPTIONS}
              searchable={false}
              placeholder="How was this paid?"
            />

            {paymentMethod !== "unpaid" &&
            paymentMethod !== "credit" &&
            paymentMethod !== "cash" ? (
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">
                  {paymentMethod === "upi"
                    ? "UPI Txn ID / Ref #"
                    : paymentMethod === "neft_rtgs" ||
                        (paymentMethod as string) === "bank_transfer"
                      ? "Bank UTR / Txn Ref #"
                      : paymentMethod === "card"
                        ? "Card Approval Code / Txn #"
                        : paymentMethod === "cheque"
                          ? "Cheque Number / Ref #"
                          : "Transaction ID / Ref #"}
                </span>
                <input
                  value={paymentRef}
                  onChange={(event) => setPaymentRef(event.target.value)}
                  placeholder={
                    paymentMethod === "upi"
                      ? "e.g. 409812938123"
                      : paymentMethod === "neft_rtgs" ||
                          (paymentMethod as string) === "bank_transfer"
                        ? "e.g. UTR-2026-9901"
                        : paymentMethod === "card"
                          ? "e.g. TXN-882103"
                          : paymentMethod === "cheque"
                            ? "e.g. CHQ-001244"
                            : "e.g. REF-99102"
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm font-mono uppercase focus:border-violet-500 focus:outline-none"
                />
              </label>
            ) : null}

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Notes
              </span>
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="PO ref, delivery note, remarks…"
                className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </label>
          </div>

          {/* LIVE PURCHASE INVOICE TOTAL & TAX BREAKDOWN CARD */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-6 text-xs">
              <div className="space-y-0.5 rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-bold uppercase">
                  Items Subtotal
                </span>
                <p className="font-mono font-bold text-sm text-slate-900">
                  ₹
                  {totals.itemValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="space-y-0.5 rounded-xl bg-amber-50/70 p-2.5 border border-amber-200">
                <span className="text-[10px] text-amber-800 block font-bold uppercase">
                  Discount
                </span>
                <p className="font-mono font-bold text-sm text-amber-700">
                  - ₹
                  {totals.discount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="space-y-0.5 rounded-xl bg-blue-50/70 p-2.5 border border-blue-200">
                <span className="text-[10px] text-blue-800 block font-bold uppercase">
                  Freight / Logistics
                </span>
                <p className="font-mono font-bold text-sm text-blue-700">
                  + ₹
                  {totals.freight.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="space-y-0.5 rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-bold uppercase">
                  Other Charges
                </span>
                <p className="font-mono font-bold text-sm text-slate-900">
                  + ₹
                  {totals.other.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="space-y-0.5 rounded-xl bg-purple-50/70 p-2.5 border border-purple-200">
                <span className="text-[10px] text-purple-800 block font-bold uppercase">
                  GST Tax ({interstate ? "IGST" : "CGST+SGST"})
                </span>
                <p className="font-mono font-bold text-sm text-purple-700">
                  + ₹
                  {totals.gstTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="space-y-0.5 rounded-xl bg-emerald-50/70 p-2.5 border border-emerald-200">
                <span className="text-[10px] text-emerald-800 block font-bold uppercase">
                  Round Off
                </span>
                <p className="font-mono font-bold text-sm text-emerald-700">
                  {totals.roundOff >= 0 ? "+ " : "- "}₹
                  {Math.abs(totals.roundOff).toFixed(2)}
                </p>
              </div>

              <div className="space-y-0.5 rounded-xl bg-violet-600 p-2.5 border border-violet-700 text-white shadow-sm">
                <span className="text-[10px] text-violet-200 block font-extrabold uppercase">
                  Grand Invoice Total
                </span>
                <p className="font-mono font-extrabold text-base text-white">
                  ₹
                  {totals.grandTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER WITH EXPLICIT SAVE ACTIONS */}
      <footer className="sticky bottom-0 shrink-0 border-t border-slate-200 bg-white px-6 py-3">
        <div className="mx-auto flex flex-wrap w-full max-w-5xl items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={submitting || activeVendors.length === 0}
              onClick={() => void handleCreate("draft", "close")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={submitting || activeVendors.length === 0}
              onClick={() => void handleCreate("ordered", "new")}
              className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50"
            >
              Record & New
            </button>
            <button
              type="button"
              disabled={submitting || activeVendors.length === 0}
              onClick={() => void handleCreate("ordered", "upload")}
              className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50"
            >
              Record & Upload Next
            </button>
            <button
              type="button"
              disabled={submitting || activeVendors.length === 0}
              onClick={() => void handleCreate("ordered", "close")}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Record Purchase"}
            </button>
          </div>
        </div>
      </footer>

      {/* PURCHASE REVIEW & DOWNSTREAM IMPACT MODAL */}
      <PurchaseReviewModal
        open={Boolean(pendingReview)}
        submitting={submitting}
        input={pendingReview?.input ?? null}
        vendor={selectedVendor}
        existingBills={existingBills}
        onConfirm={() => void executeFinalCreate()}
        onBack={() => setPendingReview(null)}
      />
    </div>,
    workspaceRoot,
  );
}

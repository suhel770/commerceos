import type {
  BusinessIntent,
  FreightAllocationMode,
  PaymentMethod,
  PurchaseBillLine,
  PurchaseRoutePlane,
  PurchaseStatus,
  PurchaseType,
} from "./types";

export type LineDestination =
  | "sellable_inventory"
  | "consumable_inventory"
  | "asset_register"
  | "storage_equipment"
  | "finance_expense"
  | "landed_cost_allocation";

/** Maps legacy PurchaseType to default BusinessIntent */
export function resolveIntentFromPurchaseType(type: PurchaseType): BusinessIntent {
  switch (type) {
    case "inventory_product":
      return "sellable";
    case "packaging_material":
      return "consumable";
    case "asset":
      return "asset";
    case "office_expense":
      return "expense";
    case "marketing":
      return "marketing";
    case "software":
    case "service":
    case "professional_fees":
      return "service";
    case "courier":
      return "freight";
    case "rent":
    case "utilities":
    case "travel":
    case "other":
    default:
      return "other";
  }
}

/** Determines downstream destination engine from line item business intent */
export function determineLineDestination(line: {
  intent: BusinessIntent;
  freightMode?: FreightAllocationMode;
  physicalStorageReceivingRequired?: boolean;
}): LineDestination {
  switch (line.intent) {
    case "sellable":
      return "sellable_inventory";
    case "consumable":
      return "consumable_inventory";
    case "asset":
      return line.physicalStorageReceivingRequired ? "storage_equipment" : "asset_register";
    case "expense":
    case "service":
    case "marketing":
    case "other":
      return "finance_expense";
    case "freight":
      return line.freightMode === "landed_cost"
        ? "landed_cost_allocation"
        : "finance_expense";
  }
}

/** Quality Check applies to physical inventory lines (sellable, consumable) and physical storage equipment */
export function canRequireQC(
  intent: BusinessIntent,
  options?: { physicalStorageReceivingRequired?: boolean },
): boolean {
  if (intent === "sellable" || intent === "consumable") return true;
  if (intent === "asset" && options?.physicalStorageReceivingRequired) return true;
  return false;
}

const INVENTORY_FLOW: PurchaseStatus[] = [
  "draft",
  "ordered",
  "received",
  "qc",
  "completed",
];

/** Level-1 default for every purchase type. */
const DIRECT_FLOW: PurchaseStatus[] = ["draft", "ordered", "completed"];

export function routePlaneForType(type: PurchaseType): PurchaseRoutePlane {
  const intent = resolveIntentFromPurchaseType(type);
  const dest = determineLineDestination({ intent });
  if (dest === "sellable_inventory" || dest === "consumable_inventory") {
    return "warehouse_inventory";
  }
  if (dest === "asset_register") {
    return "asset_register";
  }
  return "finance_expense";
}

/**
 * Level 1: draft → ordered → completed for all types.
 * Level 2+: pass advancedReceiving for stock-plane receive/QC path.
 */
export function allowedStatusesForType(
  type: PurchaseType,
  options?: { advancedReceiving?: boolean },
): PurchaseStatus[] {
  if (
    options?.advancedReceiving &&
    routePlaneForType(type) === "warehouse_inventory"
  ) {
    return [...INVENTORY_FLOW];
  }
  return [...DIRECT_FLOW];
}

/** Reserved for Phase B UI — not exposed in Level 1. */
export function inventoryAdvancedStatuses(): PurchaseStatus[] {
  return [...INVENTORY_FLOW];
}

export function canTransitionStatus(
  type: PurchaseType,
  from: PurchaseStatus,
  to: PurchaseStatus,
  options?: { advancedReceiving?: boolean },
): boolean {
  if (from === to) return false;
  if (from === "void" || from === "completed") return false;
  if (to === "void") return true;
  // Legacy seed / advanced-receiving statuses can still complete on Level 1.
  if ((from === "received" || from === "qc") && to === "completed") return true;

  const flow = allowedStatusesForType(type, options);
  const fromIndex = flow.indexOf(from);
  const toIndex = flow.indexOf(to);
  if (fromIndex < 0 || toIndex < 0) return false;
  return toIndex === fromIndex + 1;
}

export function nextStatuses(
  type: PurchaseType,
  from: PurchaseStatus,
  options?: { advancedReceiving?: boolean },
): PurchaseStatus[] {
  const optionsList: PurchaseStatus[] = [];
  for (const candidate of [
    ...allowedStatusesForType(type, options),
    "void",
  ] as PurchaseStatus[]) {
    if (canTransitionStatus(type, from, candidate, options)) {
      optionsList.push(candidate);
    }
  }
  return optionsList;
}

export function isStockPathType(type: PurchaseType): boolean {
  return routePlaneForType(type) === "warehouse_inventory";
}

export function isInventoryCoupledType(type: PurchaseType): boolean {
  return (
    type === "inventory_product" ||
    type === "packaging_material" ||
    type === "asset"
  );
}

export function isExpensePathType(type: PurchaseType): boolean {
  return routePlaneForType(type) === "finance_expense";
}

export function isImmediatePaidMethod(method: PaymentMethod): boolean {
  return method !== "unpaid" && method !== "credit";
}

/** Level-1 create resolution: Bill → Paid → Done when paid now. */
export function resolveCreateStatus(input: {
  requestedStatus?: Extract<PurchaseStatus, "draft" | "ordered" | "completed">;
  paymentMethod: PaymentMethod;
}): Extract<PurchaseStatus, "draft" | "ordered" | "completed"> {
  if (input.requestedStatus === "draft") return "draft";
  if (isImmediatePaidMethod(input.paymentMethod)) return "completed";
  return input.requestedStatus === "completed" ? "completed" : "ordered";
}

export function defaultPaymentStatus(
  status: PurchaseStatus,
  paymentStatus?: "unpaid" | "partial" | "paid",
): "unpaid" | "partial" | "paid" {
  if (paymentStatus) return paymentStatus;
  if (status === "completed") return "unpaid";
  if (status === "draft") return "unpaid";
  return "unpaid";
}

export function computeBillTotal(input: {
  subtotal: number;
  discountAmount: number;
  taxPercent: number;
  freightAmount: number;
  otherCharges: number;
}): { taxAmount: number; totalAmount: number } {
  const taxable = Math.max(input.subtotal - input.discountAmount, 0);
  const taxAmount = Number(((taxable * input.taxPercent) / 100).toFixed(2));
  const totalAmount = Number(
    (
      taxable +
      taxAmount +
      input.freightAmount +
      input.otherCharges
    ).toFixed(2),
  );
  return { taxAmount, totalAmount };
}

import type { VendorRegistrationType } from "./types";

/** Buyer (workspace) default state code — Maharashtra (StrideKids demo). */
export const DEFAULT_BUYER_STATE_CODE = "27";

/**
 * Statutory GST rate slabs used on purchase lines.
 * One rate per line — system splits into CGST+SGST or IGST by tax mode.
 */
export const GST_RATE_SLABS = [0, 5, 12, 18, 28] as const;

export type GstRateSlab = (typeof GST_RATE_SLABS)[number];

export function vendorIsGstRegistered(
  registrationType?: VendorRegistrationType,
): boolean {
  return (
    registrationType === "regular" ||
    registrationType === "composition" ||
    registrationType === "tax_deductor_collector"
  );
}

/** Snap a free rate to the nearest statutory slab (exact match preferred). */
export function normalizeGstRate(rate: number | undefined | null): GstRateSlab {
  const value = Number(rate);
  if (!Number.isFinite(value) || value <= 0) return 0;
  let best: GstRateSlab = GST_RATE_SLABS[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const slab of GST_RATE_SLABS) {
    const distance = Math.abs(slab - value);
    if (distance < bestDistance) {
      best = slab;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Human-readable how a line GST % is applied under the current tax mode.
 * Finance should still use stored cgst/sgst/igst amounts, not re-parse this string.
 */
export function describeGstApplication(input: {
  gstRate: number;
  interstate: boolean;
  gstRegistered: boolean;
}): string {
  if (!input.gstRegistered || input.gstRate <= 0) {
    return "Applied: No GST";
  }
  if (input.interstate) {
    return `Applied: IGST ${input.gstRate}%`;
  }
  const half = Number((input.gstRate / 2).toFixed(2));
  return `Applied: CGST ${half}% + SGST ${half}%`;
}

export function extractPanFromGstin(gstin: string | undefined | null): string | null {
  if (!gstin) return null;
  const clean = gstin.trim().toUpperCase();
  if (clean.length >= 12) {
    const panCandidate = clean.slice(2, 12);
    if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panCandidate)) {
      return panCandidate;
    }
    if (panCandidate.length === 10) {
      return panCandidate;
    }
  }
  return null;
}

export const ALL_INDIAN_STATES_AND_UTS = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Manipur" },
  { code: "14", name: "Nagaland" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory" },
] as const;

export const STATE_NAMES: Record<string, string> = Object.fromEntries(
  ALL_INDIAN_STATES_AND_UTS.map((item) => [item.code, item.name]),
);

/** Common HSN → GST rate lookup when product catalog has no match. */
const HSN_RATE_TABLE: Array<{ prefix: string; rate: number; label: string }> = [
  { prefix: "6402", rate: 12, label: "Footwear" },
  { prefix: "6109", rate: 12, label: "Apparel knit" },
  { prefix: "6203", rate: 12, label: "Apparel woven" },
  { prefix: "4819", rate: 18, label: "Packaging cartons" },
  { prefix: "3923", rate: 18, label: "Plastic packaging" },
  { prefix: "8471", rate: 18, label: "Computers / IT" },
  { prefix: "9403", rate: 18, label: "Furniture" },
  { prefix: "9965", rate: 18, label: "Courier / logistics" },
  { prefix: "9973", rate: 18, label: "Software / SaaS" },
  { prefix: "0044", rate: 18, label: "Services (generic)" },
];

export function stateCodeFromGstin(gstin?: string): string | undefined {
  const code = gstin?.trim().slice(0, 2);
  if (code && /^\d{2}$/.test(code)) return code;
  return undefined;
}

export function stateNameFromGstin(gstin?: string): string | undefined {
  const code = stateCodeFromGstin(gstin);
  if (!code) return undefined;
  return STATE_NAMES[code];
}

export function stateName(code?: string): string {
  if (!code) return "Unknown";
  return STATE_NAMES[code] ?? `State ${code}`;
}

export function isInterstateSupply(
  vendorGstin: string | undefined,
  buyerStateCode = DEFAULT_BUYER_STATE_CODE,
): boolean {
  const vendorState = stateCodeFromGstin(vendorGstin);
  if (!vendorState) return false;
  return vendorState !== buyerStateCode;
}

export function lookupGstRateByHsn(hsn?: string): number | undefined {
  const value = hsn?.trim();
  if (!value) return undefined;
  const match = HSN_RATE_TABLE.find((row) => value.startsWith(row.prefix));
  return match?.rate;
}

export type GstSplit = {
  gstRate: number;
  taxable: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  interstate: boolean;
};

export function splitGst(input: {
  taxable: number;
  gstRate: number;
  interstate: boolean;
}): GstSplit {
  const gstRate = Math.max(0, input.gstRate);
  const taxable = Math.max(0, input.taxable);
  const taxAmount = Number(((taxable * gstRate) / 100).toFixed(2));

  if (input.interstate) {
    return {
      gstRate,
      taxable,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: gstRate,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: taxAmount,
      taxAmount,
      interstate: true,
    };
  }

  const half = Number((gstRate / 2).toFixed(2));
  const cgstAmount = Number((taxAmount / 2).toFixed(2));
  const sgstAmount = Number((taxAmount - cgstAmount).toFixed(2));
  return {
    gstRate,
    taxable,
    cgstRate: half,
    sgstRate: half,
    igstRate: 0,
    cgstAmount,
    sgstAmount,
    igstAmount: 0,
    taxAmount,
    interstate: false,
  };
}

export function suggestSkuFromName(name: string): string {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 18);
  const suffix = crypto.randomUUID().slice(0, 4).toUpperCase();
  return slug ? `${slug}-${suffix}` : `SKU-${suffix}`;
}

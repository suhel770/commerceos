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

const SKU_STOP_WORDS = new Set([
  "AND",
  "THE",
  "FOR",
  "WITH",
  "IN",
  "OF",
  "TO",
  "A",
  "AN",
  "BY",
  "AT",
  "ON",
  "FROM",
  "SET",
  "PACK",
  "PK",
  "PCS",
  "PC",
  "NO",
  "NOS",
  "ITEM",
  "ITEMS",
]);

const COMMON_SKU_WORDS: Record<string, string> = {
  BLACK: "BLK",
  WHITE: "WHT",
  SHIRT: "SHT",
  SHOES: "SHO",
  SHOE: "SHO",
  COTTON: "COT",
  CORRUGATED: "CRG",
  BUBBLE: "BUB",
  PAPER: "PAP",
  BOTTLE: "BTL",
  PLASTIC: "PLS",
  LEATHER: "LTH",
  YELLOW: "YLW",
  ORANGE: "ORG",
  PURPLE: "PRP",
  SILVER: "SLV",
  GOLDEN: "GLD",
  TAPE: "TAP",
  ROLL: "ROL",
  ROUND: "RND",
  SLEEVE: "SLV",
  COLLAR: "CLR",
  OFFICE: "OFF",
  CHAIR: "CHR",
  BOX: "BOX",
  PEN: "PEN",
  BALL: "BAL",
  RECEIPT: "RCP",
  THERMAL: "THR",
  WRAP: "WRP",
  RUNNING: "RUN",
  COPIER: "CPR",
  COFFEE: "COF",
  MUG: "MUG",
  CASE: "CAS",
  WALLET: "WLT",
  CERAMIC: "CRM",
};

function compactSkuToken(word: string, targetLen = 3): string {
  const upper = word.toUpperCase();
  if (COMMON_SKU_WORDS[upper]) {
    return COMMON_SKU_WORDS[upper].slice(0, targetLen);
  }
  if (upper.length <= targetLen) return upper;

  const first = upper[0];
  const consonants = upper
    .slice(1)
    .replace(/[AEIOU]/g, "")
    .replace(/(.)\1+/g, "$1");
  const candidate = (first + consonants).replace(/(.)\1+/g, "$1");
  if (candidate.length >= targetLen) return candidate.slice(0, targetLen);

  return upper.slice(0, targetLen);
}

/**
 * Generates a clean, short, professional retail SKU (6-9 chars)
 * derived directly from the item name without hyphens, commas, or special symbols.
 * Example: 'Cotton T Shirt' -> 'COTTSH434', 'Corrugated Box 10x10' -> 'CRGBOX478'
 */
export function suggestSkuFromName(name: string): string {
  if (!name || !name.trim()) {
    const num = Math.floor(100 + Math.random() * 900);
    return `SKU${num}`;
  }

  const tokens = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w && !SKU_STOP_WORDS.has(w));

  if (tokens.length === 0) {
    const num = Math.floor(100 + Math.random() * 900);
    return `SKU${num}`;
  }

  let code = "";

  if (tokens.length === 1) {
    const t = tokens[0];
    if (/^\d+$/.test(t)) {
      code = `ITM${t.slice(0, 3)}`;
    } else {
      code = compactSkuToken(t, 4);
    }
  } else if (tokens.length === 2) {
    code = compactSkuToken(tokens[0], 3) + compactSkuToken(tokens[1], 3);
  } else {
    // 3 or more words:
    if (tokens[1].length === 1 && tokens[2]) {
      // e.g. Cotton T Shirt -> COT + T + SHT
      code =
        compactSkuToken(tokens[0], 3) +
        tokens[1] +
        compactSkuToken(tokens[2], 2);
    } else {
      // e.g. Running Shoes For Men -> RUN + SHO
      // e.g. Bubble Wrap Roll 50m -> BUB + WRP
      // e.g. Corrugated Box 10x10 -> CRG + BOX
      // e.g. Office Chair Ergonomic -> OFF + CHR
      code = compactSkuToken(tokens[0], 3) + compactSkuToken(tokens[1], 3);
    }
  }

  // Ensure uppercase alphanumeric characters only, max 6 letters prefix
  code = code.replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (code.length < 3) {
    code = (code + "SKU").slice(0, 3);
  }

  // 3-digit random suffix (e.g. 101 to 999)
  const num = Math.floor(100 + Math.random() * 900);
  return `${code}${num}`;
}


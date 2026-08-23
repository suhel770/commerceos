/**
 * CommerceOS Barcode Identity Resolver & Validator
 *
 * Implements strict authoritative barcode identity rules:
 * 1. Priority 1: Valid existing retail barcode (GTIN / EAN-13 / UPC / EAN-8) if present on the SKU or product model.
 * 2. Priority 2: Stable internal CommerceOS SKU code encoded via Code128.
 *
 * Anti-Corruption Rules:
 * - Never encode changing inventory values (quantities, batch status).
 * - Never encode price / MRP in the barcode symbol.
 * - Never encode product descriptions or names in the barcode symbol.
 * - Encode solely the stable authoritative SKU/Product identity.
 */

export interface BarcodeIdentityItem {
  sku?: string | null;
  barcode?: string | null;
  gtin?: string | null;
  upc?: string | null;
  ean?: string | null;
  productName?: string | null;
  id?: string | null;
}

export interface ResolvedBarcodeIdentity {
  isValid: boolean;
  value: string;
  source: "gtin_ean_upc" | "internal_sku";
  format: "CODE128" | "EAN13" | "UPC";
  displayText: string;
  error?: string;
}

/**
 * Validates whether a barcode string contains valid printable ASCII characters for Code 128 encoding.
 */
export function isValidBarcodeString(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 80) return false;
  // ASCII 32 to 126
  return /^[\x20-\x7E]+$/.test(trimmed);
}

/**
 * Checks if a string looks like a standard GTIN/EAN/UPC barcode (8, 12, 13, or 14 digits).
 */
export function isRetailNumericBarcode(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return /^\d{8}$|^\d{12,14}$/.test(trimmed);
}

/**
 * Resolves the authoritative barcode identity for a product or SKU item.
 */
export function resolveBarcodeIdentity(
  item: BarcodeIdentityItem | null | undefined
): ResolvedBarcodeIdentity {
  if (!item) {
    return {
      isValid: false,
      value: "",
      source: "internal_sku",
      format: "CODE128",
      displayText: "",
      error: "Barcode cannot be generated because this SKU has no valid barcode identity.",
    };
  }

  // 1. Check for valid existing external GTIN/EAN/UPC barcode
  const externalCandidate =
    (typeof item.barcode === "string" && item.barcode.trim()) ||
    (typeof item.gtin === "string" && item.gtin.trim()) ||
    (typeof item.ean === "string" && item.ean.trim()) ||
    (typeof item.upc === "string" && item.upc.trim());

  if (externalCandidate && isValidBarcodeString(externalCandidate)) {
    return {
      isValid: true,
      value: externalCandidate,
      source: "gtin_ean_upc",
      format: "CODE128",
      displayText: externalCandidate,
    };
  }

  // 2. Fallback to stable internal SKU identifier
  const skuCandidate =
    (typeof item.sku === "string" && item.sku.trim()) ||
    (typeof item.id === "string" && item.id.trim());

  if (skuCandidate && isValidBarcodeString(skuCandidate)) {
    return {
      isValid: true,
      value: skuCandidate,
      source: "internal_sku",
      format: "CODE128",
      displayText: skuCandidate,
    };
  }

  return {
    isValid: false,
    value: "",
    source: "internal_sku",
    format: "CODE128",
    displayText: "",
    error: "Barcode cannot be generated because this SKU has no valid barcode identity.",
  };
}

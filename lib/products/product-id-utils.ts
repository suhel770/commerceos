/**
 * Pure client-safe utilities for CommerceOS Universal Product IDs.
 * No Node.js / database / pg dependencies so this can be imported in Client Components.
 */

/**
 * Universal Product ID format:
 * - Sellable Products: PRD-000101, PRD-000102, ...
 * - Consumable Packaging: PRD-000201, PRD-000202, ...
 */
export function formatUniversalProductId(
  typeOrNum: "SELLABLE" | "CONSUMABLE" | string | number,
  index?: number,
): string {
  if (typeof typeOrNum === "number") {
    return `PRD-${String(typeOrNum).padStart(6, "0")}`;
  }

  if (typeof typeOrNum === "string" && isValidUniversalProductId(typeOrNum)) {
    return typeOrNum.toUpperCase().trim();
  }

  const typeStr = String(typeOrNum).toUpperCase();
  const baseOffset = typeStr === "CONSUMABLE" ? 200 : 100;
  const num = baseOffset + (index ?? 1);
  return `PRD-${String(num).padStart(6, "0")}`;
}

/**
 * Checks if a string is formatted as a valid CommerceOS Universal Product ID (e.g. "PRD-000124").
 */
export function isValidUniversalProductId(val?: string | null): boolean {
  if (!val || typeof val !== "string") return false;
  return /^PRD-\d{6}$/i.test(val.trim());
}

const KNOWN_PRD_BY_KEY: Record<string, string> = {
  "sku-nova-sand-pnk": "PRD-000101",
  "sku-nova-shoe-blk": "PRD-000102",
  "sku-surat-sock-03": "PRD-000103",
  "sku-surat-tshirt-kid": "PRD-000104",
  "line-24e3f3b4-2": "PRD-000105",
  "line-b05db482-1": "PRD-000106",
  "sku-box-s": "PRD-000201",
  "sku-box-m": "PRD-000202",
  "sku-box-l": "PRD-000203",
  "sku-poly-m": "PRD-000204",
  "sku-sticker-qc": "PRD-000205",
  "sku-tape-brown": "PRD-000206",
  "sku-bubble-wrap": "PRD-000207",
};

/**
 * Deterministically resolves Universal Product ID from product or line metadata.
 */
export function getUniversalProductId(item?: {
  productId?: string | null;
  sku?: string | null;
  name?: string | null;
  description?: string | null;
  id?: string | null;
} | null): string {
  if (!item) return "";
  if (item.productId && isValidUniversalProductId(item.productId)) {
    return item.productId;
  }
  if (item.sku) {
    const found = KNOWN_PRD_BY_KEY[item.sku.toLowerCase().trim()];
    if (found) return found;
  }
  const text = (item.name || item.description || "").toLowerCase().trim();
  if (text) {
    for (const [key, prd] of Object.entries(KNOWN_PRD_BY_KEY)) {
      if (text.includes(key.replace("sku-", "").replace("line-", ""))) {
        return prd;
      }
    }
  }
  return "";
}

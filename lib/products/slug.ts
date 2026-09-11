/**
 * Converts a product name into a clean, human-readable URL slug.
 * Example: "Kids Sports Shoe - Black" -> "kids-sports-shoe-black"
 */
export function slugifyProductName(name?: string | null): string {
  if (!name || typeof name !== "string") return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Checks if a string is a standard UUID.
 */
export function isUuid(value?: string | null): boolean {
  if (!value || typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
}

/**
 * Authoritatively determines the URL slug for a product.
 * Always prefers the human-readable product name slug over raw UUIDs.
 */
export function getProductSlug(product?: {
  id?: string;
  name?: string | null;
  slug?: string | null;
  sku?: string | null;
} | null): string {
  if (!product) return "product";

  // 1. Primary: product name slug (e.g. "kids-sports-shoe-black")
  if (product.name && typeof product.name === "string" && product.name.trim().length > 0) {
    const nameSlug = slugifyProductName(product.name);
    if (nameSlug) return nameSlug;
  }

  // 2. Secondary: explicit custom slug (if not a raw UUID)
  if (product.slug && typeof product.slug === "string" && !isUuid(product.slug)) {
    const customSlug = slugifyProductName(product.slug);
    if (customSlug) return customSlug;
  }

  // 3. Tertiary: SKU slug
  if (product.sku && typeof product.sku === "string" && product.sku.trim().length > 0) {
    const skuSlug = slugifyProductName(product.sku);
    if (skuSlug) return skuSlug;
  }

  // 4. Fallback: ID
  return product.id || "product";
}

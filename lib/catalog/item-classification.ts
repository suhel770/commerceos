/**
 * Catalog presentation classification. `intent` is authoritative whenever it
 * is supplied by receiving/purchase data; text matching is only a legacy-data
 * fallback for rows created before intent was persisted on inventory records.
 */
export type CatalogItemIntent = "sellable" | "consumable" | "asset";

export function normalizeCatalogItemIntent(input?: string | null): CatalogItemIntent | undefined {
  const value = input?.trim().toLowerCase();
  if (value === "consumable" || value === "packaging" || value === "packaging_material") {
    return "consumable";
  }
  if (value === "asset") return "asset";
  if (value === "sellable" || value === "inventory_product") return "sellable";
  return undefined;
}

export function isConsumableCatalogItem(
  sku = "",
  name = "",
  intent?: string | null,
): boolean {
  const normalizedIntent = normalizeCatalogItemIntent(intent);
  if (normalizedIntent) return normalizedIntent === "consumable";

  const skuValue = sku.toLowerCase();
  const nameValue = name.toLowerCase();
  const terms = [
    "box", "poly", "tape", "sticker", "bubble", "carton", "pkg", "mailer", "wrap",
  ];
  return terms.some((term) => skuValue.includes(term) || nameValue.includes(term));
}

import type { ProductVariant } from "@/lib/types/master-listing";

export function buildVariantSku(
  masterSku: string,
  optionValues: Record<string, string>,
  index: number,
): string {
  const optionPart = Object.values(
    optionValues,
  )
    .map((value) =>
      value
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    )
    .filter(Boolean)
    .join("-");

  if (optionPart) {
    return `${masterSku}-${optionPart}`;
  }

  return `${masterSku}-V${index + 1}`;
}

export function regenerateVariantSkus(
  masterSku: string,
  variants: ProductVariant[],
): ProductVariant[] {
  return variants.map(
    (variant, index) => ({
      ...variant,
      sku: buildVariantSku(
        masterSku,
        variant.optionValues,
        index,
      ),
    }),
  );
}

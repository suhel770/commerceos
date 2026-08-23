/**
 * CommerceOS — Consumable Usage Rule Calculator Engine
 * ====================================================
 * Computes expected packaging & consumable usage proposals for orders,
 * shipments, and packing operations based on product BOM rules.
 * 
 * Supports:
 * - PER_UNIT: Quantity scaled directly with ordered units (e.g. 1 shoe box per pair)
 * - PER_ORDER: Quantity applied once per customer order (e.g. 1 thank-you card per order)
 * - PER_SHIPMENT: Quantity applied per shipment parcel (e.g. 1 outer waterproof flyer per parcel)
 * - FIXED_PER_PACK: Quantity applied per multi-pack/bundle (e.g. 1 master carton per 6-pack)
 * - Variant-level packaging overrides (e.g. XL Shoe uses XL Box instead of Standard Box)
 */

import type {
  ConsumableUsageRule,
  ExpectedConsumableProposal,
} from "./types";

export interface CalculateConsumableOptions {
  rules: ConsumableUsageRule[];
  productSku: string;
  variantSku?: string;
  orderQuantity: number;
  shipmentCount?: number;
  packCount?: number;
}

function getConsumableCategory(sku: string, name = ""): string {
  const s = `${sku} ${name}`.toLowerCase();
  if (s.includes("box") || s.includes("carton")) return "box";
  if (s.includes("poly") || s.includes("bag") || s.includes("flyer")) return "bag";
  if (s.includes("tape")) return "tape";
  if (s.includes("sticker") || s.includes("label")) return "label";
  if (s.includes("wrap")) return "wrap";
  return sku.toLowerCase().trim();
}

export function calculateExpectedConsumables(
  options: CalculateConsumableOptions
): ExpectedConsumableProposal[] {
  const {
    rules,
    productSku,
    variantSku,
    orderQuantity,
    shipmentCount = 1,
    packCount = 1,
  } = options;

  if (!orderQuantity || orderQuantity <= 0) {
    return [];
  }

  const pSkuLower = productSku.toLowerCase().trim();
  const vSkuLower = variantSku ? variantSku.toLowerCase().trim() : null;

  // 1. Filter active rules matching this product SKU
  const activeProductRules = rules.filter(
    (r) => r.active && r.productSku.toLowerCase().trim() === pSkuLower
  );

  // 2. Separate master-level rules vs variant-specific override rules
  const masterRules: ConsumableUsageRule[] = [];
  const variantRules: ConsumableUsageRule[] = [];

  for (const r of activeProductRules) {
    if (r.variantSku) {
      if (vSkuLower && r.variantSku.toLowerCase().trim() === vSkuLower) {
        variantRules.push(r);
      }
    } else {
      masterRules.push(r);
    }
  }

  // 3. Resolve effective rules: Variant rules override master rules for the same category or SKU
  const effectiveRules: Array<{ rule: ConsumableUsageRule; isVariantOverride: boolean }> = [];
  const variantCoveredCategories = new Set<string>();

  for (const vRule of variantRules) {
    const cat = getConsumableCategory(vRule.consumableSku, vRule.consumableName);
    variantCoveredCategories.add(cat);
    variantCoveredCategories.add(vRule.consumableSku.toLowerCase().trim());
    effectiveRules.push({ rule: vRule, isVariantOverride: true });
  }

  for (const mRule of masterRules) {
    const cat = getConsumableCategory(mRule.consumableSku, mRule.consumableName);
    const skuKey = mRule.consumableSku.toLowerCase().trim();
    if (!variantCoveredCategories.has(cat) && !variantCoveredCategories.has(skuKey)) {
      effectiveRules.push({ rule: mRule, isVariantOverride: false });
    }
  }

  // 4. Calculate expected quantities for each rule based on consumption mode
  const proposals: ExpectedConsumableProposal[] = [];

  for (const { rule, isVariantOverride } of effectiveRules) {
    let calculatedQty = 0;

    switch (rule.consumptionMode) {
      case "PER_UNIT":
        // Scaled by ordered item count (e.g. 5 units * 1 box = 5 boxes)
        calculatedQty = Number((orderQuantity * rule.quantity).toFixed(4));
        break;

      case "PER_ORDER":
        // Fixed once per order (e.g. 1 invoice envelope per order)
        calculatedQty = Number(rule.quantity.toFixed(4));
        break;

      case "PER_SHIPMENT":
        // Scaled by number of physical parcel shipments (e.g. 1 outer bag per shipment)
        calculatedQty = Number((Math.max(1, shipmentCount) * rule.quantity).toFixed(4));
        break;

      case "FIXED_PER_PACK":
        // Scaled by bundle pack count (e.g. 2 master cartons for 2 bundles)
        calculatedQty = Number((Math.max(1, packCount) * rule.quantity).toFixed(4));
        break;

      default:
        calculatedQty = Number((orderQuantity * rule.quantity).toFixed(4));
    }

    proposals.push({
      ruleId: rule.id,
      consumableSku: rule.consumableSku,
      consumableName: rule.consumableName,
      unit: rule.unit,
      consumptionMode: rule.consumptionMode,
      ruleQuantity: rule.quantity,
      orderQuantity,
      calculatedQuantity: calculatedQty,
      variantOverride: isVariantOverride,
      notes: rule.notes,
    });
  }

  return proposals;
}

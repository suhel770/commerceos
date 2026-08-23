import type {
  AllocationHint,
  InventoryAlert,
  InventoryInsights,
  InventoryPlanRow,
  PurchaseSuggestion,
} from "@/lib/inventory/planning/types";
import type { StockBalance } from "@/lib/inventory/types";
import { DEMO_BUSINESS } from "@/lib/demo-business/business";
import { products } from "@/lib/mocks/products";

import { warehouseLabel } from "./inventory-ops";

export type InventoryFocusTone =
  | "rose"
  | "amber"
  | "orange"
  | "violet"
  | "slate";

export type InventoryFocusNavKey =
  | "low_stock"
  | "out_of_stock"
  | "damaged"
  | "transfer"
  | "purchase"
  | "all";

export type InventoryFocusItem = {
  id: string;
  label: string;
  tone: InventoryFocusTone;
  onNavigateKey: InventoryFocusNavKey;
};

export type InventoryHealthReason = {
  id: string;
  ok: boolean;
  label: string;
};

export type InventoryHealthScore = {
  score: number;
  label: "Healthy" | "Watch" | "At risk";
  reasons: InventoryHealthReason[];
};

export type AdvisorSeverity = "ok" | "watch" | "risk" | "opportunity";

export type InventoryAdvisorInsight = {
  id: string;
  severity: AdvisorSeverity;
  entity: string;
  what: string;
  why: string;
  impact: string;
  confidence: number;
  action?: {
    kind: "purchase" | "transfer" | "adjust" | "view";
    label: string;
    productId?: string;
    hint?: AllocationHint;
  };
};

export type InventoryForecastCard = {
  id: string;
  title: string;
  value: string;
  detail: string;
  severity: AdvisorSeverity;
};

export type InventorySmartRec = {
  id: string;
  title: string;
  why: string;
  actionKind: "purchase" | "transfer" | "stop_buy" | "clearance" | "view";
  productId?: string;
  hint?: AllocationHint;
};

export type MarketplaceChannelHealth = {
  id: string;
  channel: string;
  status: "Healthy" | "Low Stock" | "Out of Stock" | "Watch";
  detail: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function buildTodaysInventory(input: {
  plans: InventoryPlanRow[];
  alerts: InventoryAlert[];
  balances: StockBalance[];
  allocationHints: AllocationHint[];
  suggestions: PurchaseSuggestion[];
}): InventoryFocusItem[] {
  const items: InventoryFocusItem[] = [];

  const oos = input.plans.filter((p) => p.health === "oos_risk").length;
  const low = input.plans.filter((p) => p.health === "low_stock").length;
  const damagedUnits = input.balances.reduce((s, r) => s + r.damaged, 0);
  const unbalanced = input.alerts.filter((a) => a.kind === "unbalanced").length;
  const drafts = input.suggestions.filter((s) => s.status === "draft").length;

  if (oos > 0) {
    items.push({
      id: "oos",
      label: `${oos} product${oos === 1 ? "" : "s"} running out of stock`,
      tone: "rose",
      onNavigateKey: "out_of_stock",
    });
  }
  if (low > 0) {
    items.push({
      id: "low",
      label: `${low} product${low === 1 ? "" : "s"} requiring reorder`,
      tone: "amber",
      onNavigateKey: "low_stock",
    });
  }
  if (input.allocationHints.length > 0) {
    items.push({
      id: "xfer",
      label: `${input.allocationHints.length} warehouse transfer suggestion${input.allocationHints.length === 1 ? "" : "s"}`,
      tone: "violet",
      onNavigateKey: "transfer",
    });
  }
  if (damagedUnits > 0) {
    items.push({
      id: "dmg",
      label: `Damaged inventory pending review (${damagedUnits.toLocaleString("en-IN")} units)`,
      tone: "orange",
      onNavigateKey: "damaged",
    });
  }
  if (unbalanced > 0) {
    items.push({
      id: "mismatch",
      label: `${unbalanced} inventory mismatch alert${unbalanced === 1 ? "" : "s"}`,
      tone: "amber",
      onNavigateKey: "all",
    });
  }
  if (drafts > 0) {
    items.push({
      id: "po",
      label: `${drafts} pending purchase suggestion${drafts === 1 ? "" : "s"}`,
      tone: "violet",
      onNavigateKey: "purchase",
    });
  }

  if (items.length === 0) {
    items.push({
      id: "clear",
      label: "No urgent inventory work — stock looks steady",
      tone: "slate",
      onNavigateKey: "all",
    });
  }

  return items.slice(0, 6);
}

export function buildInventoryHealthScore(input: {
  balances: StockBalance[];
  plans: InventoryPlanRow[];
  alerts: InventoryAlert[];
  insights: InventoryInsights | null;
}): InventoryHealthScore {
  let score = 100;
  const reasons: InventoryHealthReason[] = [];

  const negative = input.balances.some(
    (row) =>
      row.available < 0 ||
      row.reserved < 0 ||
      row.damaged < 0 ||
      row.incoming < 0,
  );
  if (negative) {
    score -= 25;
    reasons.push({
      id: "neg",
      ok: false,
      label: "Negative inventory detected",
    });
  } else {
    reasons.push({
      id: "neg",
      ok: true,
      label: "No negative inventory",
    });
  }

  const unbalanced = input.alerts.filter((a) => a.kind === "unbalanced");
  if (unbalanced.length > 0) {
    score -= 12;
    reasons.push({
      id: "wh",
      ok: false,
      label: `${unbalanced.length} warehouse mismatch alert(s)`,
    });
  } else {
    reasons.push({
      id: "wh",
      ok: true,
      label: "No warehouse mismatch",
    });
  }

  const oos = input.insights?.stockOutRiskCount ??
    input.plans.filter((p) => p.health === "oos_risk").length;
  const low =
    input.insights?.lowStockCount ??
    input.plans.filter((p) => p.health === "low_stock").length;
  const damagedPending = input.balances.filter((r) => r.damaged > 0).length;

  if (oos > 0) {
    score -= Math.min(20, oos * 4);
    reasons.push({
      id: "oos",
      ok: false,
      label: `${oos} stock-out risk product(s)`,
    });
  } else {
    reasons.push({
      id: "oos",
      ok: true,
      label: "No stock-out risk products",
    });
  }

  reasons.push({
    id: "low",
    ok: low === 0,
    label:
      low === 0
        ? "No low stock products"
        : `${low} low stock product${low === 1 ? "" : "s"}`,
  });
  if (low > 0) score -= Math.min(10, low * 2);

  reasons.push({
    id: "dmg",
    ok: damagedPending === 0,
    label:
      damagedPending === 0
        ? "No damaged inventory pending review"
        : `${damagedPending} damaged inventory pending review`,
  });
  if (damagedPending > 0) score -= Math.min(8, damagedPending * 2);

  const fill = input.insights?.fillRateProxy;
  if (typeof fill === "number") {
    const pct = Math.round(fill * 100);
    if (pct >= 90) {
      reasons.push({
        id: "sync",
        ok: true,
        label: "Stock synced across marketplaces (proxy)",
      });
    } else {
      score -= 8;
      reasons.push({
        id: "sync",
        ok: false,
        label: `Marketplace fill-rate proxy ${pct}%`,
      });
    }
  } else {
    reasons.push({
      id: "sync",
      ok: true,
      label: "Stock synced across marketplaces",
    });
  }

  score = clamp(Math.round(score), 0, 100);
  const label: InventoryHealthScore["label"] =
    score >= 85 ? "Healthy" : score >= 65 ? "Watch" : "At risk";

  return { score, label, reasons: reasons.slice(0, 6) };
}

export function buildInventoryAdvisorInsights(input: {
  plans: InventoryPlanRow[];
  allocationHints: AllocationHint[];
}): InventoryAdvisorInsight[] {
  const rows: InventoryAdvisorInsight[] = [];

  for (const plan of [...input.plans]
    .sort((a, b) => (a.daysOfCover ?? 999) - (b.daysOfCover ?? 999))
    .slice(0, 8)) {
    const cover = plan.daysOfCover;
    if (cover == null) continue;

    if (cover <= 3 || plan.health === "oos_risk") {
      rows.push({
        id: `adv-oos-${plan.productId}`,
        severity: "risk",
        entity: plan.productName,
        what: `Stockout expected in ${Math.max(0, cover)} day${cover === 1 ? "" : "s"}.`,
        why: `Available ${plan.available} vs forecast demand ${plan.forecastDemand}; reorder point ${plan.reorderPoint}.`,
        impact: "Overselling risk and marketplace suppressions if not restocked.",
        confidence: 0.82,
        action: {
          kind: "purchase",
          label: `Reorder ${plan.suggestedOrderQty || plan.minimumOrderQuantity}`,
          productId: plan.productId,
        },
      });
    } else if (cover <= 14 || plan.health === "low_stock") {
      rows.push({
        id: `adv-low-${plan.productId}`,
        severity: "watch",
        entity: plan.productName,
        what: `Stock will last ${cover} days. Reorder recommended in ${Math.max(1, cover - plan.leadTimeDays)} days.`,
        why: `Days of cover from planning engine; lead time ${plan.leadTimeDays}d.`,
        impact: "Prevents stock-out before supplier delivery.",
        confidence: 0.76,
        action: {
          kind: "purchase",
          label: "Plan purchase",
          productId: plan.productId,
        },
      });
    } else if (plan.health === "overstock" || (cover != null && cover >= 60)) {
      rows.push({
        id: `adv-over-${plan.productId}`,
        severity: "opportunity",
        entity: plan.productName,
        what: "Excess cover — pause purchasing.",
        why: `${cover} days of cover with health ${plan.health}.`,
        impact: "Frees working capital tied in slow stock.",
        confidence: 0.7,
        action: { kind: "view", label: "Review SKU", productId: plan.productId },
      });
    }
  }

  for (const hint of input.allocationHints.slice(0, 3)) {
    rows.push({
      id: `adv-xfer-${hint.productId}-${hint.fromWarehouseId}`,
      severity: "watch",
      entity: warehouseLabel(hint.toWarehouseId),
      what: `Transfer ${hint.quantity} units from ${warehouseLabel(hint.fromWarehouseId)}.`,
      why: hint.reason,
      impact: "Balances demand across warehouses without new purchase.",
      confidence: 0.74,
      action: {
        kind: "transfer",
        label: "Review transfer",
        productId: hint.productId,
        hint,
      },
    });
  }

  const seen = new Set<string>();
  return rows
    .filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    })
    .slice(0, 6);
}

export function buildInventoryForecastCards(
  plans: InventoryPlanRow[],
): InventoryForecastCard[] {
  const sorted = [...plans].sort(
    (a, b) => (a.daysOfCover ?? 999) - (b.daysOfCover ?? 999),
  );
  const under = sorted.filter(
    (p) => p.daysOfCover != null && p.daysOfCover <= 14,
  );
  const over = sorted.filter(
    (p) => p.daysOfCover != null && p.daysOfCover >= 45,
  );
  const purchaseNeed = under.reduce(
    (s, p) => s + Math.max(0, p.suggestedOrderQty),
    0,
  );
  const avgCover =
    sorted.length === 0
      ? null
      : Math.round(
          sorted.reduce((s, p) => s + (p.daysOfCover ?? 0), 0) /
            Math.max(1, sorted.filter((p) => p.daysOfCover != null).length),
        );

  return [
    {
      id: "f7",
      title: "7 Day Forecast",
      value: `${under.filter((p) => (p.daysOfCover ?? 99) <= 7).length} at risk`,
      detail: "SKUs with ≤7 days of cover",
      severity:
        under.filter((p) => (p.daysOfCover ?? 99) <= 7).length > 0
          ? "risk"
          : "ok",
    },
    {
      id: "f30",
      title: "30 Day Forecast",
      value: `${under.length} need attention`,
      detail: "SKUs with ≤14 days of cover in planning window",
      severity: under.length > 0 ? "watch" : "ok",
    },
    {
      id: "purchase",
      title: "Estimated Purchase Requirement",
      value: purchaseNeed.toLocaleString("en-IN"),
      detail: "Sum of suggested order qty for at-risk SKUs",
      severity: purchaseNeed > 0 ? "watch" : "ok",
    },
    {
      id: "stockout",
      title: "Estimated Stockout",
      value: `${sorted.filter((p) => p.health === "oos_risk").length} SKUs`,
      detail: "Classified oos_risk by health engine",
      severity:
        sorted.some((p) => p.health === "oos_risk") ? "risk" : "ok",
    },
    {
      id: "overstock",
      title: "Estimated Overstock",
      value: `${over.length} SKUs`,
      detail: "≥45 days of cover",
      severity: over.length > 0 ? "opportunity" : "ok",
    },
    {
      id: "doc",
      title: "Inventory Days of Cover",
      value: avgCover == null || Number.isNaN(avgCover) ? "—" : `${avgCover}d`,
      detail: "Average days of cover across planned SKUs",
      severity: "ok",
    },
  ];
}

export function buildDeadStockRecs(
  plans: InventoryPlanRow[],
): InventorySmartRec[] {
  return plans
    .filter((p) => p.health === "slow_moving" || p.health === "overstock")
    .slice(0, 5)
    .map((p) => ({
      id: `dead-${p.productId}`,
      title:
        p.health === "overstock"
          ? `Stop purchasing ${p.productName}`
          : `Clear dead stock — ${p.productName}`,
      why:
        p.health === "overstock"
          ? `${p.daysOfCover ?? "—"} days of cover; excess units tying capital.`
          : "Slow movement signal from planning health classifier.",
      actionKind:
        p.health === "overstock" ? ("stop_buy" as const) : ("clearance" as const),
      productId: p.productId,
    }));
}

export function buildSmartRecommendations(input: {
  plans: InventoryPlanRow[];
  allocationHints: AllocationHint[];
}): InventorySmartRec[] {
  const recs: InventorySmartRec[] = [];

  for (const plan of input.plans
    .filter((p) => p.suggestedOrderQty > 0 && p.health !== "overstock")
    .slice(0, 4)) {
    recs.push({
      id: `reo-${plan.productId}`,
      title: `Reorder ${plan.suggestedOrderQty} units — ${plan.productName}`,
      why: `Cover ${plan.daysOfCover ?? "—"}d · order by ${plan.orderByDate}`,
      actionKind: "purchase",
      productId: plan.productId,
    });
  }

  for (const hint of input.allocationHints.slice(0, 3)) {
    recs.push({
      id: `tr-${hint.productId}-${hint.toWarehouseId}`,
      title: `Transfer ${hint.quantity} units — ${hint.productName}`,
      why: `${warehouseLabel(hint.fromWarehouseId)} → ${warehouseLabel(hint.toWarehouseId)} · ${hint.reason}`,
      actionKind: "transfer",
      productId: hint.productId,
      hint,
    });
  }

  recs.push(...buildDeadStockRecs(input.plans));
  return recs.slice(0, 8);
}

/** Marketplace strip from live inventory + listings (visualization only — no duplicate stock). */
export function buildMarketplaceInventoryStrip(
  plans: InventoryPlanRow[],
  balances: StockBalance[] = [],
): MarketplaceChannelHealth[] {
  const channels = [...DEMO_BUSINESS.marketplaces];

  const availableByProduct = new Map<string, number>();
  for (const row of balances) {
    availableByProduct.set(
      row.productId,
      (availableByProduct.get(row.productId) ?? 0) + row.available,
    );
  }
  for (const plan of plans) {
    if (!availableByProduct.has(plan.productId)) {
      availableByProduct.set(plan.productId, plan.available);
    }
  }

  const planByProduct = new Map(plans.map((plan) => [plan.productId, plan]));

  const membersByChannel = new Map<string, Set<string>>();
  for (const channel of channels) {
    membersByChannel.set(normalizeMarketplace(channel), new Set());
  }

  let listedCount = 0;
  for (const product of products) {
    for (const listing of product.listings) {
      const key = normalizeMarketplace(listing.marketplace);
      const bucket = membersByChannel.get(key);
      if (!bucket) continue;
      bucket.add(product.id);
      listedCount += 1;

      const core = availableByProduct.get(product.id);
      if (core == null) {
        availableByProduct.set(product.id, Math.max(0, listing.availableStock));
      }
    }
  }

  const catalogIds = Array.from(
    new Set([
      ...plans.map((plan) => plan.productId),
      ...availableByProduct.keys(),
    ]),
  );

  // Demo catalog often has empty listings — distribute real SKUs across channels.
  if (listedCount === 0) {
    for (const productId of catalogIds) {
      const idx = stableChannelIndex(productId, channels.length);
      const channel = channels[idx]!;
      membersByChannel.get(normalizeMarketplace(channel))!.add(productId);
    }
  }

  return channels.map((channel) => {
    const members =
      membersByChannel.get(normalizeMarketplace(channel)) ?? new Set<string>();

    let outOfStock = 0;
    let lowStock = 0;
    let healthy = 0;
    let sellableUnits = 0;

    for (const productId of members) {
      const available = availableByProduct.get(productId) ?? 0;
      sellableUnits += available;
      const plan = planByProduct.get(productId);
      const status = classifyMarketplaceSku(available, plan);
      if (status === "out_of_stock") outOfStock += 1;
      else if (status === "low_stock") lowStock += 1;
      else healthy += 1;
    }

    const totalSkus = outOfStock + lowStock + healthy;
    const riskShare =
      totalSkus === 0 ? 0 : (outOfStock + lowStock) / totalSkus;

    let status: MarketplaceChannelHealth["status"] = "Healthy";
    let detail =
      totalSkus === 0
        ? "No SKUs mapped to this channel yet"
        : `${healthy.toLocaleString("en-IN")} SKUs healthy · ${sellableUnits.toLocaleString("en-IN")} sellable`;

    if (outOfStock > 0 && outOfStock >= lowStock && riskShare >= 0.2) {
      status = "Out of Stock";
      detail = `${outOfStock.toLocaleString("en-IN")} SKUs at stock-out risk`;
    } else if (
      lowStock > 0 &&
      (lowStock >= healthy * 0.15 || riskShare >= 0.12)
    ) {
      status = "Low Stock";
      detail = `${lowStock.toLocaleString("en-IN")} SKUs low on planning health`;
    } else if (outOfStock + lowStock > 0 && riskShare >= 0.08) {
      status = "Watch";
      detail = `${(outOfStock + lowStock).toLocaleString("en-IN")} SKUs need attention · ${sellableUnits.toLocaleString("en-IN")} sellable`;
    }

    return {
      id: normalizeMarketplace(channel),
      channel,
      status,
      detail,
    };
  });
}

function normalizeMarketplace(name: string) {
  return name.trim().toLowerCase();
}

function stableChannelIndex(productId: string, channelCount: number) {
  let hash = 0;
  for (let i = 0; i < productId.length; i += 1) {
    hash = (hash + productId.charCodeAt(i) * (i + 1)) % 997;
  }
  return channelCount === 0 ? 0 : hash % channelCount;
}

function classifyMarketplaceSku(
  available: number,
  plan: InventoryPlanRow | undefined,
): "out_of_stock" | "low_stock" | "healthy" {
  if (available <= 0 || plan?.health === "oos_risk") return "out_of_stock";
  if (
    plan?.health === "low_stock" ||
    (plan?.daysOfCover != null && plan.daysOfCover < 7) ||
    (available > 0 && available < 20)
  ) {
    return "low_stock";
  }
  return "healthy";
}

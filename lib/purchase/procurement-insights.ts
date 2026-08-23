import { isStockPathType } from "./routing";
import type { PurchaseStockSkuRow } from "./stock-data";
import type { PurchaseBill, VendorWithStats } from "./types";

export type InsightSeverity = "ok" | "watch" | "risk" | "opportunity";

export type InsightActionKind =
  | "new_purchase"
  | "stocks"
  | "vendors"
  | "bills"
  | "forecast";

export type ProcurementInsight = {
  id: string;
  severity: InsightSeverity;
  entity: string;
  lines: string[];
  why: string;
  action?: {
    kind: InsightActionKind;
    label: string;
    href?: string;
  };
};

export type ForecastModuleId =
  | "inventory_forecast"
  | "days_of_cover"
  | "reorder"
  | "seasonal"
  | "fast_moving"
  | "slow_moving"
  | "overstock"
  | "understock"
  | "vendor_risk"
  | "purchase_calendar";

export type ForecastModule = {
  id: ForecastModuleId;
  title: string;
  summary: string;
  items: Array<{
    id: string;
    label: string;
    detail: string;
    why: string;
    severity: InsightSeverity;
  }>;
};

export type ProcurementInsightsInput = {
  bills: PurchaseBill[];
  stockRows: PurchaseStockSkuRow[];
  vendors?: VendorWithStats[];
  /** Soft-fail inventory signal */
  reorderCount?: number;
  /** Reference date YYYY-MM-DD for seasonal heuristics */
  asOfDate?: string;
};

const MS_DAY = 86_400_000;

function parseDay(iso: string): number {
  const t = Date.parse(`${iso}T12:00:00.000Z`);
  return Number.isFinite(t) ? t : Date.now();
}

function daysBetween(a: string, b: string): number {
  return Math.max(0, Math.round((parseDay(b) - parseDay(a)) / MS_DAY));
}

function todayIso(asOf?: string): string {
  return asOf?.slice(0, 10) || new Date().toISOString().slice(0, 10);
}

function monthOf(iso: string): number {
  return Number(iso.slice(5, 7));
}

/** Rough daily burn from purchase cadence (purchased qty / span days). */
function estimateDailyBurn(
  row: PurchaseStockSkuRow,
  bills: PurchaseBill[],
): number {
  const key = row.key;
  const related = bills.filter(
    (bill) =>
      bill.status !== "void" &&
      isStockPathType(bill.purchaseType) &&
      bill.lines.some(
        (line) =>
          (line.productId?.trim() ||
            line.sku?.trim() ||
            line.description.trim().toLowerCase()) === key,
      ),
  );
  if (related.length === 0) {
    return Math.max(1, row.purchasedQty / 45);
  }
  const dates = related.map((b) => b.billDate).sort();
  const span = Math.max(
    14,
    daysBetween(dates[0]!, dates[dates.length - 1]!) || 30,
  );
  return Math.max(0.5, row.purchasedQty / span);
}

function daysOfCover(row: PurchaseStockSkuRow, bills: PurchaseBill[]): number {
  const burn = estimateDailyBurn(row, bills);
  return Math.max(0, Math.round(row.sellableQty / burn));
}

function familyName(description: string): string {
  const base = description.split("—")[0]?.split("-")[0]?.trim() || description;
  return base.length > 40 ? `${base.slice(0, 37)}…` : base;
}

function vendorUnitPrices(bills: PurchaseBill[], vendorId: string): number[] {
  const prices: number[] = [];
  for (const bill of bills) {
    if (bill.vendorId !== vendorId || bill.status === "void") continue;
    if (!isStockPathType(bill.purchaseType)) continue;
    for (const line of bill.lines) {
      if (line.unitPrice > 0) prices.push(line.unitPrice);
    }
  }
  return prices;
}

function priceChangePct(prices: number[]): number | null {
  if (prices.length < 4) return null;
  const mid = Math.floor(prices.length / 2);
  const older = prices.slice(0, mid);
  const newer = prices.slice(mid);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const o = avg(older);
  const n = avg(newer);
  if (o <= 0) return null;
  return Number((((n - o) / o) * 100).toFixed(1));
}

/**
 * Deterministic Procurement Advisor insights (recommendations only).
 * Fills demo-quality rows from StrideKids-shaped data when signals are thin.
 */
export function buildProcurementInsights(
  input: ProcurementInsightsInput,
): ProcurementInsight[] {
  const asOf = todayIso(input.asOfDate);
  const insights: ProcurementInsight[] = [];
  const stock = [...input.stockRows].sort(
    (a, b) => b.sellableQty - a.sellableQty,
  );

  for (const row of stock.slice(0, 12)) {
    const cover = daysOfCover(row, input.bills);
    const name = familyName(row.description);

    if (cover <= 7 && row.sellableQty > 0) {
      const suggest = Math.max(
        50,
        Math.ceil(estimateDailyBurn(row, input.bills) * 28),
      );
      insights.push({
        id: `under-${row.key}`,
        severity: "risk",
        entity: name,
        lines: [
          `Expected stockout in ${cover} day${cover === 1 ? "" : "s"}`,
          `Suggested purchase: ${suggest} Units`,
        ],
        why: `Sellable ${row.sellableQty} vs recent purchase burn implies ~${cover} days of cover.`,
        action: {
          kind: "new_purchase",
          label: "Plan purchase",
          href: "/purchase",
        },
      });
    } else if (cover <= 18) {
      const reorderIn = Math.max(1, cover - 6);
      insights.push({
        id: `cover-${row.key}`,
        severity: cover <= 12 ? "watch" : "ok",
        entity: name,
        lines: [
          `Current stock will last ${cover} days`,
          `Recommended reorder after ${reorderIn} days`,
        ],
        why: "Days-of-cover from purchase cadence (recommendation only).",
        action: {
          kind: "stocks",
          label: "View Inventory",
          href: "/inventory",
        },
      });
    } else if (cover >= 30) {
      insights.push({
        id: `ok-${row.key}`,
        severity: "ok",
        entity: name,
        lines: [
          `Current inventory is enough for ${cover} days`,
          "No action required.",
        ],
        why: "Healthy days-of-cover from purchase-linked sellable qty.",
      });
    }
  }

  const vendorIds = new Set(
    input.bills
      .filter((b) => b.status !== "void" && isStockPathType(b.purchaseType))
      .map((b) => b.vendorId),
  );
  for (const vendorId of vendorIds) {
    const prices = vendorUnitPrices(input.bills, vendorId);
    const pct = priceChangePct(prices);
    if (pct === null || Math.abs(pct) < 3) continue;
    const sample = input.bills.find((b) => b.vendorId === vendorId);
    const name = sample?.vendorName ?? vendorId;
    if (pct > 0) {
      insights.push({
        id: `price-${vendorId}`,
        severity: "watch",
        entity: name,
        lines: [
          `Prices increased ${pct}%`,
          name.includes("Nova")
            ? "Suggested alternative: AgraSole Traders"
            : "Review alternate vendors before next reorder",
        ],
        why: "Unit price trend across recent stock-path bills (warn only).",
        action: {
          kind: "vendors",
          label: "Compare vendors",
          href: "/purchase/vendors",
        },
      });
    }
  }

  const m = monthOf(asOf);
  const rainItem = stock.find((r) => /rain|poncho/i.test(r.description));
  if (m >= 6 && m <= 9 && rainItem) {
    insights.push({
      id: "seasonal-monsoon",
      severity: "opportunity",
      entity: familyName(rainItem.description),
      lines: [
        "Monsoon demand is increasing.",
        "Expected sales: +42%",
        "Recommended purchase: +400 Units",
      ],
      why: "Seasonal heuristic for monsoon window — recommendation only.",
      action: {
        kind: "new_purchase",
        label: "Plan purchase",
        href: "/purchase",
      },
    });
  }

  const packaging = stock.filter(
    (row) =>
      /box|bag|mailer|poly|pack/i.test(row.description) ||
      /box|bag|mailer|poly/i.test(row.sku ?? ""),
  );
  const riskPack = packaging.find(
    (row) => daysOfCover(row, input.bills) <= 10,
  );
  if (riskPack) {
    const cover = daysOfCover(riskPack, input.bills);
    const suggest = Math.max(
      500,
      Math.ceil(estimateDailyBurn(riskPack, input.bills) * 30),
    );
    insights.push({
      id: `pack-${riskPack.key}`,
      severity: "risk",
      entity: familyName(riskPack.description) || "Packaging Boxes",
      lines: [
        `Expected stockout in ${cover} days`,
        `Suggested purchase: ${suggest} Units`,
      ],
      why: "Packaging burn from purchase history; warehouse/inventory not mutated.",
      action: {
        kind: "new_purchase",
        label: "Plan packaging buy",
        href: "/purchase",
      },
    });
  } else if ((input.reorderCount ?? 0) > 0) {
    insights.push({
      id: "inv-reorder",
      severity: "watch",
      entity: "Inventory pressure",
      lines: [
        `${input.reorderCount} SKU${input.reorderCount === 1 ? "" : "s"} flagged for reorder`,
        "Review quantities before stock-out.",
      ],
      why: "Inventory insights soft-signal (optional plane).",
      action: {
        kind: "forecast",
        label: "Open AI Forecast",
        href: "/purchase/ai-forecast",
      },
    });
  }

  // If no signals or stock rows exist, return clean insights array without fake demo fallbacks

  const rank: Record<InsightSeverity, number> = {
    risk: 0,
    watch: 1,
    opportunity: 2,
    ok: 3,
  };
  const seen = new Set<string>();
  return insights
    .filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    })
    .sort((a, b) => rank[a.severity] - rank[b.severity])
    .slice(0, 8);
}

export function buildProcurementForecast(
  input: ProcurementInsightsInput,
): ForecastModule[] {
  const asOf = todayIso(input.asOfDate);
  const stock = [...input.stockRows];
  const withCover = stock
    .map((row) => ({
      row,
      cover: daysOfCover(row, input.bills),
      burn: estimateDailyBurn(row, input.bills),
    }))
    .sort((a, b) => a.cover - b.cover);

  const inventoryForecast: ForecastModule = {
    id: "inventory_forecast",
    title: "Inventory Forecast",
    summary: "Purchase-linked cover outlook for stock-path SKUs.",
    items: withCover.slice(0, 6).map(({ row, cover }) => ({
      id: `if-${row.key}`,
      label: familyName(row.description),
      detail: `~${cover} days of cover · sellable ${row.sellableQty}`,
      why: "Burn rate from purchase cadence; not Inventory engine on-hand.",
      severity: cover <= 7 ? "risk" : cover <= 18 ? "watch" : "ok",
    })),
  };

  const daysOfCoverMod: ForecastModule = {
    id: "days_of_cover",
    title: "Days of Cover",
    summary: "Sellable qty ÷ estimated daily burn.",
    items: withCover.slice(0, 8).map(({ row, cover }) => ({
      id: `doc-${row.key}`,
      label: familyName(row.description),
      detail: `${cover} days`,
      why: `Purchased ${row.purchasedQty}, damaged ${row.damagedQty}, sellable ${row.sellableQty}.`,
      severity: cover <= 7 ? "risk" : cover <= 14 ? "watch" : "ok",
    })),
  };

  const reorder: ForecastModule = {
    id: "reorder",
    title: "Reorder Suggestions",
    summary: "SKUs approaching stockout — plan purchases manually.",
    items: withCover
      .filter((x) => x.cover <= 18)
      .slice(0, 6)
      .map(({ row, cover, burn }) => {
        const qty = Math.max(50, Math.ceil(burn * 28));
        return {
          id: `ro-${row.key}`,
          label: familyName(row.description),
          detail: `Reorder ~${qty} units (cover ${cover}d)`,
          why: "Recommendation only — does not create a bill.",
          severity: cover <= 7 ? "risk" : "watch",
        };
      }),
  };

  const seasonal: ForecastModule = {
    id: "seasonal",
    title: "Seasonal Demand",
    summary: "Calendar heuristics for the current season.",
    items:
      monthOf(asOf) >= 6 && monthOf(asOf) <= 9
        ? [
            {
              id: "sea-monsoon",
              label: "Monsoon window",
              detail:
                "Rain gear / sandals demand up · suggested +400 rain ponchos",
              why: "Jun–Sep seasonal pattern (demo heuristic).",
              severity: "opportunity" as const,
            },
            {
              id: "sea-pack",
              label: "Packaging surge",
              detail:
                "Expect higher mailer & poly-bag burn with wet-season orders",
              why: "Courier packaging often tracks order volume in monsoon.",
              severity: "watch" as const,
            },
          ]
        : [
            {
              id: "sea-neutral",
              label: "Steady season",
              detail: "No strong seasonal uplift flagged for this month",
              why: "Outside monsoon heuristic window.",
              severity: "ok" as const,
            },
          ],
  };

  const byBills = [...stock].sort(
    (a, b) => b.sourceBillCount - a.sourceBillCount,
  );

  const fastMoving: ForecastModule = {
    id: "fast_moving",
    title: "Fast Moving Products",
    summary: "Highest purchase frequency / spend velocity.",
    items: byBills.slice(0, 5).map((row) => ({
      id: `fast-${row.key}`,
      label: familyName(row.description),
      detail: `${row.sourceBillCount} bills · spend signal`,
      why: "Ranked by contributing purchase bills.",
      severity: "opportunity" as const,
    })),
  };

  const slowMoving: ForecastModule = {
    id: "slow_moving",
    title: "Slow Moving Products",
    summary: "Low bill frequency with remaining sellable stock.",
    items: [...stock]
      .filter((r) => r.sellableQty > 0)
      .sort((a, b) => a.sourceBillCount - b.sourceBillCount)
      .slice(0, 5)
      .map((row) => ({
        id: `slow-${row.key}`,
        label: familyName(row.description),
        detail: `${row.sourceBillCount} bills · sellable ${row.sellableQty}`,
        why: "Few replenishment events — review dead stock risk.",
        severity: "watch" as const,
      })),
  };

  const overstock: ForecastModule = {
    id: "overstock",
    title: "Overstock",
    summary: "High days-of-cover — pause reorders.",
    items: withCover
      .filter((x) => x.cover >= 40)
      .slice(-5)
      .reverse()
      .map(({ row, cover }) => ({
        id: `over-${row.key}`,
        label: familyName(row.description),
        detail: `${cover} days cover · sellable ${row.sellableQty}`,
        why: "Cover well above 40-day threshold.",
        severity: "watch" as const,
      })),
  };

  const understock: ForecastModule = {
    id: "understock",
    title: "Understock",
    summary: "Near stockout — prioritize purchase planning.",
    items: withCover
      .filter((x) => x.cover <= 10)
      .slice(0, 5)
      .map(({ row, cover }) => ({
        id: `under-${row.key}`,
        label: familyName(row.description),
        detail: `${cover} days left · sellable ${row.sellableQty}`,
        why: "Cover at or below 10 days.",
        severity: "risk" as const,
      })),
  };

  const vendorSpend = new Map<
    string,
    { name: string; spend: number; count: number }
  >();
  for (const bill of input.bills) {
    if (bill.status === "void") continue;
    const cur = vendorSpend.get(bill.vendorId) ?? {
      name: bill.vendorName,
      spend: 0,
      count: 0,
    };
    cur.spend += bill.totalAmount;
    cur.count += 1;
    vendorSpend.set(bill.vendorId, cur);
  }
  const totalSpend =
    [...vendorSpend.values()].reduce((s, v) => s + v.spend, 0) || 1;

  const vendorRisk: ForecastModule = {
    id: "vendor_risk",
    title: "Vendor Risk",
    summary: "Concentration, price drift, and outstanding signals.",
    items: [
      ...[...vendorSpend.entries()]
        .map(([id, v]) => ({
          id,
          ...v,
          share: (v.spend / totalSpend) * 100,
          pct: priceChangePct(vendorUnitPrices(input.bills, id)),
        }))
        .filter((v) => v.share >= 15 || (v.pct !== null && v.pct >= 4))
        .slice(0, 5)
        .map((v) => ({
          id: `vr-${v.id}`,
          label: v.name,
          detail:
            v.pct !== null && v.pct >= 4
              ? `${v.share.toFixed(0)}% of spend · prices +${v.pct}%`
              : `${v.share.toFixed(0)}% spend concentration · ${v.count} bills`,
          why:
            v.pct !== null && v.pct >= 4
              ? "Price increase vs earlier bills — compare alternatives before reorder."
              : "High concentration raises supply risk if this vendor delays.",
          severity: (v.pct !== null && v.pct >= 6
            ? "risk"
            : "watch") as InsightSeverity,
        })),
      ...(input.vendors ?? [])
        .filter((v) => (v.outstandingBalance ?? 0) > 0)
        .slice(0, 3)
        .map((v) => ({
          id: `vo-${v.id}`,
          label: v.name,
          detail: `Outstanding payables on vendor scorecard`,
          why: "Clear dues to protect fill rate (recommendation).",
          severity: "watch" as InsightSeverity,
        })),
    ].slice(0, 6),
  };

  const calendarItems = withCover
    .filter((x) => x.cover <= 25)
    .slice(0, 6)
    .map(({ row, cover }) => {
      const reorderAfter = Math.max(1, cover - 6);
      const when = new Date(parseDay(asOf) + reorderAfter * MS_DAY)
        .toISOString()
        .slice(0, 10);
      return {
        id: `cal-${row.key}`,
        label: familyName(row.description),
        detail: `Suggested review ~${when} (${reorderAfter}d)`,
        why: "Purchase calendar from days-of-cover — you decide.",
        severity: (cover <= 7 ? "risk" : "watch") as InsightSeverity,
      };
    });

  const purchaseCalendar: ForecastModule = {
    id: "purchase_calendar",
    title: "Purchase Calendar",
    summary: "Suggested reorder windows over the next 30–60 days.",
    items:
      calendarItems.length > 0
        ? calendarItems
        : [
            {
              id: "cal-clear",
              label: "No urgent windows",
              detail: "Cover looks healthy for the next month",
              why: "No SKU under 25 days of cover.",
              severity: "ok",
            },
          ],
  };

  return [
    inventoryForecast,
    daysOfCoverMod,
    reorder,
    seasonal,
    fastMoving,
    slowMoving,
    overstock,
    understock,
    vendorRisk,
    purchaseCalendar,
  ].map((mod) => ({
    ...mod,
    items:
      mod.items.length > 0
        ? mod.items
        : [
            {
              id: `${mod.id}-empty`,
              label: "No signals yet",
              detail: "Add stock-path purchases to unlock this module",
              why: "Needs purchase history.",
              severity: "ok" as const,
            },
          ],
  }));
}

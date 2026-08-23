/**
 * CommerceOS — Inventory AI Advisor & Decision Intelligence Engine
 * 
 * ARCHITECTURE PRINCIPLE:
 * Deterministic Inventory Engine / PostgreSQL = SINGLE SOURCE OF TRUTH.
 * AI never directly mutates quantities, ATS, reservations, or storage balances.
 * AI only analyzes real data, explains trends, surfaces anomalies, and recommends
 * authorized business workflows upon user confirmation.
 */

import { calculateATS } from "./engine";
import { inventoryReconciliationEngine } from "./reconciliation-engine";
import type {
  ReconciliationReport,
  StockBalance,
} from "./types";

export type InventoryRecommendationType =
  | "STOCKOUT_RISK"
  | "REORDER_RECOMMENDATION"
  | "SLOW_DEAD_STOCK"
  | "INVENTORY_ANOMALY"
  | "DAMAGED_QC_DISPOSITION"
  | "WAREHOUSE_TRANSFER"
  | "MARKETPLACE_ALLOCATION";

export type RecommendationSeverity = "critical" | "warning" | "opportunity" | "info";

export interface InventoryRecommendation {
  recommendationId: string;
  type: InventoryRecommendationType;
  severity: RecommendationSeverity;
  sku: string;
  productId?: string;
  title: string;
  explanation: string;
  evidence: {
    currentAts: number;
    onHand: number;
    reserved: number;
    damaged: number;
    inTransit: number;
    incoming: number;
    safetyStock: number;
    reorderPoint?: number;
    daysOfCover?: number | "Insufficient data";
    dailyVelocity?: number;
    estimatedCapitalLockedInr?: number;
  };
  recommendedAction: string;
  actionWorkflow?: "reorder" | "transfer" | "vendor_exchange" | "scrap" | "reconcile" | "marketplace";
  actionRoute?: string;
  confidence: string; // e.g. "95%" or "Insufficient data"
  generatedAt: string;
  dataFreshness: string;
  requiresApproval: boolean;
}

export interface InventoryAdvisorAnalysisInput {
  balances: StockBalance[];
  storageLocations?: Array<{
    storageLocationId: string;
    locationName?: string;
    sku: string;
    availableQty: number;
  }>;
  recentOrders?: Array<{
    sku: string;
    quantity: number;
    createdAt: string;
  }>;
  consumptionHistory?: Array<{
    sku: string;
    quantity: number;
  }>;
  connectedMarketplaces?: Array<{
    channel: string;
    connected: boolean;
  }>;
}

export class InventoryAdvisorEngine {
  /**
   * Run comprehensive analysis on real inventory data and generate actionable recommendations
   */
  public generateRecommendations(input: InventoryAdvisorAnalysisInput): InventoryRecommendation[] {
    const recommendations: InventoryRecommendation[] = [];
    const now = new Date().toISOString();
    const balances = input.balances || [];

    if (balances.length === 0) {
      return [];
    }

    // 1. Reconciliation Anomalies (Authoritative cross-check)
    const reconciliationReport: ReconciliationReport = inventoryReconciliationEngine.auditBalances({
      inventoryBalances: balances,
      storagePhysicalRecords: input.storageLocations,
    });

    for (const issue of reconciliationReport.issues.slice(0, 3)) {
      recommendations.push({
        recommendationId: `rec-anomaly-${issue.sku}-${Date.now()}`,
        type: "INVENTORY_ANOMALY",
        severity: issue.severity === "CRITICAL" ? "critical" : "warning",
        sku: issue.sku,
        productId: issue.productId,
        title: `Reconciliation Variance Detected: ${issue.sku}`,
        explanation: issue.description,
        evidence: {
          currentAts: 0,
          onHand: issue.inventoryQty ?? 0,
          reserved: 0,
          damaged: 0,
          inTransit: 0,
          incoming: 0,
          safetyStock: 0,
          daysOfCover: "Insufficient data",
        },
        recommendedAction: issue.suggestedAction,
        actionWorkflow: "reconcile",
        confidence: "Deterministic (100%)",
        generatedAt: now,
        dataFreshness: "Live Database Audit",
        requiresApproval: true,
      });
    }

    // Process each SKU
    for (const balance of balances) {
      const atsDetails = calculateATS(balance);
      const sku = balance.sku;
      const onHand = atsDetails.onHand;
      const ats = atsDetails.ats;
      const reserved = atsDetails.reserved;
      const damaged = atsDetails.damaged;
      const inTransit = atsDetails.inTransit;
      const incoming = atsDetails.incoming;
      const safetyStock = atsDetails.safetyStock;

      // Estimate velocity from recent orders (if available)
      const skuOrders = (input.recentOrders || []).filter(
        (o) => o.sku.toLowerCase().trim() === sku.toLowerCase().trim(),
      );
      const unitsSold = skuOrders.reduce((sum, o) => sum + o.quantity, 0);
      const dailyVelocity = unitsSold > 0 ? unitsSold / 30 : 0; // 30-day velocity estimate
      const hasVelocityData = dailyVelocity > 0;
      const daysOfCover = hasVelocityData && ats > 0 ? Math.round(ats / dailyVelocity) : undefined;

      const reorderPoint = safetyStock * 2;

      // 2. STOCKOUT RISK RECOMMENDATION
      if (ats <= reorderPoint && ats > 0 && incoming === 0 && inTransit === 0) {
        const isUrgent = ats <= safetyStock;
        recommendations.push({
          recommendationId: `rec-stockout-${sku}`,
          type: "STOCKOUT_RISK",
          severity: isUrgent ? "critical" : "warning",
          sku,
          productId: balance.productId,
          title: isUrgent ? `Critical Stockout Risk: ${sku}` : `Low Coverage Alert: ${sku}`,
          explanation: `Current ATS is ${ats} units, which is at or below the safety threshold of ${reorderPoint} units with 0 incoming purchase shipments.`,
          evidence: {
            currentAts: ats,
            onHand,
            reserved,
            damaged,
            inTransit,
            incoming,
            safetyStock,
            reorderPoint,
            daysOfCover: daysOfCover ?? "Insufficient data",
            dailyVelocity: hasVelocityData ? Number(dailyVelocity.toFixed(1)) : undefined,
          },
          recommendedAction: `Create Purchase Order for ${Math.max(50, safetyStock * 4)} units to restore buffer.`,
          actionWorkflow: "reorder",
          actionRoute: "/purchase",
          confidence: hasVelocityData ? "94%" : "Insufficient data",
          generatedAt: now,
          dataFreshness: "Real-time Stock Engine",
          requiresApproval: true,
        });
      }

      // 3. REORDER RECOMMENDATION
      if (ats === 0 && onHand === 0 && incoming === 0) {
        recommendations.push({
          recommendationId: `rec-reorder-${sku}`,
          type: "REORDER_RECOMMENDATION",
          severity: "critical",
          sku,
          productId: balance.productId,
          title: `Stock Depleted — Restock Required: ${sku}`,
          explanation: `SKU has zero Available-to-Sell and zero incoming stock. Customer demand cannot be fulfilled.`,
          evidence: {
            currentAts: 0,
            onHand: 0,
            reserved,
            damaged,
            inTransit,
            incoming: 0,
            safetyStock,
            reorderPoint,
            daysOfCover: 0,
          },
          recommendedAction: `Initiate supplier replenishment PO for ${Math.max(50, safetyStock * 5)} units.`,
          actionWorkflow: "reorder",
          actionRoute: "/purchase",
          confidence: "98%",
          generatedAt: now,
          dataFreshness: "Real-time Stock Engine",
          requiresApproval: true,
        });
      }

      // 4. SLOW / DEAD STOCK RECOMMENDATION
      if (onHand > 80 && unitsSold === 0 && !hasVelocityData) {
        const costPrice = balance.costPrice ?? 400;
        const capitalLocked = onHand * costPrice;
        recommendations.push({
          recommendationId: `rec-deadstock-${sku}`,
          type: "SLOW_DEAD_STOCK",
          severity: "warning",
          sku,
          productId: balance.productId,
          title: `Capital Locked in Slow Inventory: ${sku}`,
          explanation: `High on-hand quantity (${onHand} units) with no recent order velocity. Holding cost accumulating.`,
          evidence: {
            currentAts: ats,
            onHand,
            reserved,
            damaged,
            inTransit,
            incoming,
            safetyStock,
            daysOfCover: "Insufficient data",
            estimatedCapitalLockedInr: capitalLocked,
          },
          recommendedAction: `Consider seasonal promotional bundle or marketplace allocation to accelerate turnover.`,
          actionWorkflow: "marketplace",
          actionRoute: "/marketplace",
          confidence: "88%",
          generatedAt: now,
          dataFreshness: "Real-time Stock Engine",
          requiresApproval: true,
        });
      }

      // 5. DAMAGED / QC DISPOSITION
      if (damaged > 0) {
        recommendations.push({
          recommendationId: `rec-damage-${sku}`,
          type: "DAMAGED_QC_DISPOSITION",
          severity: "warning",
          sku,
          productId: balance.productId,
          title: `Unresolved QC Quarantine: ${sku}`,
          explanation: `${damaged} units in QC Hold pending disposition. These units are excluded from ATS and cannot be sold.`,
          evidence: {
            currentAts: ats,
            onHand,
            reserved,
            damaged,
            inTransit,
            incoming,
            safetyStock,
            daysOfCover: "Insufficient data",
          },
          recommendedAction: `Review vendor return policy: initiate Vendor Exchange or authorize Scrap write-off.`,
          actionWorkflow: "vendor_exchange",
          confidence: "100%",
          generatedAt: now,
          dataFreshness: "Physical Storage QC",
          requiresApproval: true,
        });
      }
    }

    // 6. MULTI-LOCATION WAREHOUSE TRANSFER RECOMMENDATION
    if (input.storageLocations && input.storageLocations.length > 1) {
      // Group by SKU
      const skuLocMap = new Map<string, Array<{ locationId: string; locationName?: string; qty: number }>>();
      for (const loc of input.storageLocations) {
        const list = skuLocMap.get(loc.sku) || [];
        list.push({ locationId: loc.storageLocationId, locationName: loc.locationName, qty: loc.availableQty });
        skuLocMap.set(loc.sku, list);
      }

      for (const [sku, locList] of skuLocMap.entries()) {
        if (locList.length >= 2) {
          const sorted = [...locList].sort((a, b) => b.qty - a.qty);
          const highest = sorted[0]!;
          const lowest = sorted[sorted.length - 1]!;

          if (highest.qty > 50 && lowest.qty <= 5) {
            const transferQty = Math.floor(highest.qty * 0.3);
            recommendations.push({
              recommendationId: `rec-transfer-${sku}`,
              type: "WAREHOUSE_TRANSFER",
              severity: "opportunity",
              sku,
              title: `Inter-Facility Stock Rebalance: ${sku}`,
              explanation: `${highest.locationName || highest.locationId} has surplus stock (${highest.qty} units) while ${lowest.locationName || lowest.locationId} has low availability (${lowest.qty} units).`,
              evidence: {
                currentAts: highest.qty,
                onHand: highest.qty + lowest.qty,
                reserved: 0,
                damaged: 0,
                inTransit: 0,
                incoming: 0,
                safetyStock: 5,
                daysOfCover: "Insufficient data",
              },
              recommendedAction: `Transfer ${transferQty} units from ${highest.locationName || highest.locationId} to ${lowest.locationName || lowest.locationId}.`,
              actionWorkflow: "transfer",
              actionRoute: "/storage",
              confidence: "91%",
              generatedAt: now,
              dataFreshness: "Storage Bin Mapping",
              requiresApproval: true,
            });
          }
        }
      }
    }

    // 7. MARKETPLACE ALLOCATION ADVISOR
    if (input.connectedMarketplaces && input.connectedMarketplaces.length > 0) {
      const disconnected = input.connectedMarketplaces.filter((m) => !m.connected);
      if (disconnected.length > 0) {
        recommendations.push({
          recommendationId: `rec-mkt-disconnected-${Date.now()}`,
          type: "MARKETPLACE_ALLOCATION",
          severity: "info",
          sku: "NETWORK-CHANNELS",
          title: `Sales Channel Integration Status`,
          explanation: `${disconnected.map((d) => d.channel).join(", ")} is currently NOT CONNECTED. Channel inventory displays NOT SYNCED.`,
          evidence: {
            currentAts: 0,
            onHand: 0,
            reserved: 0,
            damaged: 0,
            inTransit: 0,
            incoming: 0,
            safetyStock: 0,
            daysOfCover: "Insufficient data",
          },
          recommendedAction: `Connect marketplace seller credentials to enable live async stock push.`,
          actionWorkflow: "marketplace",
          actionRoute: "/marketplace",
          confidence: "100%",
          generatedAt: now,
          dataFreshness: "Marketplace Connection Registry",
          requiresApproval: true,
        });
      }
    }

    return recommendations;
  }
}

export const inventoryAdvisorEngine = new InventoryAdvisorEngine();

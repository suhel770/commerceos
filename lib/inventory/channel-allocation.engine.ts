/**
 * CommerceOS — Progressive Marketplace Channel Allocation & Sync Engine
 * Handles Common Stock Pool (Small Seller), Channel Allocation Rules (Growing Seller),
 * and Enterprise Multi-Node Distribution without fabricated inventory data.
 */

import { calculateATS } from "./engine";
import type {
  ChannelAllocationResult,
  ChannelAllocationRule,
  SellerComplexityMode,
  StockBalance,
} from "./types";

export interface MarketplaceSyncJob {
  id: string;
  sku: string;
  channel: string;
  quantityToSync: number;
  idempotencyKey: string;
  status: "PENDING" | "PROCESSING" | "SYNCED" | "FAILED";
  retryCount: number;
  lastAttemptAt?: string;
  errorMessage?: string;
}

export interface AllocationAuditEvent {
  id: string;
  timestamp: string;
  sku: string;
  actorId?: string;
  actorName?: string;
  previousRules: ChannelAllocationRule[];
  newRules: ChannelAllocationRule[];
  totalAts: number;
  totalAllocated: number;
  unallocated: number;
  mode: SellerComplexityMode;
}

export class ChannelAllocationEngine {
  private customRules: Map<string, ChannelAllocationRule[]> = new Map();
  private syncQueue: MarketplaceSyncJob[] = [];
  private processedSyncKeys: Set<string> = new Set();
  private auditLog: AllocationAuditEvent[] = [];

  /**
   * Set custom channel allocation rules for a specific SKU
   */
  setRulesForSku(sku: string, rules: ChannelAllocationRule[]) {
    this.customRules.set(sku.toLowerCase().trim(), rules);
  }

  /**
   * Retrieve configured channel rules for a SKU
   */
  getRulesForSku(sku: string): ChannelAllocationRule[] {
    return this.customRules.get(sku.toLowerCase().trim()) || [];
  }

  /**
   * Validate and save channel allocation rules with strict ATS bound enforcement
   */
  validateAndSaveRules(input: {
    sku: string;
    totalAts: number;
    rules: ChannelAllocationRule[];
    mode?: SellerComplexityMode;
    actorId?: string;
    actorName?: string;
  }): {
    success: boolean;
    error?: string;
    unallocated: number;
    totalAllocated: number;
    event?: AllocationAuditEvent;
  } {
    const sku = input.sku.toLowerCase().trim();
    const mode = input.mode || "growing";
    const totalAts = Math.max(0, input.totalAts);
    const prevRules = this.getRulesForSku(sku);

    let totalAllocated = 0;
    let totalPct = 0;

    for (const rule of input.rules) {
      if (!rule.active) continue;

      if (typeof rule.fixedCap === "number") {
        if (rule.fixedCap < 0) {
          return {
            success: false,
            error: `Allocated quantity for channel ${rule.channel} cannot be negative.`,
            unallocated: totalAts,
            totalAllocated: 0,
          };
        }
        totalAllocated += rule.fixedCap;
      }

      if (typeof rule.percentage === "number") {
        if (rule.percentage < 0) {
          return {
            success: false,
            error: `Allocated percentage for channel ${rule.channel} cannot be negative.`,
            unallocated: totalAts,
            totalAllocated: 0,
          };
        }
        totalPct += rule.percentage;
      }
    }

    if (totalPct > 100) {
      return {
        success: false,
        error: `Total channel allocation percentage (${totalPct}%) exceeds 100%.`,
        unallocated: totalAts,
        totalAllocated,
      };
    }

    if (totalAllocated > totalAts) {
      const overage = totalAllocated - totalAts;
      return {
        success: false,
        error: `Allocation exceeds available ATS by ${overage} units. Total ATS is ${totalAts} units, but configured allocation is ${totalAllocated} units.`,
        unallocated: 0,
        totalAllocated,
      };
    }

    const unallocated = Math.max(0, totalAts - totalAllocated);

    // Save rules
    this.setRulesForSku(sku, input.rules);

    // Create Audit Event (MARKETPLACE_ALLOCATION_CHANGED)
    const auditEvent: AllocationAuditEvent = {
      id: `aevt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      sku,
      actorId: input.actorId || "usr-current",
      actorName: input.actorName || "Current User",
      previousRules: prevRules,
      newRules: input.rules,
      totalAts,
      totalAllocated,
      unallocated,
      mode,
    };
    this.auditLog.push(auditEvent);

    // Queue idempotent sync jobs for active channels
    for (const rule of input.rules) {
      if (rule.active && typeof rule.fixedCap === "number" && rule.fixedCap > 0) {
        this.queueSync({
          sku,
          channel: rule.channel,
          quantity: rule.fixedCap,
          idempotencyKey: `sync-${sku}-${rule.channel}-${Date.now()}`,
        });
      }
    }

    return {
      success: true,
      unallocated,
      totalAllocated,
      event: auditEvent,
    };
  }

  /**
   * Authoritative Channel Allocation Calculator
   */
  calculateAllocations(
    balance: StockBalance,
    mode: SellerComplexityMode = "small",
    connectedChannels: string[] = ["AMAZON", "FLIPKART", "SHOPIFY"],
  ): ChannelAllocationResult {
    const atsDetails = calculateATS(balance);
    const totalAts = atsDetails.ats;
    const sku = balance.sku;
    const rules = this.getRulesForSku(sku);

    if (totalAts <= 0 || connectedChannels.length === 0) {
      return {
        sku,
        totalAts: 0,
        allocations: connectedChannels.map((channel) => ({
          channel,
          allocatedQty: 0,
          syncStatus: "NOT_SYNCED",
        })),
        unallocatedQty: 0,
        mode,
      };
    }

    // MODE 1: Small Seller — Common Stock Pool
    if (mode === "small" && rules.length === 0) {
      return {
        sku,
        totalAts,
        allocations: connectedChannels.map((channel) => ({
          channel,
          allocatedQty: totalAts, // Common stock pool: all channels see total ATS
          syncStatus: "PENDING_SYNC",
        })),
        unallocatedQty: 0,
        mode: "small",
      };
    }

    // MODE 2 & 3: Growing / Enterprise — Custom Rules Bounded by ATS
    let remainingAts = totalAts;
    const allocations: ChannelAllocationResult["allocations"] = [];

    // First pass: Allocate fixed caps or percentage quotas
    for (const channel of connectedChannels) {
      const rule = rules.find((r) => r.channel.toUpperCase() === channel.toUpperCase() && r.active);
      let qty = 0;

      if (rule) {
        if (typeof rule.fixedCap === "number" && rule.fixedCap > 0) {
          qty = Math.min(rule.fixedCap, remainingAts);
        } else if (typeof rule.percentage === "number" && rule.percentage > 0) {
          qty = Math.min(Math.floor((totalAts * rule.percentage) / 100), remainingAts);
        }
      } else {
        qty = 0;
      }

      remainingAts = Math.max(0, remainingAts - qty);
      allocations.push({
        channel,
        allocatedQty: qty,
        syncStatus: qty > 0 ? "PENDING_SYNC" : "NOT_SYNCED",
      });
    }

    return {
      sku,
      totalAts,
      allocations,
      unallocatedQty: remainingAts,
      mode: rules.length > 0 ? "growing" : mode,
    };
  }

  /**
   * Queue an asynchronous marketplace sync event with idempotency protection.
   */
  queueSync(input: {
    sku: string;
    channel: string;
    quantity: number;
    idempotencyKey: string;
  }): { queued: boolean; job?: MarketplaceSyncJob; reason?: string } {
    if (this.processedSyncKeys.has(input.idempotencyKey)) {
      return {
        queued: false,
        reason: `Duplicate marketplace sync event ${input.idempotencyKey} ignored idempotently.`,
      };
    }

    const job: MarketplaceSyncJob = {
      id: `mjob-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sku: input.sku,
      channel: input.channel,
      quantityToSync: input.quantity,
      idempotencyKey: input.idempotencyKey,
      status: "PENDING",
      retryCount: 0,
    };

    this.syncQueue.push(job);
    this.processedSyncKeys.add(input.idempotencyKey);

    return { queued: true, job };
  }

  getPendingSyncJobs(): MarketplaceSyncJob[] {
    return this.syncQueue.filter((j) => j.status === "PENDING");
  }

  getAuditLog(sku?: string): AllocationAuditEvent[] {
    if (!sku) return [...this.auditLog];
    const normalized = sku.toLowerCase().trim();
    return this.auditLog.filter((l) => l.sku === normalized);
  }

  clearQueue() {
    this.syncQueue = [];
    this.processedSyncKeys.clear();
  }
}

export const channelAllocationEngine = new ChannelAllocationEngine();

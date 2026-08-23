/**
 * CommerceOS — Consumable Usage Rules Service
 * ===========================================
 * Business logic layer for Product Packaging & Consumable BOM Rules.
 */

import {
  consumableUsageRuleRepository,
} from "./consumable-rules.repository";
import {
  calculateExpectedConsumables,
} from "./calculator";
import type {
  ConsumableUsageRule,
  CreateConsumableRuleInput,
  UpdateConsumableRuleInput,
  ExpectedConsumableProposal,
} from "./types";

export class ConsumableRuleError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ConsumableRuleError";
    this.code = code;
  }
}

class ConsumableRulesService {
  /**
   * Get all consumable usage rules for a product
   */
  public async getRulesForProduct(
    productId: string,
    tenantScope?: { organizationId?: string; workspaceId?: string }
  ): Promise<ConsumableUsageRule[]> {
    return await consumableUsageRuleRepository.getRulesByProductId(productId, tenantScope);
  }

  /**
   * Get all consumable usage rules for a product SKU
   */
  public async getRulesForSku(
    productSku: string,
    tenantScope?: { organizationId?: string; workspaceId?: string }
  ): Promise<ConsumableUsageRule[]> {
    return await consumableUsageRuleRepository.getRulesByProductSku(productSku, tenantScope);
  }

  /**
   * Create a new consumable usage rule with validation
   */
  public async createRule(input: CreateConsumableRuleInput): Promise<ConsumableUsageRule> {
    const qty = Number(input.quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new ConsumableRuleError("INVALID_QUANTITY", "Consumable rule quantity must be a positive number greater than 0.");
    }

    if (!input.productId?.trim()) {
      throw new ConsumableRuleError("MISSING_PRODUCT_ID", "Product ID is required.");
    }

    if (!input.productSku?.trim()) {
      throw new ConsumableRuleError("MISSING_PRODUCT_SKU", "Product SKU is required.");
    }

    if (!input.consumableSku?.trim()) {
      throw new ConsumableRuleError("MISSING_CONSUMABLE_SKU", "Consumable SKU is required.");
    }

    const mode = input.consumptionMode || "PER_UNIT";
    const allowedModes = ["PER_UNIT", "PER_ORDER", "PER_SHIPMENT", "FIXED_PER_PACK"];
    if (!allowedModes.includes(mode)) {
      throw new ConsumableRuleError("INVALID_MODE", `Invalid consumption mode "${mode}". Must be one of ${allowedModes.join(", ")}.`);
    }

    // Check for duplicate active rule for the exact same consumable + variant + mode
    const existingRules = await consumableUsageRuleRepository.getRulesByProductSku(input.productSku, {
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
    });

    const vTarget = (input.variantSku || "").toLowerCase().trim();
    const cTarget = input.consumableSku.toLowerCase().trim();

    const isDuplicate = existingRules.some(
      (r) =>
        r.active &&
        r.consumableSku.toLowerCase().trim() === cTarget &&
        (r.variantSku || "").toLowerCase().trim() === vTarget &&
        r.consumptionMode === mode
    );

    if (isDuplicate) {
      throw new ConsumableRuleError(
        "DUPLICATE_RULE",
        `An active consumable rule already exists for "${input.consumableSku}" in mode "${mode}". Update the existing rule instead.`
      );
    }

    return await consumableUsageRuleRepository.createRule({
      ...input,
      quantity: qty,
      consumptionMode: mode,
    });
  }

  /**
   * Update an existing rule
   */
  public async updateRule(
    id: string,
    input: UpdateConsumableRuleInput
  ): Promise<ConsumableUsageRule> {
    const existing = await consumableUsageRuleRepository.getRuleById(id, {
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
    });

    if (!existing) {
      throw new ConsumableRuleError("RULE_NOT_FOUND", `Consumable rule with ID "${id}" was not found.`);
    }

    if (input.quantity !== undefined) {
      const qty = Number(input.quantity);
      if (isNaN(qty) || qty <= 0) {
        throw new ConsumableRuleError("INVALID_QUANTITY", "Consumable rule quantity must be a positive number greater than 0.");
      }
    }

    if (input.consumptionMode !== undefined) {
      const allowedModes = ["PER_UNIT", "PER_ORDER", "PER_SHIPMENT", "FIXED_PER_PACK"];
      if (!allowedModes.includes(input.consumptionMode)) {
        throw new ConsumableRuleError("INVALID_MODE", `Invalid consumption mode "${input.consumptionMode}".`);
      }
    }

    const updated = await consumableUsageRuleRepository.updateRule(id, input);
    if (!updated) {
      throw new ConsumableRuleError("UPDATE_FAILED", "Failed to update consumable usage rule.");
    }
    return updated;
  }

  /**
   * Delete or deactivate a rule
   */
  public async deleteRule(
    id: string,
    tenantScope?: { organizationId?: string; workspaceId?: string }
  ): Promise<boolean> {
    const existing = await consumableUsageRuleRepository.getRuleById(id, tenantScope);
    if (!existing) {
      throw new ConsumableRuleError("RULE_NOT_FOUND", `Consumable rule with ID "${id}" was not found.`);
    }
    return await consumableUsageRuleRepository.deleteRule(id, tenantScope);
  }

  /**
   * Soft deactivate a rule
   */
  public async deactivateRule(
    id: string,
    tenantScope?: { organizationId?: string; workspaceId?: string }
  ): Promise<ConsumableUsageRule> {
    return await this.updateRule(id, {
      ...tenantScope,
      active: false,
    });
  }

  /**
   * Calculate expected packaging & consumable usage for order quantities
   */
  public async calculateExpectedUsage(options: {
    productSku: string;
    variantSku?: string;
    orderQuantity: number;
    shipmentCount?: number;
    packCount?: number;
    tenantScope?: { organizationId?: string; workspaceId?: string };
  }): Promise<ExpectedConsumableProposal[]> {
    const rules = await consumableUsageRuleRepository.getRulesByProductSku(
      options.productSku,
      options.tenantScope
    );

    return calculateExpectedConsumables({
      rules,
      productSku: options.productSku,
      variantSku: options.variantSku,
      orderQuantity: options.orderQuantity,
      shipmentCount: options.shipmentCount,
      packCount: options.packCount,
    });
  }

  /**
   * Get list of authoritative consumable items available in inventory for dropdown selector
   */
  public async getAvailableConsumables() {
    return await consumableUsageRuleRepository.getAuthoritativeConsumableOptions();
  }
}

export const consumableRulesService = new ConsumableRulesService();

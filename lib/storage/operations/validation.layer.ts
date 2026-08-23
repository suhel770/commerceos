/**
 * CommerceOS V4 — Storage Operation Validation Layer
 */

import type { StorageOperation, TransferOperationPayload, AdjustOperationPayload, ReceiveOperationPayload } from "./types";
import { StorageLocationEngine } from "../engine/storage-location.engine";
// In real implementation, we would query the Inventory Engine to check balances.
// import { InventoryEngine } from "@/lib/inventory/engine";

export class OperationValidationLayer {
  constructor(private locationEngine: StorageLocationEngine) {}

  async validate(operation: StorageOperation): Promise<{ isValid: boolean; reason?: string }> {
    try {
      switch (operation.type) {
        case "transfer_stock":
          return await this.validateTransfer(operation.payload as TransferOperationPayload, operation.securityContext);
        case "receive_stock":
          return await this.validateReceive(operation.payload as ReceiveOperationPayload);
        case "adjust_stock":
          return await this.validateAdjust(operation.payload as AdjustOperationPayload);
        default:
          // Skip validation for now on other types
          return { isValid: true };
      }
    } catch (e: any) {
      return { isValid: false, reason: e.message || "Unknown validation error" };
    }
  }

  private async validateTransfer(payload: TransferOperationPayload, security?: any): Promise<{ isValid: boolean; reason?: string }> {
    if (payload.sourceLocationId === payload.destinationLocationId) {
      return { isValid: false, reason: "Cannot transfer to the same location" };
    }

    if (!payload.lines || payload.lines.length === 0) {
      return { isValid: false, reason: "Transfer operation must have at least one product line" };
    }

    const sourceLoc = security
      ? await this.locationEngine.getLocationById(payload.sourceLocationId, security)
      : await this.locationEngine.getLocation(payload.sourceLocationId);
    if (!sourceLoc) return { isValid: false, reason: "Source location not found" };
    if (sourceLoc.isArchived || sourceLoc.lifecycleState !== "active") {
      return { isValid: false, reason: "Source location is not active" };
    }

    const destLoc = security
      ? await this.locationEngine.getLocationById(payload.destinationLocationId, security)
      : await this.locationEngine.getLocation(payload.destinationLocationId);
    if (!destLoc) return { isValid: false, reason: "Destination location not found" };
    if (destLoc.isArchived || destLoc.lifecycleState !== "active") {
      return { isValid: false, reason: "Destination location is not active" };
    }

    // In a full implementation, we'd check if `sourceLoc` has enough available units for `payload.lines`
    // using InventoryEngine.checkAvailability(sourceLocationId, sku, qty).
    for (const line of payload.lines) {
      if (line.quantity <= 0) {
        return { isValid: false, reason: `Transfer quantity for ${line.sku} must be greater than 0` };
      }
    }

    return { isValid: true };
  }

  private async validateReceive(payload: ReceiveOperationPayload): Promise<{ isValid: boolean; reason?: string }> {
    if (!payload.lines || payload.lines.length === 0) {
      return { isValid: false, reason: "Receive operation must have at least one product line" };
    }

    const destLoc = await this.locationEngine.getLocation(payload.destinationLocationId);
    if (!destLoc) return { isValid: false, reason: "Destination location not found" };
    if (destLoc.isArchived || destLoc.lifecycleState !== "active") {
      return { isValid: false, reason: "Cannot receive into an inactive or archived location" };
    }
    
    if (!destLoc.capabilities.includes("receive_stock")) {
      return { isValid: false, reason: "Destination location does not have receive_stock capability" };
    }

    for (const line of payload.lines) {
      if (line.quantity <= 0) {
        return { isValid: false, reason: `Receive quantity for ${line.sku} must be greater than 0` };
      }
    }

    return { isValid: true };
  }

  private async validateAdjust(payload: AdjustOperationPayload): Promise<{ isValid: boolean; reason?: string }> {
    if (!payload.lines || payload.lines.length === 0) {
      return { isValid: false, reason: "Adjust operation must have at least one product line" };
    }

    const validReasons = ["damage", "lost", "found", "correction", "expiry", "manual"];
    if (!validReasons.includes(payload.reason)) {
      return { isValid: false, reason: `Invalid adjustment reason: ${payload.reason}` };
    }

    const loc = await this.locationEngine.getLocation(payload.locationId);
    if (!loc) return { isValid: false, reason: "Location not found" };
    if (loc.isArchived || loc.lifecycleState !== "active") {
      return { isValid: false, reason: "Location is not active" };
    }

    return { isValid: true };
  }
}

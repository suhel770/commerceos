/**
 * CommerceOS V4 — Storage Operation Engine
 */

import type { StorageOperation, StorageOperationPayload, StorageOperationType } from "./types";
import { OperationValidationLayer } from "./validation.layer";
import { OperationAuditGenerator, type OperationAuditTrail } from "./audit.generator";
import { OperationActivityGenerator } from "./activity.generator";
import type { SecurityContext } from "../domain/types";
import type { StorageOperationEvent } from "./events";
// import { InventoryEngine } from "@/lib/inventory/engine";

export class StorageOperationEngine {
  private operations = new Map<string, StorageOperation>();
  private audits = new Map<string, OperationAuditTrail>();
  private events: StorageOperationEvent[] = [];

  constructor(
    private validationLayer: OperationValidationLayer,
    // private inventoryEngine: InventoryEngine
  ) {}

  async createOperation(
    type: StorageOperationType,
    payload: StorageOperationPayload,
    securityContext: SecurityContext
  ): Promise<StorageOperation> {
    const operation: StorageOperation = {
      id: `op-${Date.now().toString()}-${Math.floor(Math.random() * 1000)}`,
      type,
      status: "draft",
      payload,
      securityContext,
      createdBy: securityContext.actorId || "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.operations.set(operation.id, operation);

    this.events.push({
      eventId: `evt-${Date.now().toString()}`,
      eventName: "OperationCreated",
      aggregateId: operation.id,
      securityContext,
      payload: { operation },
      timestamp: new Date().toISOString(),
    });

    return operation;
  }

  async executeOperation(operationId: string, executedBy: string): Promise<StorageOperation> {
    const operation = this.operations.get(operationId);
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`);
    }

    if (operation.status !== "draft" && operation.status !== "pending") {
      throw new Error(`Operation ${operationId} is not in a valid state to execute: ${operation.status}`);
    }

    operation.status = "processing";
    operation.executedBy = executedBy;
    operation.updatedAt = new Date().toISOString();

    this.events.push({
      eventId: `evt-${Date.now().toString()}`,
      eventName: "OperationStarted",
      aggregateId: operation.id,
      securityContext: operation.securityContext,
      payload: { operationId, startedAt: operation.updatedAt },
      timestamp: operation.updatedAt,
    });

    const validationResult = await this.validationLayer.validate(operation);
    if (!validationResult.isValid) {
      operation.status = "failed";
      operation.failureReason = validationResult.reason;
      operation.updatedAt = new Date().toISOString();
      operation.completedAt = operation.updatedAt;

      const audit = OperationAuditGenerator.generate(operation, undefined, undefined, validationResult.reason);
      this.audits.set(audit.id, audit);

      this.events.push({
        eventId: `evt-${Date.now().toString()}`,
        eventName: "OperationFailed",
        aggregateId: operation.id,
        securityContext: operation.securityContext,
        payload: { operationId, reason: validationResult.reason || "Unknown", failedAt: operation.updatedAt },
        timestamp: operation.updatedAt,
      });

      return operation;
    }

    try {
      // In a real implementation, we would call the InventoryEngine to mutate stock here
      // await this.executeInventoryMutations(operation);

      operation.status = "completed";
      operation.updatedAt = new Date().toISOString();
      operation.completedAt = operation.updatedAt;

      const audit = OperationAuditGenerator.generate(operation, { /* before snapshot */ }, { /* after snapshot */ });
      this.audits.set(audit.id, audit);

      this.events.push({
        eventId: `evt-${Date.now().toString()}`,
        eventName: "OperationCompleted",
        aggregateId: operation.id,
        securityContext: operation.securityContext,
        payload: { operationId, completedAt: operation.updatedAt },
        timestamp: operation.updatedAt,
      });

      // Generate Activity
      let locationName = "Unknown Location"; // Fetch from LocationEngine in real impl
      const activity = OperationActivityGenerator.generateFromCompletedOperation(operation, locationName);
      this.events.push({
        eventId: `evt-${Date.now().toString()}`,
        eventName: "ActivityCreated",
        aggregateId: activity.id,
        securityContext: operation.securityContext,
        payload: { activity },
        timestamp: operation.updatedAt,
      });

      return operation;
    } catch (e: any) {
      operation.status = "failed";
      operation.failureReason = e.message || "Execution error";
      operation.updatedAt = new Date().toISOString();
      operation.completedAt = operation.updatedAt;

      const audit = OperationAuditGenerator.generate(operation, undefined, undefined, operation.failureReason);
      this.audits.set(audit.id, audit);

      this.events.push({
        eventId: `evt-${Date.now().toString()}`,
        eventName: "OperationFailed",
        aggregateId: operation.id,
        securityContext: operation.securityContext,
        payload: {
          operationId,
          reason: operation.failureReason || "Execution error",
          failedAt: operation.updatedAt,
        },
        timestamp: operation.updatedAt,
      });

      return operation;
    }
  }

  // Getters for testing
  getOperation(id: string): StorageOperation | undefined {
    return this.operations.get(id);
  }

  getEvents(): StorageOperationEvent[] {
    return this.events;
  }

  getAudits(): OperationAuditTrail[] {
    return Array.from(this.audits.values());
  }
}

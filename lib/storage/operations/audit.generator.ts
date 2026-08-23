/**
 * CommerceOS V4 — Storage Operation Audit Generator
 */

import type { StorageOperation } from "./types";
import type { SecurityContext } from "../domain/types";

export interface OperationAuditTrail {
  id: string;
  operationId: string;
  operationType: string;
  status: string;
  createdBy: string;
  executedBy?: string;
  securityContext: SecurityContext;
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
  reason?: string;
  timestamp: string;
}

export class OperationAuditGenerator {
  /**
   * Generates an audit trail for a storage operation.
   * In a real implementation, this would persist to a database collection.
   */
  static generate(
    operation: StorageOperation,
    beforeSnapshot?: Record<string, unknown>,
    afterSnapshot?: Record<string, unknown>,
    reason?: string
  ): OperationAuditTrail {
    return {
      id: `adt-${Date.now().toString()}-${Math.floor(Math.random() * 1000)}`,
      operationId: operation.id,
      operationType: operation.type,
      status: operation.status,
      createdBy: operation.createdBy,
      executedBy: operation.executedBy,
      securityContext: operation.securityContext,
      beforeSnapshot,
      afterSnapshot,
      reason: reason || operation.failureReason,
      timestamp: new Date().toISOString(),
    };
  }
}

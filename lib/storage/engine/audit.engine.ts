/**
 * CommerceOS V4 — Storage Audit Engine
 * Captures immutable audit trail logs (Who, When, What, Old Value, New Value, Reason)
 */

import type { SecurityContext, StorageAuditEntry } from "../domain/types";

export class StorageAuditEngine {
  private auditLogs: StorageAuditEntry[] = [];

  /**
   * Logs a state mutation into the immutable audit trail
   */
  public logChange(params: {
    locationId: string;
    action: string;
    fieldChanged: string;
    oldValue: unknown;
    newValue: unknown;
    reason?: string;
    security: SecurityContext;
  }): StorageAuditEntry {
    const entry: StorageAuditEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      locationId: params.locationId,
      action: params.action,
      actorId: params.security.actorId || "usr-system",
      actorName: params.security.actorName || "System Actor",
      fieldChanged: params.fieldChanged,
      oldValue: params.oldValue,
      newValue: params.newValue,
      reason: params.reason,
      timestamp: new Date().toISOString(),
    };

    this.auditLogs.push(entry);
    return entry;
  }

  /**
   * Retrieves audit logs for a specific location
   */
  public getLogsForLocation(locationId: string): StorageAuditEntry[] {
    return this.auditLogs.filter((log) => log.locationId === locationId);
  }

  /**
   * Retrieves all audit logs
   */
  public getAllLogs(): StorageAuditEntry[] {
    return [...this.auditLogs];
  }
}

export const storageAuditEngine = new StorageAuditEngine();

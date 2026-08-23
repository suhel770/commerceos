/**
 * CommerceOS Core Platform Foundation (CPF) V1
 * Immutable Audit Engine (AuditEngine)
 */

export type AuditLogEntry = {
  id: string;
  who: string;
  role: string;
  when: string;
  module: string;
  action: string;
  oldValue: any;
  newValue: any;
  reason?: string;
  device?: string;
  ip?: string;
  sessionId?: string;
};

class AuditEngine {
  private auditLogs: AuditLogEntry[] = [];

  public log(entry: Omit<AuditLogEntry, "id" | "when">): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `adt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      when: new Date().toISOString(),
    };
    this.auditLogs.push(fullEntry);
    return fullEntry;
  }

  public getLogsByModule(module: string): AuditLogEntry[] {
    return this.auditLogs.filter((l) => l.module === module);
  }
}

export const auditEngine = new AuditEngine();

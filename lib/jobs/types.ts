/**
 * CommerceOS Phase 5 — Job Types
 */

export const MARKETPLACE_SYNC = "MARKETPLACE_SYNC" as const;

export type CommerceJobType = typeof MARKETPLACE_SYNC;

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface JobInput {
  organizationId: string;
  workspaceId: string;
  correlationId?: string;
  jobType: CommerceJobType;
  outboxEventId?: string;
  payload: Record<string, unknown>;
  /** Must be unique per logical operation to prevent duplicate job creation */
  idempotencyKey: string;
  maxAttempts?: number;
  /** ISO datetime — when the job becomes eligible for processing */
  availableAt?: Date;
}

export interface JobRecord {
  id: string;
  organizationId: string;
  workspaceId: string;
  correlationId?: string | null;
  jobType: string;
  outboxEventId?: string | null;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  availableAt: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
  failedAt?: Date | null;
  lastError?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobHandler {
  handles(jobType: string): boolean;
  handle(job: JobRecord): Promise<void>;
}

/** Permanent errors that must NOT be retried */
export class PermanentJobError extends Error {
  readonly permanent = true;
  constructor(message: string) {
    super(message);
    this.name = "PermanentJobError";
  }
}

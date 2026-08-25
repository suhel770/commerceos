/**
 * CommerceOS Phase 5 — Job Service
 *
 * Idempotent job creation: upsert on idempotencyKey ensures that
 * calling createIdempotent() twice with the same key produces exactly
 * one job record.
 */

import { db } from "@/lib/db";
import { sanitizePayload } from "@/lib/audit/sanitize";
import type { JobInput, JobRecord } from "./types";

export class JobService {
  /**
   * Create a background job, idempotent on idempotencyKey.
   * If a job with the same key already exists, returns the existing record.
   */
  static async createIdempotent(input: JobInput): Promise<JobRecord> {
    const existing = await db.backgroundJob.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });

    if (existing) {
      return existing as unknown as JobRecord;
    }

    const job = await db.backgroundJob.create({
      data: {
        id: crypto.randomUUID(),
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        correlationId: input.correlationId ?? null,
        jobType: input.jobType,
        outboxEventId: input.outboxEventId ?? null,
        payload: sanitizePayload(input.payload) as any,
        idempotencyKey: input.idempotencyKey,
        status: "PENDING",
        attempts: 0,
        maxAttempts: input.maxAttempts ?? 5,
        availableAt: input.availableAt ?? new Date(),
      },
    });

    return job as unknown as JobRecord;
  }

  /**
   * List failed jobs for inspection (dead-letter view).
   * Tenant-scoped.
   */
  static async listFailed(
    organizationId: string,
    workspaceId: string,
    limit = 50
  ): Promise<JobRecord[]> {
    try {
      const jobs = await db.backgroundJob.findMany({
        where: { organizationId, workspaceId, status: "FAILED" },
        orderBy: { failedAt: "desc" },
        take: limit,
      });
      return jobs as unknown as JobRecord[];
    } catch {
      return [];
    }
  }

  /**
   * List pending jobs for a given workspace.
   */
  static async listPending(
    organizationId: string,
    workspaceId: string,
    limit = 50
  ): Promise<JobRecord[]> {
    try {
      const jobs = await db.backgroundJob.findMany({
        where: {
          organizationId,
          workspaceId,
          status: "PENDING",
          availableAt: { lte: new Date() },
        },
        orderBy: { availableAt: "asc" },
        take: limit,
      });
      return jobs as unknown as JobRecord[];
    } catch {
      return [];
    }
  }
}

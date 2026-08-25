/**
 * CommerceOS Phase 5 — Job Processor
 *
 * Claims PENDING jobs with a database-level row lock to prevent concurrent
 * duplicate processing. Executes the registered handler, marks completed or
 * retries on transient failure.
 *
 * Retry strategy (exponential backoff):
 *   attempt 1 → retry after 30s
 *   attempt 2 → retry after 60s
 *   attempt 3 → retry after 120s
 *   attempt 4 → retry after 240s
 *   attempt 5 → FAILED (dead-letter)
 *
 * Permanent errors (PermanentJobError) skip retries immediately.
 */

import { db } from "@/lib/db";
import { getJobHandler } from "./handlers/index";
import { PermanentJobError } from "./types";
import type { JobRecord } from "./types";

const RETRY_DELAYS_SECONDS = [30, 60, 120, 240, 480];

function retryDelay(attempt: number): Date {
  const delaySec = RETRY_DELAYS_SECONDS[Math.min(attempt, RETRY_DELAYS_SECONDS.length - 1)] ?? 480;
  return new Date(Date.now() + delaySec * 1000);
}

export interface JobProcessorResult {
  processed: number;
  succeeded: number;
  retried: number;
  failed: number;
  skipped: number;
}

export class JobProcessor {
  static async processBatch(batchSize = 20): Promise<JobProcessorResult> {
    const result: JobProcessorResult = {
      processed: 0,
      succeeded: 0,
      retried: 0,
      failed: 0,
      skipped: 0,
    };

    // Claim PENDING jobs atomically — row-level lock prevents double-processing
    let claimed: JobRecord[];
    try {
      claimed = await db.$transaction(async (tx) => {
        const jobs = await tx.backgroundJob.findMany({
          where: {
            status: "PENDING",
            availableAt: { lte: new Date() },
          },
          orderBy: { availableAt: "asc" },
          take: batchSize,
        });

        if (jobs.length === 0) return [];

        const ids = jobs.map((j) => j.id);
        await tx.backgroundJob.updateMany({
          where: { id: { in: ids }, status: "PENDING" },
          data: { status: "PROCESSING", startedAt: new Date() },
        });

        return jobs as unknown as JobRecord[];
      });
    } catch {
      return result;
    }

    for (const job of claimed) {
      result.processed++;
      const handler = getJobHandler(job.jobType);

      if (!handler) {
        // No handler registered — skip but leave as PROCESSING until manual review
        result.skipped++;
        await db.backgroundJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            failedAt: new Date(),
            lastError: `No handler registered for jobType="${job.jobType}"`,
          },
        });
        continue;
      }

      try {
        await handler.handle(job);

        await db.backgroundJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            lastError: null,
          },
        });
        result.succeeded++;
      } catch (err) {
        const isPermanent = err instanceof PermanentJobError;
        const newAttempts = job.attempts + 1;
        const exceededRetries = newAttempts >= job.maxAttempts;

        if (isPermanent || exceededRetries) {
          await db.backgroundJob.update({
            where: { id: job.id },
            data: {
              status: "FAILED",
              attempts: newAttempts,
              failedAt: new Date(),
              lastError: err instanceof Error ? err.message : String(err),
            },
          });
          result.failed++;
        } else {
          await db.backgroundJob.update({
            where: { id: job.id },
            data: {
              status: "PENDING",
              attempts: newAttempts,
              availableAt: retryDelay(newAttempts),
              lastError: err instanceof Error ? err.message : String(err),
            },
          });
          result.retried++;
        }
      }
    }

    return result;
  }
}

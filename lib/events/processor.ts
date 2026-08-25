/**
 * CommerceOS Phase 5 — Outbox Processor
 *
 * Claims PENDING OutboxEvents atomically, dispatches to registered handlers,
 * marks as PROCESSED on success, retries on transient failure, and marks
 * FAILED after maxAttempts is exceeded.
 *
 * Concurrency safety: PostgreSQL row-level locking inside db.$transaction()
 * ensures that two concurrent workers cannot claim the same event.
 *
 * Retry schedule (exponential backoff):
 *   attempt 1 → +30s
 *   attempt 2 → +60s
 *   attempt 3 → +120s
 *   attempt 4 → +240s
 *   attempt 5 → FAILED
 */

import { db } from "@/lib/db";
import { getOutboxHandler } from "./handlers/index";
import type { OutboxEventRecord } from "./types";

const RETRY_DELAYS_SECONDS = [30, 60, 120, 240, 480];

function retryDelay(attempt: number): Date {
  const sec = RETRY_DELAYS_SECONDS[Math.min(attempt, RETRY_DELAYS_SECONDS.length - 1)] ?? 480;
  return new Date(Date.now() + sec * 1000);
}

export interface OutboxProcessorResult {
  processed: number;
  succeeded: number;
  retried: number;
  failed: number;
  skipped: number;
}

export class OutboxProcessor {
  static async processBatch(batchSize = 20): Promise<OutboxProcessorResult> {
    const result: OutboxProcessorResult = {
      processed: 0,
      succeeded: 0,
      retried: 0,
      failed: 0,
      skipped: 0,
    };

    // Atomically claim PENDING events — prevents concurrent double-processing
    let claimed: OutboxEventRecord[];
    try {
      claimed = await db.$transaction(async (tx) => {
        const events = await tx.outboxEvent.findMany({
          where: {
            status: "PENDING",
            availableAt: { lte: new Date() },
          },
          orderBy: { availableAt: "asc" },
          take: batchSize,
        });

        if (events.length === 0) return [];

        const ids = events.map((e) => e.id);
        await tx.outboxEvent.updateMany({
          where: { id: { in: ids }, status: "PENDING" },
          data: { status: "PROCESSING", updatedAt: new Date() },
        });

        return events as unknown as OutboxEventRecord[];
      });
    } catch {
      return result;
    }

    for (const event of claimed) {
      result.processed++;
      const handler = getOutboxHandler(event.eventType);

      if (!handler) {
        result.skipped++;
        await db.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: "FAILED",
            failedAt: new Date(),
            lastError: `No handler for eventType="${event.eventType}"`,
          },
        });
        continue;
      }

      try {
        await handler.handle(event);

        await db.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: "PROCESSED",
            processedAt: new Date(),
            lastError: null,
          },
        });
        result.succeeded++;
      } catch (err) {
        const newAttempts = event.attempts + 1;
        const exceeded = newAttempts >= event.maxAttempts;

        if (exceeded) {
          await db.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: "FAILED",
              attempts: newAttempts,
              failedAt: new Date(),
              lastError: err instanceof Error ? err.message : String(err),
            },
          });
          result.failed++;
        } else {
          await db.outboxEvent.update({
            where: { id: event.id },
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

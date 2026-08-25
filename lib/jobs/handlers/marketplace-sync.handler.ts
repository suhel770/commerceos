/**
 * CommerceOS Phase 5 — Marketplace Sync Job Handler
 *
 * EXPLICIT NON-IMPLEMENTATION: This handler intentionally does NOT connect
 * to any marketplace API. It marks jobs as NOT_CONNECTED.
 *
 * This stub exists to:
 * 1. Prove the job pipeline reaches this point
 * 2. Prevent any "success" fabrication while adapters are not implemented
 * 3. Serve as the future integration point for Amazon/Flipkart adapters
 *
 * When a marketplace adapter is ready, replace the body of handle() with
 * the real integration and remove the NOT_CONNECTED result.
 */

import type { JobHandler, JobRecord } from "../types";
import { PermanentJobError } from "../types";

export class MarketplaceSyncHandler implements JobHandler {
  handles(jobType: string): boolean {
    return jobType === "MARKETPLACE_SYNC";
  }

  async handle(job: JobRecord): Promise<void> {
    const { channel } = job.payload as { channel?: string };

    // NOT_CONNECTED: marketplace adapters are not yet implemented.
    // This is a permanent error — no retry needed until an adapter exists.
    throw new PermanentJobError(
      `Marketplace sync not connected: channel="${channel ?? "unknown"}" is not yet implemented. ` +
      `Status: NOT_CONNECTED. Job ID: ${job.id}. Do not fabricate sync success.`
    );
  }
}

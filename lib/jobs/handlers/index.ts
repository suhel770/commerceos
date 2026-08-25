/**
 * CommerceOS Phase 5 — Job Handler Registry
 */
import type { JobHandler } from "../types";
import { MarketplaceSyncHandler } from "./marketplace-sync.handler";

const handlers: JobHandler[] = [new MarketplaceSyncHandler()];

export function getJobHandler(jobType: string): JobHandler | undefined {
  return handlers.find((h) => h.handles(jobType));
}

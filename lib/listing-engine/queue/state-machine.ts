import type { ListingJobStatus } from "../types";

const transitions: Record<ListingJobStatus, ListingJobStatus[]> = {
  draft: ["validated", "failed"],
  validated: ["queued", "failed"],
  queued: ["publishing", "failed"],
  publishing: ["published", "failed"],
  published: ["queued"], // re-publish / sync re-queue
  failed: ["queued", "validated"], // retry
};

export function canTransition(
  from: ListingJobStatus,
  to: ListingJobStatus,
): boolean {
  if (from === to) {
    return true;
  }

  return transitions[from].includes(to);
}

export function assertTransition(
  from: ListingJobStatus,
  to: ListingJobStatus,
) {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid listing job transition: ${from} → ${to}`,
    );
  }
}

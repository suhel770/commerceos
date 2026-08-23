/**
 * Workspace-scoped AI credit gate (local mock until Billing ships).
 * Every AI use must call `consumeAiCredit` after `hasAiCredits` succeeds.
 */

const STORAGE_KEY = "commerceos.ai.credits.v1";
const DEFAULT_CREDITS = 221;

function readCredits(): number {
  if (typeof window === "undefined") return DEFAULT_CREDITS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_CREDITS;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) return DEFAULT_CREDITS;
    return Math.floor(value);
  } catch {
    return DEFAULT_CREDITS;
  }
}

function writeCredits(value: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Math.max(0, Math.floor(value))));
  } catch {
    // ignore quota / private mode
  }
}

export function getAiCreditsRemaining(): number {
  return readCredits();
}

export function hasAiCredits(min = 1): boolean {
  return getAiCreditsRemaining() >= min;
}

/** Returns remaining credits after consume, or null if insufficient. */
export function consumeAiCredit(cost = 1): number | null {
  const current = getAiCreditsRemaining();
  if (current < cost) return null;
  const next = current - cost;
  writeCredits(next);
  return next;
}

export function setAiCreditsRemaining(value: number) {
  writeCredits(value);
}

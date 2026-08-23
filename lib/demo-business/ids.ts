/** Stable org/workspace for the StrideKids demo business. */
export const DEMO_ORG_ID = "org-commerceos";
export const DEMO_WS_ID = "ws-default";

/** Anchor end of the 6-month purchase history (inclusive). */
export const DEMO_ANCHOR_DATE = "2026-07-25";

/** Deterministic mulberry32 PRNG — never use Math.random() for demo SSOT. */
export function createSeededRng(seed: number) {
  let state = seed >>> 0;
  return {
    next(): number {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(min: number, max: number): number {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    pick<T>(items: readonly T[]): T {
      return items[Math.floor(this.next() * items.length)]!;
    },
  };
}

export function slugify(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}

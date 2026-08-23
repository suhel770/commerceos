/**
 * CommerceOS — Central money formatting utilities.
 *
 * Thin space (U+2009) is inserted between ₹ and the number for visual comfort.
 * Use these helpers everywhere instead of inline `₹${value}` string templates.
 */

const THIN_SPACE = "\u2009";

/**
 * Format a number as Indian Rupees with a thin space after ₹.
 * Drops fractional digits when the value is an integer.
 *
 * @example fmtINR(35000)   → "₹ 35,000"
 * @example fmtINR(38940.5) → "₹ 38,940.50"
 */
export function fmtINR(value: number): string {
  const hasFraction = !Number.isInteger(value);
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(value);
  return formatted.replace("\u20B9", `\u20B9${THIN_SPACE}`);
}

/**
 * Format a compact rupee value (e.g. 1.2L, 4.5k) with a thin space after ₹.
 * Falls back to fmtINR for values below 1,000.
 *
 * @example fmtINRCompact(3090000) → "₹ 30.9L"
 * @example fmtINRCompact(4500)    → "₹ 4.5k"
 */
export function fmtINRCompact(value: number): string {
  if (value >= 100_000) return `\u20B9${THIN_SPACE}${(value / 100_000).toFixed(1)}L`;
  if (value >= 1_000)   return `\u20B9${THIN_SPACE}${(value / 1_000).toFixed(1)}k`;
  return fmtINR(value);
}

export function formatCurrency(amount: number) {
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
  // Insert thin space (U+2009) between ₹ and the digits — UI display standard.
  return formatted.replace("\u20B9", "\u20B9\u2009");
}
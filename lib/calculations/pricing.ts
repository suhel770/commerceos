export interface PricingInput {
  costPrice: number;

  sellingPrice: number;

  shippingCost?: number;

  packagingCost?: number;

  marketplaceFee?: number;

  commission?: number;

  gst?: number;

  tds?: number;

  tcs?: number;

  advertisingCost?: number;

  returnCost?: number;
}

function value(v?: number) {
  return v ?? 0;
}

/* ----------------------------- */
/* Gross Profit                  */
/* ----------------------------- */

export function calculateGrossProfit(
  input: PricingInput
) {
  return (
    input.sellingPrice -
    input.costPrice
  );
}

/* ----------------------------- */
/* Gross Margin %                */
/* ----------------------------- */

export function calculateGrossMargin(
  input: PricingInput
) {
  if (input.sellingPrice === 0)
    return 0;

  return (
    (calculateGrossProfit(input) /
      input.sellingPrice) *
    100
  );
}

/* ----------------------------- */
/* Total Expenses                */
/* ----------------------------- */

export function calculateExpenses(
  input: PricingInput
) {
  return (
    value(input.shippingCost) +
    value(input.packagingCost) +
    value(input.marketplaceFee) +
    value(input.commission) +
    value(input.gst) +
    value(input.tds) +
    value(input.tcs) +
    value(input.advertisingCost) +
    value(input.returnCost)
  );
}

/* ----------------------------- */
/* Net Profit                    */
/* ----------------------------- */

export function calculateNetProfit(
  input: PricingInput
) {
  return (
    calculateGrossProfit(input) -
    calculateExpenses(input)
  );
}

/* ----------------------------- */
/* Net Margin                    */
/* ----------------------------- */

export function calculateNetMargin(
  input: PricingInput
) {
  if (input.sellingPrice === 0)
    return 0;

  return (
    (calculateNetProfit(input) /
      input.sellingPrice) *
    100
  );
}

/* ----------------------------- */
/* ROI                           */
/* ----------------------------- */

export function calculateROI(
  input: PricingInput
) {
  if (input.costPrice === 0)
    return 0;

  return (
    (calculateNetProfit(input) /
      input.costPrice) *
    100
  );
}
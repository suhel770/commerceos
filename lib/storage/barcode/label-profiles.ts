/**
 * CommerceOS Barcode Label Size Profiles & Print Layout Definitions
 */

export type LabelSizeFormat = "50x25" | "40x30" | "a4";

export interface LabelSizeProfile {
  id: LabelSizeFormat;
  label: string;
  desc: string;
  type: "roll" | "sheet";
  widthMm: number;
  heightMm: number;
  labelsPerPage: number;
  columnsPerPage?: number;
  rowsPerPage?: number;
  barcodeHeightMm: number;
  moduleWidthPx: number; // for SVG rendering
  maxTitleLines: number;
  titleFontSizePt: number;
  skuFontSizePt: number;
}

export const LABEL_PROFILES: Record<LabelSizeFormat, LabelSizeProfile> = {
  "50x25": {
    id: "50x25",
    label: "Standard 50×25mm",
    desc: "Zebra / TSC Thermal Roll",
    type: "roll",
    widthMm: 50,
    heightMm: 25,
    labelsPerPage: 1,
    barcodeHeightMm: 12,
    moduleWidthPx: 1.5,
    maxTitleLines: 1,
    titleFontSizePt: 7.5,
    skuFontSizePt: 8.5,
  },
  "40x30": {
    id: "40x30",
    label: "Thermal 40×30mm",
    desc: "Compact Thermal Roll",
    type: "roll",
    widthMm: 40,
    heightMm: 30,
    labelsPerPage: 1,
    barcodeHeightMm: 13,
    moduleWidthPx: 1.3,
    maxTitleLines: 2,
    titleFontSizePt: 7,
    skuFontSizePt: 8,
  },
  "a4": {
    id: "a4",
    label: "A4 Sheet (24 Grid)",
    desc: "24 Labels per A4 Page (3×8)",
    type: "sheet",
    widthMm: 63.5,
    heightMm: 33.9,
    labelsPerPage: 24,
    columnsPerPage: 3,
    rowsPerPage: 8,
    barcodeHeightMm: 14,
    moduleWidthPx: 1.6,
    maxTitleLines: 2,
    titleFontSizePt: 8,
    skuFontSizePt: 9,
  },
};

export const LABEL_SIZE_OPTIONS: Array<{ id: LabelSizeFormat; label: string; desc: string }> = [
  { id: "50x25", label: LABEL_PROFILES["50x25"].label, desc: LABEL_PROFILES["50x25"].desc },
  { id: "40x30", label: LABEL_PROFILES["40x30"].label, desc: LABEL_PROFILES["40x30"].desc },
  { id: "a4", label: LABEL_PROFILES["a4"].label, desc: LABEL_PROFILES["a4"].desc },
];

export interface PrintBatchCalculation {
  totalLabels: number;
  labelsPerPage: number;
  totalPages: number;
  pageBatches: Array<{ pageIndex: number; labelCount: number }>;
  summaryText: string;
}

/**
 * Accurately calculates print pagination and batch counts for any label quantity and format.
 * Ensures exact label counts without missing or surplus labels.
 */
export function calculatePrintBatch(
  quantity: number,
  format: LabelSizeFormat
): PrintBatchCalculation {
  const count = Math.max(1, Math.floor(quantity));
  const profile = LABEL_PROFILES[format] || LABEL_PROFILES["50x25"];
  const labelsPerPage = profile.labelsPerPage;

  if (profile.type === "roll") {
    return {
      totalLabels: count,
      labelsPerPage: 1,
      totalPages: count,
      pageBatches: [{ pageIndex: 0, labelCount: count }],
      summaryText: `${count} Roll Label${count > 1 ? "s" : ""}`,
    };
  }

  const totalPages = Math.ceil(count / labelsPerPage);
  const pageBatches: Array<{ pageIndex: number; labelCount: number }> = [];

  let remaining = count;
  for (let p = 0; p < totalPages; p++) {
    const take = Math.min(remaining, labelsPerPage);
    pageBatches.push({ pageIndex: p, labelCount: take });
    remaining -= take;
  }

  return {
    totalLabels: count,
    labelsPerPage,
    totalPages,
    pageBatches,
    summaryText: `${totalPages} Sheet${totalPages > 1 ? "s" : ""}`,
  };
}

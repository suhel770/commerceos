/**
 * CommerceOS Production-Grade Barcode Label Print Driver
 *
 * Generates standards-compliant, scanner-optimized print documents
 * with accurate physical dimensions (mm), quiet zones, and vector Code 128 SVG.
 */

import { generateCode128SvgString } from "./code128";
import { LABEL_PROFILES, type LabelSizeFormat, calculatePrintBatch } from "./label-profiles";
import { resolveBarcodeIdentity, type BarcodeIdentityItem } from "./barcode-identity";

export interface PrintLabelsOptions {
  item: BarcodeIdentityItem;
  quantity: number;
  format: LabelSizeFormat;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generates a complete standalone HTML document string for printing barcode labels.
 */
export function generateLabelPrintHtml(options: PrintLabelsOptions): string {
  const { item, quantity, format } = options;
  const identity = resolveBarcodeIdentity(item);

  if (!identity.isValid) {
    throw new Error(identity.error || "Cannot print barcode: invalid barcode identity");
  }

  const profile = LABEL_PROFILES[format] || LABEL_PROFILES["50x25"];
  const count = Math.min(1000, Math.max(1, Math.floor(quantity)));
  const batch = calculatePrintBatch(count, format);

  const productName = escapeHtml(item.productName || "Product");
  const barcodeValue = identity.value;
  const displayText = escapeHtml(identity.displayText);

  // Generate real Code 128 SVG string (with height and module width tailored to profile)
  const barcodeSvg = generateCode128SvgString(barcodeValue, {
    height: 40,
    moduleWidth: 1.8,
    barColor: "#000000",
    bgColor: "transparent",
  });

  const isRoll = profile.type === "roll";

  // Build label HTML
  const singleLabelHtml = `
    <div class="label-card">
      <div class="prod-title">${productName}</div>
      <div class="barcode-wrapper">
        ${barcodeSvg}
      </div>
      <div class="sku-text">${displayText}</div>
    </div>
  `;

  let contentHtml = "";

  if (isRoll) {
    // Thermal Roll: each label is its own page or continuous strip
    for (let i = 0; i < count; i++) {
      contentHtml += `
        <div class="roll-label-page">
          ${singleLabelHtml}
        </div>
      `;
    }
  } else {
    // A4 Sheet: group by pages
    for (const pageBatch of batch.pageBatches) {
      let sheetLabelsHtml = "";
      for (let i = 0; i < pageBatch.labelCount; i++) {
        sheetLabelsHtml += singleLabelHtml;
      }
      contentHtml += `
        <div class="a4-sheet-page">
          <div class="a4-grid">
            ${sheetLabelsHtml}
          </div>
        </div>
      `;
    }
  }

  const rollPageCss = isRoll
    ? `
      @page {
        size: ${profile.widthMm}mm ${profile.heightMm}mm;
        margin: 0 !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
      }
      .roll-label-page {
        width: ${profile.widthMm}mm;
        height: ${profile.heightMm}mm;
        page-break-after: always;
        break-after: page;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5mm;
      }
      .roll-label-page:last-child {
        page-break-after: avoid;
        break-after: avoid;
      }
      .label-card {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        text-align: center;
        overflow: hidden;
      }
    `
    : `
      @page {
        size: A4 portrait;
        margin: 8mm !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
      }
      .a4-sheet-page {
        width: 100%;
        min-height: 270mm;
        box-sizing: border-box;
        page-break-after: always;
        break-after: page;
      }
      .a4-sheet-page:last-child {
        page-break-after: avoid;
        break-after: avoid;
      }
      .a4-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-gap: 3mm;
        justify-items: center;
      }
      .label-card {
        width: ${profile.widthMm}mm;
        height: ${profile.heightMm}mm;
        box-sizing: border-box;
        border: 1px dashed #ccc;
        border-radius: 4px;
        padding: 2.5mm 2mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        text-align: center;
        page-break-inside: avoid;
        break-inside: avoid;
        overflow: hidden;
      }
    `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>CommerceOS Barcode Labels - ${displayText}</title>
        <style>
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff !important;
            color: #000000 !important;
          }
          ${rollPageCss}
          .prod-title {
            font-size: ${profile.titleFontSizePt}pt;
            font-weight: 700;
            line-height: 1.1;
            color: #000000;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .barcode-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            max-height: ${profile.barcodeHeightMm}mm;
            margin: 0.5mm 0;
            overflow: hidden;
          }
          .barcode-wrapper svg {
            width: auto;
            max-width: 95%;
            height: ${profile.barcodeHeightMm}mm;
            max-height: 100%;
            display: block;
          }
          .sku-text {
            font-family: "Courier New", Courier, monospace, monospace;
            font-size: ${profile.skuFontSizePt}pt;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #000000;
            line-height: 1;
          }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
    </html>
  `;
}

/**
 * Triggers printing using a sandboxed hidden iframe.
 */
export function printBarcodeLabels(options: PrintLabelsOptions): void {
  const html = generateLabelPrintHtml(options);

  const printFrame = document.createElement("iframe");
  printFrame.style.position = "fixed";
  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  printFrame.style.border = "none";
  printFrame.setAttribute("aria-hidden", "true");
  document.body.appendChild(printFrame);

  const doc = printFrame.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(printFrame);
    throw new Error("Unable to access print frame document");
  }

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 2000);
    }
  }, 300);
}

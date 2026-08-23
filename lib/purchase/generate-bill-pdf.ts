import { safeResponseJson } from "@/lib/api/client";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { BusinessProfile } from "@/lib/business-profile";
import { DEMO_BUSINESS } from "@/lib/demo-business";

import {
  PURCHASE_STATUS_LABELS,
  PURCHASE_TYPE_LABELS,
  type PurchaseBill,
  type Vendor,
} from "./types";

export type BillPdfAction = "view" | "download" | "print";

type PdfBuyer = Pick<
  BusinessProfile,
  | "legalName"
  | "brand"
  | "address"
  | "city"
  | "buyerState"
  | "pincode"
  | "gstin"
  | "pan"
  | "phone"
  | "email"
>;

function resolveBuyer(buyer?: BusinessProfile | null): PdfBuyer {
  if (buyer) {
    return {
      legalName: buyer.legalName,
      brand: buyer.brand,
      address: buyer.address,
      city: buyer.city,
      buyerState: buyer.buyerState,
      pincode: buyer.pincode,
      gstin: buyer.gstin,
      pan: buyer.pan,
      phone: buyer.phone,
      email: buyer.email,
    };
  }
  return {
    legalName: DEMO_BUSINESS.legalName,
    brand: DEMO_BUSINESS.brand,
    address: DEMO_BUSINESS.address,
    city: DEMO_BUSINESS.city,
    buyerState: DEMO_BUSINESS.buyerState,
    pincode: DEMO_BUSINESS.pincode,
    gstin: DEMO_BUSINESS.gstin,
    pan: DEMO_BUSINESS.pan,
    phone: DEMO_BUSINESS.phone,
    email: DEMO_BUSINESS.email,
  };
}

/** Helvetica has no ₹ glyph — use ASCII-safe INR formatting. */
function money(value: number) {
  const amount = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `Rs. ${amount}`;
}

function drawWrapped(
  doc: jsPDF,
  lines: string[],
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 4.2,
) {
  let cursor = y;
  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, maxWidth) as string[];
    doc.text(wrapped, x, cursor);
    cursor += wrapped.length * lineHeight;
  }
  return cursor;
}

/** Build a real Tax Invoice / Purchase Bill PDF from live bill data. */
export function buildPurchaseBillPdf(
  bill: PurchaseBill,
  vendor?: Vendor | null,
  buyerProfile?: BusinessProfile | null,
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const leftColW = contentWidth * 0.55;
  const rightColX = margin + leftColW + 6;
  const buyer = resolveBuyer(buyerProfile);

  // Accent bar
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth, 8, "F");

  let y = 18;

  // Left: buyer
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  const buyerName = doc.splitTextToSize(buyer.legalName, leftColW) as string[];
  doc.text(buyerName, margin, y);
  y += buyerName.length * 5.5 + 1;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  y = drawWrapped(
    doc,
    [
      buyer.address,
      `${buyer.city}, ${buyer.buyerState} ${buyer.pincode}`,
      `GSTIN: ${buyer.gstin}`,
      `PAN: ${buyer.pan}`,
      `Phone: ${buyer.phone}`,
      buyer.email,
    ],
    margin,
    y,
    leftColW,
    3.8,
  );

  // Right: document title + meta (fixed column, no overlap)
  let rightY = 18;
  doc.setTextColor(30, 64, 175);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("PURCHASE BILL", pageWidth - margin, rightY, { align: "right" });
  rightY += 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Tax Invoice Record", pageWidth - margin, rightY, {
    align: "right",
  });
  rightY += 7;

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const metaRows: Array<[string, string]> = [
    ["Bill No.", bill.billNumber],
    ["Date", bill.billDate],
  ];
  if (bill.dueDate) metaRows.push(["Due", bill.dueDate]);
  if (bill.vendorInvoiceNumber) {
    metaRows.push(["Vendor Inv.", bill.vendorInvoiceNumber]);
  }

  for (const [label, value] of metaRows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(label, rightColX, rightY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(value, pageWidth - margin, rightY, { align: "right" });
    rightY += 5;
  }

  y = Math.max(y, rightY) + 6;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // Vendor + summary boxes
  const boxTop = y;
  const boxPad = 3.5;
  const colGap = 5;
  const boxW = (contentWidth - colGap) / 2;
  const lineH = 3.9;
  const textMaxW = boxW - boxPad * 2;

  const vendorLines = [
    bill.vendorName,
    vendor?.address,
    [vendor?.city, vendor?.state, vendor?.pincode].filter(Boolean).join(", "),
    vendor?.gstin ? `GSTIN: ${vendor.gstin}` : null,
    vendor?.pan ? `PAN: ${vendor.pan}` : null,
    vendor?.contactPerson ? `Contact: ${vendor.contactPerson}` : null,
    vendor?.phone ? `Phone: ${vendor.phone}` : null,
  ].filter(Boolean) as string[];

  const summaryLines = [
    `Type: ${PURCHASE_TYPE_LABELS[bill.purchaseType]}`,
    `Status: ${PURCHASE_STATUS_LABELS[bill.status]}`,
    `Payment: ${bill.paymentStatus.toUpperCase()} (${bill.paymentMethod.replaceAll("_", " ")})`,
    `Tax mode: ${bill.interstate ? "IGST (interstate)" : "CGST + SGST"}`,
    bill.billUploadName ? `Attachment: ${bill.billUploadName}` : null,
  ].filter(Boolean) as string[];

  const measureBlock = (lines: string[]) => {
    let h = 0;
    for (const line of lines) {
      h += (doc.splitTextToSize(line, textMaxW) as string[]).length * lineH;
    }
    return h;
  };

  const boxH =
    9 + Math.max(measureBlock(vendorLines), measureBlock(summaryLines)) + 3;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, boxTop, boxW, boxH, 1.5, 1.5, "FD");
  doc.roundedRect(
    margin + boxW + colGap,
    boxTop,
    boxW,
    boxH,
    1.5,
    1.5,
    "FD",
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("VENDOR", margin + boxPad, boxTop + 4.5);
  doc.text("BILL SUMMARY", margin + boxW + colGap + boxPad, boxTop + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  drawWrapped(doc, vendorLines, margin + boxPad, boxTop + 9, textMaxW, lineH);
  drawWrapped(
    doc,
    summaryLines,
    margin + boxW + colGap + boxPad,
    boxTop + 9,
    textMaxW,
    lineH,
  );

  y = boxTop + boxH + 8;

  autoTable(doc, {
    startY: y,
    head: [["#", "Item / Description", "HSN", "Qty", "Rate", "GST%", "Amount"]],
    body: bill.lines.map((line, index) => [
      String(index + 1),
      line.description + (line.sku ? `\nSKU: ${line.sku}` : ""),
      line.hsn || "-",
      String(line.quantity),
      money(line.unitPrice),
      `${line.gstRate}%`,
      money(line.amount),
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: { top: 2.2, right: 2, bottom: 2.2, left: 2 },
      valign: "middle",
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 62 },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 12, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
      5: { cellWidth: 16, halign: "right" },
      6: { cellWidth: 34, halign: "right" },
    },
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
  });

  const tableEnd =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y + 40;

  let totalsY = tableEnd + 8;
  const totalsW = 78;
  const totalsX = pageWidth - margin - totalsW;

  const totals: Array<[string, string, boolean?]> = [
    ["Subtotal", money(bill.subtotal)],
    ["Discount", money(bill.discountAmount)],
    ["CGST", money(bill.cgstAmount)],
    ["SGST", money(bill.sgstAmount)],
    ["IGST", money(bill.igstAmount)],
    ["Freight", money(bill.freightAmount)],
    ["Other charges", money(bill.otherCharges)],
    ["Round off", money(bill.roundOff)],
  ];

  doc.setFontSize(8.5);
  for (const [label, value] of totals) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(label, totalsX, totalsY);
    doc.setTextColor(30, 41, 59);
    doc.text(value, pageWidth - margin, totalsY, { align: "right" });
    totalsY += 4.8;
  }

  totalsY += 1;
  doc.setFillColor(30, 64, 175);
  doc.roundedRect(totalsX - 2, totalsY - 4, totalsW + 2, 10, 1.2, 1.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("Grand total", totalsX, totalsY + 2.2);
  doc.text(money(bill.totalAmount), pageWidth - margin, totalsY + 2.2, {
    align: "right",
  });

  if (bill.notes) {
    totalsY += 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("NOTES", margin, totalsY);
    totalsY += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const notes = doc.splitTextToSize(bill.notes, contentWidth) as string[];
    doc.text(notes, margin, totalsY);
  }

  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated by CommerceOS  |  ${buyer.brand}  |  ${new Date().toLocaleString("en-IN")}`,
    margin,
    footerY,
  );
  doc.text("Page 1 of 1", pageWidth - margin, footerY, { align: "right" });

  return doc;
}

function pdfBlob(doc: jsPDF) {
  return new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
}

async function fetchBuyerProfile(): Promise<BusinessProfile | null> {
  try {
    const response = await fetch("/api/v1/settings/business");
    const payload = await safeResponseJson(response);
    if (payload.success) {
      return payload.data as BusinessProfile;
    }
  } catch {
    // Fall back to demo identity in PDF.
  }
  return null;
}

/**
 * View / print must not fall back to download.
 * Note: window.open(..., "noopener") returns null in Chromium — that was
 * incorrectly triggering doc.save().
 */
export async function openPurchaseBillPdf(
  bill: PurchaseBill,
  vendor: Vendor | null | undefined,
  action: BillPdfAction = "view",
) {
  const filename = `${bill.billNumber}.pdf`;

  // Open blank tab synchronously while still inside the click gesture
  // (before any await) so Chromium does not block the popup.
  const popup =
    action === "view" ? window.open("about:blank", "_blank") : null;

  const buyerProfile = await fetchBuyerProfile();

  if (action === "download") {
    buildPurchaseBillPdf(bill, vendor, buyerProfile).save(filename);
    return;
  }

  const doc = buildPurchaseBillPdf(bill, vendor, buyerProfile);
  const url = URL.createObjectURL(pdfBlob(doc));

  if (action === "view") {
    if (popup) {
      popup.location.href = url;
    } else {
      // Popup blocked — same-tab navigate to the blob (still not a download).
      window.location.assign(url);
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return;
  }

  // Print via hidden iframe so the browser print dialog opens inline.
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", `Print ${bill.billNumber}`);
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = url;
  document.body.appendChild(iframe);

  const cleanup = () => {
    iframe.remove();
    URL.revokeObjectURL(url);
  };

  iframe.onload = () => {
    window.setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        const tab = window.open(url, "_blank");
        if (tab) {
          window.setTimeout(() => {
            try {
              tab.focus();
              tab.print();
            } catch {
              // User can print from the opened tab.
            }
          }, 500);
        }
      }
      // Keep iframe briefly so the print dialog can read it.
      window.setTimeout(cleanup, 60_000);
    }, 250);
  };
}

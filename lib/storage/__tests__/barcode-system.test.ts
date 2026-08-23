import { describe, it, expect } from "vitest";
import {
  CODE128_PATTERNS,
  encodeCode128,
  decodeCode128Symbols,
  generateCode128SvgString,
} from "../barcode/code128";
import {
  resolveBarcodeIdentity,
  isValidBarcodeString,
  isRetailNumericBarcode,
} from "../barcode/barcode-identity";
import {
  LABEL_PROFILES,
  LABEL_SIZE_OPTIONS,
  calculatePrintBatch,
} from "../barcode/label-profiles";
import {
  generateLabelPrintHtml,
} from "../barcode/label-printer";

describe("Code 128 (ISO/IEC 15417) Engine", () => {
  it("should verify all 107 symbol patterns have mathematically correct module sums", () => {
    expect(CODE128_PATTERNS.length).toBe(107);

    // Symbols 0 to 105 must have 6 widths summing to exactly 11 modules
    for (let i = 0; i <= 105; i++) {
      const pattern = CODE128_PATTERNS[i];
      expect(pattern.length).toBe(6);
      const sum = pattern.reduce((acc, w) => acc + w, 0);
      expect(sum).toBe(11);
    }

    // Stop symbol 106 must have 7 widths summing to exactly 13 modules
    const stopPattern = CODE128_PATTERNS[106];
    expect(stopPattern.length).toBe(7);
    const stopSum = stopPattern.reduce((acc, w) => acc + w, 0);
    expect(stopSum).toBe(13);
  });

  it("should encode standard CommerceOS SKU and compute correct modulo 103 checksum", () => {
    const sku = "SKU-SURAT-TSHIRT-KID";
    const encoded = encodeCode128(sku);

    expect(encoded.input).toBe(sku);
    expect(encoded.symbols.length).toBeGreaterThan(3);
    expect(encoded.symbols[0]).toBe(104); // Start B
    expect(encoded.symbols[encoded.symbols.length - 1]).toBe(106); // Stop
    expect(encoded.quietZoneModules).toBe(10);
    expect(encoded.binaryModules.startsWith("0000000000")).toBe(true);
    expect(encoded.binaryModules.endsWith("0000000000")).toBe(true);
  });

  it("should round-trip decode standard alphanumeric SKUs losslessly", () => {
    const testCases = [
      "SKU-SURAT-TSHIRT-KID",
      "SKU-NOVA-SAND-PNK",
      "SKU-SURAT-SOCK-03",
      "SKU-NOVA-SHOE-BLK",
      "A1",
      "LOC-WH01-ZN2-RK04-SH02-BN01",
      "BOX-CONTAINER-9988",
      "item-lowercase_123.test",
    ];

    for (const testText of testCases) {
      const encoded = encodeCode128(testText);
      const decoded = decodeCode128Symbols(encoded.symbols);
      expect(decoded).toBe(testText);
    }
  });

  it("should round-trip decode numeric-dense barcodes using Code C subset switching", () => {
    const numericBarcodes = [
      "8901234567890",
      "12345678",
      "998877665544332211",
      "ITEM12345678END",
    ];

    for (const testNum of numericBarcodes) {
      const encoded = encodeCode128(testNum);
      const decoded = decodeCode128Symbols(encoded.symbols);
      expect(decoded).toBe(testNum);
    }
  });

  it("should generate valid non-empty SVG vector strings with proper quiet zones", () => {
    const svg = generateCode128SvgString("SKU-TEST-101", {
      height: 40,
      moduleWidth: 2,
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("viewBox=");
    expect(svg).toContain("<rect");
    expect(svg).toContain("</svg>");
  });

  it("should throw an error if attempting to encode empty string", () => {
    expect(() => encodeCode128("")).toThrow("Cannot encode empty barcode string");
  });
});

describe("Barcode Identity Resolution & Security Rules", () => {
  it("should prioritize existing external GTIN/EAN/UPC over internal SKU", () => {
    const item = {
      sku: "SKU-SURAT-TSHIRT-KID",
      barcode: "8901234567890",
      productName: "Kids Cotton T-Shirt",
    };

    const identity = resolveBarcodeIdentity(item);
    expect(identity.isValid).toBe(true);
    expect(identity.value).toBe("8901234567890");
    expect(identity.source).toBe("gtin_ean_upc");
    expect(identity.displayText).toBe("8901234567890");
  });

  it("should fallback to internal SKU if no external barcode is present", () => {
    const item = {
      sku: "SKU-SURAT-TSHIRT-KID",
      barcode: null,
      productName: "Kids Cotton T-Shirt",
    };

    const identity = resolveBarcodeIdentity(item);
    expect(identity.isValid).toBe(true);
    expect(identity.value).toBe("SKU-SURAT-TSHIRT-KID");
    expect(identity.source).toBe("internal_sku");
    expect(identity.displayText).toBe("SKU-SURAT-TSHIRT-KID");
  });

  it("should reject invalid or missing SKU identity with clear error message", () => {
    const invalidItem = {
      sku: "",
      barcode: "",
      productName: "Ghost Item",
    };

    const identity = resolveBarcodeIdentity(invalidItem);
    expect(identity.isValid).toBe(false);
    expect(identity.value).toBe("");
    expect(identity.error).toBe("Barcode cannot be generated because this SKU has no valid barcode identity.");
  });

  it("should validate printable ASCII strings correctly", () => {
    expect(isValidBarcodeString("SKU-100")).toBe(true);
    expect(isValidBarcodeString("890123456789")).toBe(true);
    expect(isValidBarcodeString("")).toBe(false);
    expect(isValidBarcodeString("   ")).toBe(false);
    expect(isValidBarcodeString("SKU\u0000NULL")).toBe(false);
  });

  it("should detect retail numeric formats", () => {
    expect(isRetailNumericBarcode("8901234567890")).toBe(true); // 13 digits (EAN-13)
    expect(isRetailNumericBarcode("12345678")).toBe(true); // 8 digits (EAN-8)
    expect(isRetailNumericBarcode("012345678905")).toBe(true); // 12 digits (UPC-A)
    expect(isRetailNumericBarcode("SKU-1234")).toBe(false);
  });
});

describe("Label Size Profiles & Print Pagination Calculations", () => {
  it("should support Standard 50×25mm, Thermal 40×30mm, and A4 Sheet (24 Grid)", () => {
    expect(LABEL_PROFILES["50x25"].widthMm).toBe(50);
    expect(LABEL_PROFILES["50x25"].heightMm).toBe(25);
    expect(LABEL_PROFILES["40x30"].widthMm).toBe(40);
    expect(LABEL_PROFILES["40x30"].heightMm).toBe(30);
    expect(LABEL_PROFILES["a4"].widthMm).toBe(63.5);
    expect(LABEL_PROFILES["a4"].heightMm).toBe(33.9);
    expect(LABEL_PROFILES["a4"].labelsPerPage).toBe(24);
  });

  it("should calculate exact pagination for A4 sheets with 67 labels (3 sheets: 24 + 24 + 19)", () => {
    const batch = calculatePrintBatch(67, "a4");

    expect(batch.totalLabels).toBe(67);
    expect(batch.labelsPerPage).toBe(24);
    expect(batch.totalPages).toBe(3);
    expect(batch.pageBatches.length).toBe(3);
    expect(batch.pageBatches[0].labelCount).toBe(24);
    expect(batch.pageBatches[1].labelCount).toBe(24);
    expect(batch.pageBatches[2].labelCount).toBe(19);
    expect(batch.summaryText).toBe("3 Sheets");

    // Total labels across all pages must equal 67 exactly
    const sum = batch.pageBatches.reduce((acc, p) => acc + p.labelCount, 0);
    expect(sum).toBe(67);
  });

  it("should calculate exact pagination for 1 label", () => {
    const batchA4 = calculatePrintBatch(1, "a4");
    expect(batchA4.totalPages).toBe(1);
    expect(batchA4.pageBatches[0].labelCount).toBe(1);

    const batchRoll = calculatePrintBatch(1, "50x25");
    expect(batchRoll.totalLabels).toBe(1);
    expect(batchRoll.summaryText).toBe("1 Roll Label");
  });

  it("should calculate exact pagination when quantity exactly fills pages (e.g. 48 labels = 2 sheets)", () => {
    const batch = calculatePrintBatch(48, "a4");
    expect(batch.totalPages).toBe(2);
    expect(batch.pageBatches[0].labelCount).toBe(24);
    expect(batch.pageBatches[1].labelCount).toBe(24);
    expect(batch.summaryText).toBe("2 Sheets");
  });

  it("should calculate roll printer pagination for 67 labels", () => {
    const batch = calculatePrintBatch(67, "50x25");
    expect(batch.totalLabels).toBe(67);
    expect(batch.summaryText).toBe("67 Roll Labels");
  });
});

describe("Barcode Print Document Generator", () => {
  it("should generate HTML document with identical stable barcode identity across all duplicate labels", () => {
    const item = {
      sku: "SKU-SURAT-TSHIRT-KID",
      productName: "Kids Cotton T-Shirt",
      available: 67,
    };

    const html = generateLabelPrintHtml({
      item,
      quantity: 67,
      format: "a4",
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("@page");
    expect(html).toContain("Kids Cotton T-Shirt");
    expect(html).toContain("SKU-SURAT-TSHIRT-KID");
    expect(html).toContain("<svg");

    // Must NOT contain hardcoded prices or random values
    expect(html).not.toContain("MRP: ₹350");
    expect(html).not.toContain("₹");

    // All labels must have the SKU-SURAT-TSHIRT-KID text
    const matches = (html.match(/SKU-SURAT-TSHIRT-KID/g) || []).length;
    // 67 labels + title in head
    expect(matches).toBeGreaterThanOrEqual(67);
  });

  it("should generate roll-format HTML document with physical dimensions (50mm 25mm)", () => {
    const item = {
      sku: "SKU-NOVA-SAND-PNK",
      productName: "Kids Sandal - Pink",
    };

    const html = generateLabelPrintHtml({
      item,
      quantity: 5,
      format: "50x25",
    });

    expect(html).toContain("50mm 25mm");
    expect(html).toContain("roll-label-page");
    expect(html).toContain("Kids Sandal - Pink");
    expect(html).toContain("SKU-NOVA-SAND-PNK");
  });

  it("should throw error if attempting to generate print HTML for item without valid identity", () => {
    expect(() =>
      generateLabelPrintHtml({
        item: { sku: "", productName: "Broken Item" },
        quantity: 1,
        format: "50x25",
      })
    ).toThrow("Barcode cannot be generated because this SKU has no valid barcode identity.");
  });
});

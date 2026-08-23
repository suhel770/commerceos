/**
 * CommerceOS Core Platform Foundation (CPF) V1
 * Universal Barcode Platform (BarcodePlatform)
 * Centralized service consumed by Warehouse, Orders, Inventory, Products.
 */

export type BarcodeTarget =
  | "sku"
  | "location"
  | "rack"
  | "shelf"
  | "bin"
  | "warehouse"
  | "carton"
  | "pallet";

export type BarcodeFormat = "CODE128" | "QR" | "GS1_128" | "SSCC_18" | "RFID_NFC";

export type GeneratedBarcodeTag = {
  target: BarcodeTarget;
  codeString: string;
  format: BarcodeFormat;
  humanReadableText: string;
  metadata?: Record<string, any>;
};

import { generateCode128SvgString } from "@/lib/storage/barcode/code128";

class BarcodePlatformEngine {
  public generateLocationTag(
    whCode: string,
    zone: string,
    rack: string,
    shelf: string,
    bin: string,
  ): GeneratedBarcodeTag {
    const code = `LOC-${whCode}-${zone}-${rack}-${shelf}-${bin}`.toUpperCase();
    return {
      target: "bin",
      codeString: code,
      format: "CODE128",
      humanReadableText: `Bin ${rack}-${shelf}-${bin} (${zone})`,
    };
  }

  public generateSkuTag(sku: string, barcodeType: BarcodeFormat = "CODE128"): GeneratedBarcodeTag {
    return {
      target: "sku",
      codeString: sku.toUpperCase(),
      format: barcodeType,
      humanReadableText: sku.toUpperCase(),
    };
  }

  public generateBarcodeSvg(value: string, format: BarcodeFormat = "CODE128", height = 50, moduleWidth = 2): string {
    if (format === "CODE128") {
      return generateCode128SvgString(value, { height, moduleWidth });
    }
    return generateCode128SvgString(value, { height, moduleWidth });
  }
}

export const barcodePlatform = new BarcodePlatformEngine();

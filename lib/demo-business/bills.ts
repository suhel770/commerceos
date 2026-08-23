import type {
  PaymentMethod,
  PaymentStatus,
  PurchaseBill,
  PurchaseType,
} from "@/lib/purchase/types";

import { DEMO_PACKAGING, DEMO_SELLABLE, productsForVendor } from "./catalog";
import { createSeededRng, DEMO_ANCHOR_DATE } from "./ids";
import { addDays, buildBill, type DraftLine } from "./totals";
import { vendorById } from "./vendors";

const rng = createSeededRng(0x5a71de01);

function dateInMonth(year: number, month0: number, day: number): string {
  const dim = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const d = Math.min(day, dim);
  return `${year}-${String(month0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function pickSellableSlice(vendorId: string, count: number, offset: number) {
  const pool = productsForVendor(vendorId).filter(
    (p) => p.productType !== "packaging",
  );
  if (pool.length === 0) return [] as typeof DEMO_SELLABLE;
  const out = [];
  for (let i = 0; i < count; i += 1) {
    out.push(pool[(offset + i) % pool.length]!);
  }
  return out;
}

function lineFromProduct(
  product?: (typeof DEMO_SELLABLE)[number],
  quantity = 1,
  unitPrice?: number,
  qtyDamaged = 0,
): DraftLine {
  if (!product) {
    return {
      description: "Inventory Product",
      quantity,
      unitPrice: unitPrice ?? 0,
      gstRate: 18,
      qtyDamaged: 0,
    };
  }
  return {
    description: product.name,
    quantity,
    unitPrice: unitPrice ?? product.pricing?.costPrice ?? 0,
    gstRate: product.gstRate ?? 12,
    sku: product.sku,
    hsn: product.hsn,
    productId: product.id,
    qtyDamaged: Math.min(Math.max(0, qtyDamaged), quantity),
  };
}

function expenseLine(
  description: string,
  amount: number,
  gstRate: number,
  quantity = 1,
): DraftLine {
  return {
    description,
    quantity,
    unitPrice: amount,
    gstRate,
  };
}

type MonthSpec = { year: number; month0: number; growth: number };

/** Jan 2026 → Jul 2025 anchor window (6+ months ending DEMO_ANCHOR_DATE). */
const MONTHS: MonthSpec[] = [
  { year: 2026, month0: 0, growth: 0.45 }, // Jan — soft start
  { year: 2026, month0: 1, growth: 0.55 }, // Feb
  { year: 2026, month0: 2, growth: 0.65 }, // Mar
  { year: 2026, month0: 3, growth: 0.75 }, // Apr
  { year: 2026, month0: 4, growth: 0.9 }, // May
  { year: 2026, month0: 5, growth: 1.05 }, // Jun
  { year: 2026, month0: 6, growth: 1.2 }, // Jul (to anchor)
];

function buildBills(): PurchaseBill[] {
  const bills: PurchaseBill[] = [];
  let billSeq = 1001;
  let invSeq = 5001;

  const push = (
    partial: Omit<Parameters<typeof buildBill>[0], "billNumber" | "id"> & {
      billNumber?: string;
    },
  ) => {
    const id = `bill-${billSeq}`;
    const billNumber = partial.billNumber ?? `BILL-${billSeq}`;
    bills.push(
      buildBill({
        ...partial,
        id,
        billNumber,
      }),
    );
    billSeq += 1;
  };

  const nextInv = (prefix: string) => {
    const value = `${prefix}-${invSeq}`;
    invSeq += 1;
    return value;
  };

  // One-time assets early in the story (Feb)
  const steel = vendorById("vnd-steelrack")!;
  push({
    vendor: steel,
    purchaseType: "asset",
    vendorInvoiceNumber: nextInv("SC"),
    billDate: "2026-02-08",
    dueDate: addDays("2026-02-08", steel.paymentTermsDays),
    lines: [
      expenseLine("Barcode label printer (desktop)", 12500, 18),
      expenseLine("4x6 thermal shipping printer", 9800, 18),
      expenseLine("USB barcode scanner", 2200, 18),
    ],
    freightAmount: 450,
    paymentMethod: "neft_rtgs",
    paymentStatus: "paid",
    status: "completed",
    billUploadName: "steelcart-assets-feb.pdf",
    notes: "Warehouse packing station setup",
  });

  push({
    vendor: steel,
    purchaseType: "asset",
    vendorInvoiceNumber: nextInv("SC"),
    billDate: "2026-03-12",
    dueDate: addDays("2026-03-12", steel.paymentTermsDays),
    lines: [
      expenseLine("Boltless rack 5-tier (set of 4)", 18600, 18),
      expenseLine("Packing table with under-shelf", 7400, 18),
    ],
    freightAmount: 1200,
    paymentMethod: "credit",
    paymentStatus: "paid",
    status: "completed",
    billUploadName: "steelcart-racks-mar.pdf",
  });

  push({
    vendor: vendorById("vnd-officemart")!,
    purchaseType: "asset",
    vendorInvoiceNumber: nextInv("OM"),
    billDate: "2026-04-04",
    lines: [expenseLine("Lenovo IdeaPad 15 (ops laptop)", 42990, 18)],
    paymentMethod: "card",
    paymentStatus: "paid",
    status: "completed",
    billUploadName: "officemart-laptop.pdf",
  });

  for (const month of MONTHS) {
    const { year, month0, growth } = month;

    // Rent
    push({
      vendor: vendorById("vnd-landlord")!,
      purchaseType: "rent",
      vendorInvoiceNumber: nextInv("RENT"),
      billDate: dateInMonth(year, month0, 1),
      lines: [
        expenseLine(
          `Warehouse rent — Bhiwandi unit (${year}-${month0 + 1})`,
          Math.round(42000 * Math.min(growth, 1.1)),
          0,
        ),
      ],
      paymentMethod: "neft_rtgs",
      paymentStatus: "paid",
      status: "completed",
      billUploadName: `rent-${year}-${month0 + 1}.pdf`,
    });

    // Electricity
    push({
      vendor: vendorById("vnd-msedcl")!,
      purchaseType: "utilities",
      vendorInvoiceNumber: nextInv("MSE"),
      billDate: dateInMonth(year, month0, 8),
      lines: [
        expenseLine(
          "Commercial electricity — warehouse",
          Math.round(6200 + growth * 1800 + rng.int(0, 400)),
          18,
        ),
      ],
      paymentMethod: "upi",
      paymentStatus: "paid",
      status: "completed",
      billUploadName: `msedcl-${year}-${month0 + 1}.pdf`,
    });

    // Internet
    push({
      vendor: vendorById("vnd-airlink")!,
      purchaseType: "utilities",
      vendorInvoiceNumber: nextInv("AL"),
      billDate: dateInMonth(year, month0, 5),
      lines: [expenseLine("AirLink 300 Mbps enterprise", 1899, 18)],
      paymentMethod: "upi",
      paymentStatus: "paid",
      status: "completed",
    });

    // Software
    push({
      vendor: vendorById("vnd-billbooks")!,
      purchaseType: "software",
      vendorInvoiceNumber: nextInv("LDG"),
      billDate: dateInMonth(year, month0, 3),
      lines: [expenseLine("Ledgerly Growth plan (monthly)", 2499, 18)],
      paymentMethod: "card",
      paymentStatus: "paid",
      status: "completed",
    });

    // Courier recharge (1–2 / month)
    const ship = vendorById("vnd-shipfast")!;
    const courierCount = growth > 0.9 ? 2 : 1;
    for (let c = 0; c < courierCount; c += 1) {
      push({
        vendor: ship,
        purchaseType: "courier",
        vendorInvoiceNumber: nextInv("SF"),
        billDate: dateInMonth(year, month0, 10 + c * 12),
        lines: [
          expenseLine(
            "Courier wallet recharge",
            Math.round(12000 * growth + c * 2500),
            18,
          ),
        ],
        paymentMethod: "upi",
        paymentStatus: "paid",
        status: "completed",
        billUploadName: `shipfast-${year}-${month0 + 1}-${c + 1}.pdf`,
      });
    }

    // Marketing
    push({
      vendor: vendorById("vnd-meta-ads")!,
      purchaseType: "marketing",
      vendorInvoiceNumber: nextInv("PR"),
      billDate: dateInMonth(year, month0, 14),
      dueDate: addDays(dateInMonth(year, month0, 14), 7),
      lines: [
        expenseLine(
          "Meta ads media spend",
          Math.round(18000 * growth),
          18,
        ),
        expenseLine("Creative management fee", 5000, 18),
      ],
      paymentMethod: month0 >= 5 ? "credit" : "neft_rtgs",
      paymentStatus: month0 === 6 ? "partial" : "paid",
      status: month0 === 6 ? "ordered" : "completed",
      billUploadName: `pixelreach-${year}-${month0 + 1}.pdf`,
    });

    if (growth >= 0.75) {
      push({
        vendor: vendorById("vnd-searchads")!,
        purchaseType: "marketing",
        vendorInvoiceNumber: nextInv("CN"),
        billDate: dateInMonth(year, month0, 18),
        lines: [
          expenseLine(
            "Google Ads managed spend",
            Math.round(14000 * growth),
            18,
          ),
        ],
        paymentMethod: "neft_rtgs",
        paymentStatus: "paid",
        status: "completed",
      });
    }

    // CA quarterly-ish
    if (month0 === 2 || month0 === 5) {
      push({
        vendor: vendorById("vnd-ca-firm")!,
        purchaseType: "professional_fees",
        vendorInvoiceNumber: nextInv("SA"),
        billDate: dateInMonth(year, month0, 22),
        dueDate: addDays(dateInMonth(year, month0, 22), 15),
        lines: [
          expenseLine("GST return filing & books review", 8500, 18),
        ],
        paymentMethod: "neft_rtgs",
        paymentStatus: month0 === 5 ? "unpaid" : "paid",
        status: month0 === 5 ? "ordered" : "completed",
      });
    }

    // Office supplies
    push({
      vendor: vendorById("vnd-officemart")!,
      purchaseType: "office_expense",
      vendorInvoiceNumber: nextInv("OM"),
      billDate: dateInMonth(year, month0, 11),
      lines: [
        expenseLine("A4 paper ream (box of 5)", 1450, 18),
        expenseLine("Stationery & packing markers", 680, 18),
        expenseLine("Ink cartridge set", 2100, 18),
      ],
      discountAmount: 100,
      paymentMethod: rng.pick(["upi", "cash", "card"] as PaymentMethod[]),
      paymentStatus: "paid",
      status: "completed",
    });

    // Packaging POs
    const packVendor = vendorById("vnd-packright")!;
    const polyVendor = vendorById("vnd-polywrap")!;
    const labelVendor = vendorById("vnd-labelmark")!;
    const packQty = Math.round(200 * growth);
    const boxM = DEMO_PACKAGING.find((p) => p.sku.includes("BOX-M"))!;
    const boxL = DEMO_PACKAGING.find((p) => p.sku.includes("BOX-L"))!;
    const poly = DEMO_PACKAGING.find((p) => p.sku.includes("POLY"))!;
    const tape = DEMO_PACKAGING.find((p) => p.sku.includes("TAPE"))!;
    const labels = DEMO_PACKAGING.find((p) => p.sku.includes("LABEL"))!;

    push({
      vendor: packVendor,
      purchaseType: "packaging_material",
      vendorInvoiceNumber: nextInv("PK"),
      billDate: dateInMonth(year, month0, 7),
      dueDate: addDays(dateInMonth(year, month0, 7), packVendor.paymentTermsDays),
      lines: [
        lineFromProduct(boxM, packQty, undefined, month0 >= 4 ? 4 : 0),
        lineFromProduct(boxL, Math.round(packQty * 0.45)),
      ],
      freightAmount: 350,
      paymentMethod: "credit",
      paymentStatus: month0 === 6 ? "unpaid" : "paid",
      status: month0 === 6 ? "ordered" : "completed",
      billUploadName: `packright-${year}-${month0 + 1}.pdf`,
    });

    push({
      vendor: polyVendor,
      purchaseType: "packaging_material",
      vendorInvoiceNumber: nextInv("PW"),
      billDate: dateInMonth(year, month0, 9),
      dueDate: addDays(dateInMonth(year, month0, 9), polyVendor.paymentTermsDays),
      lines: [
        lineFromProduct(
          poly,
          Math.round(800 * growth),
          undefined,
          month0 === 5 ? 12 : 0,
        ),
        lineFromProduct(tape, Math.max(6, Math.round(8 * growth))),
      ],
      freightAmount: 600,
      discountAmount: growth > 1 ? 200 : 0,
      paymentMethod: "neft_rtgs",
      paymentStatus: "paid",
      status: "completed",
    });

    if (month0 % 2 === 0) {
      push({
        vendor: labelVendor,
        purchaseType: "packaging_material",
        vendorInvoiceNumber: nextInv("LM"),
        billDate: dateInMonth(year, month0, 16),
        lines: [
          lineFromProduct(labels, Math.max(2, Math.round(3 * growth))),
          expenseLine("Custom brand sticker sheets", 1800, 18, 2),
        ],
        paymentMethod: "upi",
        paymentStatus: "paid",
        status: "completed",
      });
    }

    // Inventory purchases — 2–4 per month growing
    const invRounds = growth < 0.7 ? 2 : growth < 1 ? 3 : 4;
    const invVendors = [
      "vnd-nova-footwear",
      "vnd-agrasole",
      "vnd-suratex",
      "vnd-raincraft",
    ] as const;

    for (let r = 0; r < invRounds; r += 1) {
      const vendorId = invVendors[(month0 + r) % invVendors.length]!;
      const vendor = vendorById(vendorId)!;
      const lineCount = 3 + (r % 3);
      const products = pickSellableSlice(
        vendorId,
        lineCount,
        month0 * 7 + r * 3,
      );
      const costBump = month0 >= 5 ? 1.04 : month0 >= 3 ? 1.02 : 1;
      const lines = products.map((product, idx) => {
        const qty = Math.round((40 + idx * 12) * growth);
        // Small purchase-linked damage on later months / first line — for Stock page demos.
        const qtyDamaged =
          month0 >= 4 && idx === 0
            ? Math.min(3, Math.max(1, Math.round(qty * 0.03)))
            : month0 >= 6 && idx === 1
              ? 2
              : 0;
        return lineFromProduct(
          product,
          qty,
          Number((product.pricing.costPrice * costBump).toFixed(2)),
          qtyDamaged,
        );
      });

      const payRoll = rng.next();
      let paymentStatus: PaymentStatus = "paid";
      let paymentMethod: PaymentMethod = "neft_rtgs";
      let status: PurchaseBill["status"] = "completed";
      if (month0 === 6 && r === invRounds - 1) {
        paymentStatus = "unpaid";
        paymentMethod = "credit";
        status = "ordered";
      } else if (payRoll > 0.88) {
        paymentStatus = "partial";
        paymentMethod = "credit";
        status = "completed";
      } else if (payRoll > 0.7) {
        paymentMethod = "upi";
      }

      push({
        vendor,
        purchaseType: "inventory_product",
        vendorInvoiceNumber: nextInv("INV"),
        billDate: dateInMonth(year, month0, 4 + r * 6),
        dueDate: addDays(
          dateInMonth(year, month0, 4 + r * 6),
          vendor.paymentTermsDays,
        ),
        lines,
        freightAmount: rng.int(200, 900),
        discountAmount: r === 0 && growth > 0.9 ? 500 : 0,
        paymentMethod,
        paymentStatus,
        status,
        billUploadName: `${vendorId}-${year}-${month0 + 1}-r${r + 1}.pdf`,
        notes:
          r === 0
            ? "Core replenishment for marketplace SKUs"
            : "Top-up against sell-through",
      });
    }

    // Misc / service
    if (month0 === 3) {
      push({
        vendor: vendorById("vnd-officemart")!,
        purchaseType: "other",
        vendorInvoiceNumber: nextInv("OM"),
        billDate: dateInMonth(year, month0, 25),
        lines: [expenseLine("Pest control + deep clean (warehouse)", 4500, 18)],
        paymentMethod: "cash",
        paymentStatus: "paid",
        status: "completed",
      });
    }

    if (month0 === 6) {
      push({
        vendor: vendorById("vnd-ca-firm")!,
        purchaseType: "service",
        vendorInvoiceNumber: nextInv("SA"),
        billDate: dateInMonth(year, month0, 20),
        dueDate: addDays(dateInMonth(year, month0, 20), 15),
        lines: [expenseLine("Advisory — ITC reconciliation", 6000, 18)],
        paymentMethod: "credit",
        paymentStatus: "unpaid",
        status: "ordered",
      });
    }
  }

  // Ensure last bill date does not exceed anchor
  const filteredBills = bills
    .filter((bill) => bill.billDate <= DEMO_ANCHOR_DATE)
    .sort((a, b) => b.billDate.localeCompare(a.billDate));

  // Add 5 more line items specifically to BILL-1097
  const bill1097 = filteredBills.find((b) => b.billNumber === "BILL-1097");
  if (bill1097) {
    const extraProducts = DEMO_SELLABLE.slice(5, 10);
    const extraLines: DraftLine[] = extraProducts.map((prod, idx) => ({
      description: prod.name,
      quantity: 35 + (idx + 1) * 12,
      unitPrice: prod.pricing.costPrice,
      gstRate: prod.gstRate ?? 12,
      sku: prod.sku,
      hsn: prod.hsn,
      productId: prod.id,
      qtyDamaged: 0,
    }));

    const existingLines: DraftLine[] = bill1097.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      gstRate: l.gstRate,
      sku: l.sku,
      hsn: l.hsn,
      productId: l.productId,
      qtyDamaged: l.qtyDamaged ?? 0,
      uom: l.uom,
    }));

    const updatedBill = buildBill({
      id: bill1097.id,
      billNumber: bill1097.billNumber,
      vendorInvoiceNumber: bill1097.vendorInvoiceNumber ?? bill1097.billNumber,
      vendor: vendorById(bill1097.vendorId)!,
      purchaseType: bill1097.purchaseType,
      billDate: bill1097.billDate,
      dueDate: bill1097.dueDate,
      lines: [...existingLines, ...extraLines],
      discountAmount: bill1097.discountAmount,
      freightAmount: bill1097.freightAmount,
      otherCharges: bill1097.otherCharges,
      status: bill1097.status,
      paymentStatus: bill1097.paymentStatus,
      paymentMethod: bill1097.paymentMethod,
      notes: bill1097.notes,
      billUploadName: bill1097.billUploadName,
      createdAt: bill1097.createdAt,
    });

    const index = filteredBills.findIndex((b) => b.billNumber === "BILL-1097");
    if (index !== -1) {
      filteredBills[index] = updatedBill;
    }
  }

  return filteredBills;
}

export const DEMO_BILLS: PurchaseBill[] = [];

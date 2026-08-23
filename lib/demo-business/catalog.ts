import type { Product } from "@/lib/types/product";

import { DEMO_BUSINESS } from "./business";
import { DEMO_ORG_ID } from "./ids";

type FamilyDef = {
  code: string;
  name: string;
  category: string;
  subCategory: string;
  vendorId: string;
  hsn: string;
  gstRate: number;
  baseCost: number;
  baseMrp: number;
  baseSell: number;
  colors: string[];
  sizes: string[];
  weightGrams: number;
  dimensionsCm: { l: number; w: number; h: number };
  /** packaging vs sellable */
  kind: "sellable" | "packaging";
};

const FAMILIES: FamilyDef[] = [
  {
    code: "DINO",
    name: "Dino Clog",
    category: "Kids Footwear",
    subCategory: "Clogs",
    vendorId: "vnd-nova-footwear",
    hsn: "64029990",
    gstRate: 12,
    baseCost: 185,
    baseMrp: 699,
    baseSell: 449,
    colors: ["Blue", "Red", "Green", "Yellow", "Purple"],
    sizes: ["UK5", "UK6", "UK7", "UK8", "UK9", "UK10"],
    weightGrams: 320,
    dimensionsCm: { l: 22, w: 12, h: 10 },
    kind: "sellable",
  },
  {
    code: "ROCKET",
    name: "Rocket Sandal",
    category: "Kids Footwear",
    subCategory: "Sandals",
    vendorId: "vnd-nova-footwear",
    hsn: "64029990",
    gstRate: 12,
    baseCost: 210,
    baseMrp: 799,
    baseSell: 499,
    colors: ["Navy", "Orange", "Black", "Teal"],
    sizes: ["UK6", "UK7", "UK8", "UK9", "UK10"],
    weightGrams: 280,
    dimensionsCm: { l: 24, w: 11, h: 8 },
    kind: "sellable",
  },
  {
    code: "SOFTIE",
    name: "Softie Slipper",
    category: "Kids Footwear",
    subCategory: "Slippers",
    vendorId: "vnd-nova-footwear",
    hsn: "64041990",
    gstRate: 12,
    baseCost: 95,
    baseMrp: 399,
    baseSell: 249,
    colors: ["Pink", "Mint", "Grey", "Lilac"],
    sizes: ["UK5", "UK6", "UK7", "UK8"],
    weightGrams: 180,
    dimensionsCm: { l: 20, w: 10, h: 6 },
    kind: "sellable",
  },
  {
    code: "BLOOM",
    name: "Bloom Flat",
    category: "Women's Footwear",
    subCategory: "Flats",
    vendorId: "vnd-agrasole",
    hsn: "64039990",
    gstRate: 12,
    baseCost: 240,
    baseMrp: 999,
    baseSell: 649,
    colors: ["Beige", "Black", "Maroon", "Gold"],
    sizes: ["UK4", "UK5", "UK6", "UK7", "UK8"],
    weightGrams: 350,
    dimensionsCm: { l: 26, w: 10, h: 9 },
    kind: "sellable",
  },
  {
    code: "COZY",
    name: "Cozy House Slipper",
    category: "Women's Footwear",
    subCategory: "Slippers",
    vendorId: "vnd-agrasole",
    hsn: "64041990",
    gstRate: 12,
    baseCost: 120,
    baseMrp: 499,
    baseSell: 299,
    colors: ["Rose", "Brown", "Ivory", "Wine"],
    sizes: ["UK5", "UK6", "UK7", "UK8"],
    weightGrams: 220,
    dimensionsCm: { l: 25, w: 11, h: 7 },
    kind: "sellable",
  },
  {
    code: "STRIDE",
    name: "Stride Everyday Sandal",
    category: "Women's Footwear",
    subCategory: "Sandals",
    vendorId: "vnd-agrasole",
    hsn: "64029990",
    gstRate: 12,
    baseCost: 260,
    baseMrp: 1099,
    baseSell: 699,
    colors: ["Tan", "Black", "Olive"],
    sizes: ["UK4", "UK5", "UK6", "UK7", "UK8", "UK9"],
    weightGrams: 380,
    dimensionsCm: { l: 27, w: 11, h: 9 },
    kind: "sellable",
  },
  {
    code: "ANKLE",
    name: "Ankle Soft Sock",
    category: "Socks",
    subCategory: "Ankle",
    vendorId: "vnd-suratex",
    hsn: "61159500",
    gstRate: 5,
    baseCost: 28,
    baseMrp: 149,
    baseSell: 89,
    colors: ["White", "Black", "Grey", "Navy"],
    sizes: ["Free"],
    weightGrams: 45,
    dimensionsCm: { l: 18, w: 10, h: 2 },
    kind: "sellable",
  },
  {
    code: "CREW",
    name: "Crew Cotton Sock",
    category: "Socks",
    subCategory: "Crew",
    vendorId: "vnd-suratex",
    hsn: "61159500",
    gstRate: 5,
    baseCost: 35,
    baseMrp: 179,
    baseSell: 109,
    colors: ["White", "Black", "Assorted"],
    sizes: ["Free"],
    weightGrams: 55,
    dimensionsCm: { l: 20, w: 10, h: 2 },
    kind: "sellable",
  },
  {
    code: "PONCHO",
    name: "Rain Poncho Kids",
    category: "Rainwear",
    subCategory: "Poncho",
    vendorId: "vnd-raincraft",
    hsn: "39262099",
    gstRate: 18,
    baseCost: 85,
    baseMrp: 399,
    baseSell: 249,
    colors: ["Yellow", "Blue", "Clear"],
    sizes: ["S", "M", "L"],
    weightGrams: 160,
    dimensionsCm: { l: 28, w: 20, h: 3 },
    kind: "sellable",
  },
  {
    code: "BOOTCV",
    name: "Shoe Cover Pair",
    category: "Accessories",
    subCategory: "Covers",
    vendorId: "vnd-raincraft",
    hsn: "39269099",
    gstRate: 18,
    baseCost: 22,
    baseMrp: 129,
    baseSell: 79,
    colors: ["Clear", "Blue"],
    sizes: ["Free"],
    weightGrams: 40,
    dimensionsCm: { l: 16, w: 12, h: 2 },
    kind: "sellable",
  },
  {
    code: "LACES",
    name: "Elastic No-Tie Lace",
    category: "Accessories",
    subCategory: "Laces",
    vendorId: "vnd-suratex",
    hsn: "56090090",
    gstRate: 12,
    baseCost: 12,
    baseMrp: 99,
    baseSell: 59,
    colors: ["Black", "White", "Neon"],
    sizes: ["Free"],
    weightGrams: 25,
    dimensionsCm: { l: 12, w: 8, h: 1 },
    kind: "sellable",
  },
  // Packaging materials (also catalog SKUs for purchase lines)
  {
    code: "BOX-M",
    name: "Corrugated Mailer Box M",
    category: "Packaging Materials",
    subCategory: "Cartons",
    vendorId: "vnd-packright",
    hsn: "48191010",
    gstRate: 18,
    baseCost: 14,
    baseMrp: 14,
    baseSell: 14,
    colors: ["Brown"],
    sizes: ["M"],
    weightGrams: 120,
    dimensionsCm: { l: 30, w: 20, h: 10 },
    kind: "packaging",
  },
  {
    code: "BOX-L",
    name: "Corrugated Mailer Box L",
    category: "Packaging Materials",
    subCategory: "Cartons",
    vendorId: "vnd-packright",
    hsn: "48191010",
    gstRate: 18,
    baseCost: 22,
    baseMrp: 22,
    baseSell: 22,
    colors: ["Brown"],
    sizes: ["L"],
    weightGrams: 180,
    dimensionsCm: { l: 40, w: 25, h: 12 },
    kind: "packaging",
  },
  {
    code: "POLY-M",
    name: "Courier Poly Bag M",
    category: "Packaging Materials",
    subCategory: "Poly Bags",
    vendorId: "vnd-polywrap",
    hsn: "39232100",
    gstRate: 18,
    baseCost: 3.5,
    baseMrp: 3.5,
    baseSell: 3.5,
    colors: ["Grey"],
    sizes: ["M"],
    weightGrams: 15,
    dimensionsCm: { l: 35, w: 25, h: 1 },
    kind: "packaging",
  },
  {
    code: "TAPE",
    name: "BOPP Packaging Tape 48mm",
    category: "Packaging Materials",
    subCategory: "Tape",
    vendorId: "vnd-polywrap",
    hsn: "39191000",
    gstRate: 18,
    baseCost: 42,
    baseMrp: 42,
    baseSell: 42,
    colors: ["Clear"],
    sizes: ["48mm"],
    weightGrams: 200,
    dimensionsCm: { l: 12, w: 12, h: 6 },
    kind: "packaging",
  },
  {
    code: "VOID",
    name: "Air Pillow Void Fill Pack",
    category: "Packaging Materials",
    subCategory: "Void Fill",
    vendorId: "vnd-polywrap",
    hsn: "39269099",
    gstRate: 18,
    baseCost: 280,
    baseMrp: 280,
    baseSell: 280,
    colors: ["Clear"],
    sizes: ["Bulk"],
    weightGrams: 900,
    dimensionsCm: { l: 40, w: 30, h: 20 },
    kind: "packaging",
  },
  {
    code: "LABEL-R",
    name: "Thermal Shipping Label Roll",
    category: "Packaging Materials",
    subCategory: "Labels",
    vendorId: "vnd-labelmark",
    hsn: "48211020",
    gstRate: 18,
    baseCost: 320,
    baseMrp: 320,
    baseSell: 320,
    colors: ["White"],
    sizes: ["100x150"],
    weightGrams: 700,
    dimensionsCm: { l: 15, w: 15, h: 10 },
    kind: "packaging",
  },
  {
    code: "CARE",
    name: "Care Instruction Sticker Sheet",
    category: "Packaging Materials",
    subCategory: "Labels",
    vendorId: "vnd-labelmark",
    hsn: "48211010",
    gstRate: 18,
    baseCost: 45,
    baseMrp: 45,
    baseSell: 45,
    colors: ["White"],
    sizes: ["A4"],
    weightGrams: 80,
    dimensionsCm: { l: 30, w: 21, h: 1 },
    kind: "sellable",
  },
];

function colorCode(color: string): string {
  return color.slice(0, 3).toUpperCase();
}

function buildCatalog(): Product[] {
  const products: Product[] = [];
  let seq = 1;

  for (const family of FAMILIES) {
    for (const color of family.colors) {
      for (const size of family.sizes) {
        const sku = `SK-${family.code}-${colorCode(color)}-${size}`;
        const id = `prod-${family.code.toLowerCase()}-${colorCode(color).toLowerCase()}-${size.toLowerCase()}`;
        const slug = sku.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const vendorSku = `V-${family.code}-${seq.toString().padStart(4, "0")}`;
        const barcode = `8901${(100000000 + seq).toString().slice(0, 9)}`;
        const cost = family.baseCost;
        const mrp = family.baseMrp;
        const sell = family.baseSell;
        const profit = sell - cost;
        const margin = sell > 0 ? Number(((profit / sell) * 100).toFixed(1)) : 0;

        products.push({
          id,
          slug,
          sku,
          name: `${DEMO_BUSINESS.brand} ${family.name} — ${color} / ${size}`,
          brand: DEMO_BUSINESS.brand,
          image: "",
          status: family.kind === "packaging" ? "Active" : "Active",
          vendorId: family.vendorId,
          vendorSku,
          barcode,
          color,
          size,
          variantLabel: `${color} / ${size}`,
          weightGrams: family.weightGrams,
          dimensionsCm: family.dimensionsCm,
          category: family.category,
          subCategory: family.subCategory,
          productType: family.kind === "packaging" ? "packaging" : "sellable",
          hsn: family.hsn,
          gstRate: family.gstRate,
          countryOfOrigin: "India",
          manufacturer: family.vendorId,
          shortDescription: `${family.name} for marketplace & D2C`,
          inventory: {
            available: 0,
            reserved: 0,
            incoming: 0,
            damaged: 0,
            inTransit: 0,
          },
          pricing: {
            costPrice: cost,
            sellingPrice: sell,
            mrp,
            profit,
            margin,
          },
          performance: {
            ordersToday: 0,
            revenueToday: 0,
            returnsPercentage: 0,
            healthScore: 0,
          },
          aiRecommendations: [],
          listings: [],
          createdAt: "2026-01-10T08:00:00.000Z",
          updatedAt: "2026-01-10T08:00:00.000Z",
          tags: [family.category, family.kind, DEMO_ORG_ID],
        });
        seq += 1;
      }
    }
  }

  return products;
}

export const DEMO_CATALOG: Product[] = [];

export const DEMO_SELLABLE: Product[] = [];

export const DEMO_PACKAGING: Product[] = [];

export function productById(id: string): Product | null {
  const found = DEMO_CATALOG.find((row) => row.id === id);
  return found ?? null;
}

export function productsForVendor(vendorId: string): Product[] {
  return [];
}

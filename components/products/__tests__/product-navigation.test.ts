import { describe, it, expect } from "vitest";
import { getProductSlug } from "@/lib/products/slug";

function isValidInternalCommerceOSRoute(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return false;
  if (trimmed.includes(":") || trimmed.toLowerCase().includes("javascript") || trimmed.toLowerCase().includes("data")) {
    return false;
  }
  return true;
}

function resolveReturnDestination(candidate?: string | null, storedSession?: string | null): string {
  if (candidate) {
    try {
      const decoded = decodeURIComponent(candidate);
      if (isValidInternalCommerceOSRoute(decoded)) {
        return decoded;
      }
    } catch {}
    if (isValidInternalCommerceOSRoute(candidate)) {
      return candidate;
    }
  }

  if (storedSession && isValidInternalCommerceOSRoute(storedSession)) {
    return storedSession;
  }

  return "/products/list";
}

function resolveProductName(product: { name?: string | null; sku?: string | null } | null | undefined): string {
  if (product && typeof product.name === "string" && product.name.trim().length > 0) {
    return product.name.trim();
  }
  if (product && typeof product.sku === "string" && product.sku.trim().length > 0) {
    return product.sku.trim();
  }
  return "Product";
}

describe("Product Workspace Return Navigation Resolution", () => {
  it("resolves /products/list from URL query parameter", () => {
    const from = "%2Fproducts%2Flist";
    expect(resolveReturnDestination(from)).toBe("/products/list");
  });

  it("resolves and preserves complex query parameters in from parameter", () => {
    const original = "/products/list?page=3&status=active&search=sandal";
    const encoded = encodeURIComponent(original);
    expect(resolveReturnDestination(encoded)).toBe(original);
  });

  it("resolves originating module routes such as /inventory and /orders", () => {
    expect(resolveReturnDestination("/inventory")).toBe("/inventory");
    expect(resolveReturnDestination("/orders?filter=unfulfilled")).toBe("/orders?filter=unfulfilled");
  });

  it("rejects malicious or external URLs and falls back to safe destination", () => {
    expect(resolveReturnDestination("https://google.com")).toBe("/products/list");
    expect(resolveReturnDestination("//malicious-site.com")).toBe("/products/list");
    expect(resolveReturnDestination("javascript:alert(1)")).toBe("/products/list");
  });

  it("falls back to stored sessionStorage when from is absent", () => {
    expect(resolveReturnDestination(null, "/products/list?page=2")).toBe("/products/list?page=2");
  });

  it("falls back to /products/list when both from and session are empty", () => {
    expect(resolveReturnDestination(null, null)).toBe("/products/list");
    expect(resolveReturnDestination("", "")).toBe("/products/list");
  });

  it("authoritatively resolves product name from record without undefined or placeholder objects", () => {
    expect(resolveProductName({ name: "Kids Sandal - Pink", sku: "SKU-NOVA-SAND-PNK" })).toBe("Kids Sandal - Pink");
    expect(resolveProductName({ name: "", sku: "SKU-NOVA-SAND-PNK" })).toBe("SKU-NOVA-SAND-PNK");
    expect(resolveProductName(null)).toBe("Product");
    expect(resolveProductName(undefined)).toBe("Product");
  });

  it("converts product names to clean SEO-friendly slug instead of raw database UUIDs", () => {
    expect(
      getProductSlug({
        id: "9a0330a2-6ee5-46cd-9df3-c831f79a62d1",
        name: "Kids Sports Shoe - Black",
        slug: "9a0330a2-6ee5-46cd-9df3-c831f79a62d1",
        sku: "SKU-NOVA-SHOE-BLK",
      })
    ).toBe("kids-sports-shoe-black");

    expect(
      getProductSlug({
        id: "2dafcfd0-7704-4f40-91e2-48c326442419",
        name: "Kids Sandal - Pink",
        slug: "2dafcfd0-7704-4f40-91e2-48c326442419",
        sku: "SKU-NOVA-SAND-PNK",
      })
    ).toBe("kids-sandal-pink");
  });
});

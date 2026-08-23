import { Product } from "@/lib/types/product";
import { safeResponseJson } from "./client";

export async function getProducts(): Promise<{ success: boolean; data: Product[] }> {
  try {
    const res = await fetch("/api/v1/products");
    const payload = await safeResponseJson(res);
    if (payload.success && Array.isArray(payload.data)) {
      return { success: true, data: payload.data };
    }
    if (Array.isArray(payload)) {
      return { success: true, data: payload };
    }
    return { success: true, data: [] };
  } catch {
    return { success: false, data: [] };
  }
}

export async function getProduct(
  id: string
): Promise<{ success: boolean; data?: Product }> {
  try {
    const res = await fetch(`/api/v1/products/${id}`);
    const payload = await safeResponseJson(res);
    return {
      success: Boolean(payload.success),
      data: payload?.data || undefined,
    };
  } catch {
    return { success: false, data: undefined };
  }
}
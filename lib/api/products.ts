import { products } from "@/lib/mocks/products";
import { Product } from "@/lib/types/product";
import { ApiResponse, api } from "./client";

export async function getProducts(): Promise<ApiResponse<Product[]>> {
  return api(async () => products);
}

export async function getProduct(
  id: string
): Promise<ApiResponse<Product | undefined>> {
  return api(async () =>
    products.find((p) => p.id === id)
  );
}
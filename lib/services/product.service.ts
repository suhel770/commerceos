import { getProducts, getProduct } from "@/lib/api/products";

export async function getAllProducts() {
  return await getProducts();
}

export async function getProductById(id: string) {
  return await getProduct(id);
}
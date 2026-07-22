import { Product } from "@/lib/types/product";
import {
  getProducts,
  getProduct,
} from "@/lib/api/products";

class ProductRepository {
  async findAll(): Promise<Product[]> {
    const response = await getProducts();

    if (!response.success) {
      throw new Error(response.message);
    }

    return response.data;
  }

  async findById(
    id: string
  ): Promise<Product | undefined> {
    const response = await getProduct(id);

    if (!response.success) {
      throw new Error(response.message);
    }

    return response.data;
  }
}

export const productRepository =
  new ProductRepository();
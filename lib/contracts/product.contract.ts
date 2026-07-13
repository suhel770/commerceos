import { Product } from "@/lib/types/product";

export interface GetProductsRequest {
  page: number;
  pageSize: number;

  search?: string;

  marketplace?: string;

  category?: string;

  status?: string;

  sortBy?: string;

  sortOrder?: "asc" | "desc";
}

export interface GetProductsResponse {
  items: Product[];

  totalItems: number;

  totalPages: number;

  currentPage: number;
}

export interface GetProductRequest {
  id: string;
}

export interface CreateProductRequest {
  product: Product;
}

export interface UpdateProductRequest {
  id: string;

  product: Partial<Product>;
}

export interface DeleteProductRequest {
  id: string;
}
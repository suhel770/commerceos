"use client";

import { Product } from "@/lib/types/product";
import ProductWorkspace from "../workspace/ProductWorkspace";


interface ProductPageProps {
  product: Product;
}

export default function ProductPage({
  product,
}: ProductPageProps) {
  return (
    <div className="space-y-4">

      <ProductWorkspace
        product={product}
      />

    </div>
  );
}
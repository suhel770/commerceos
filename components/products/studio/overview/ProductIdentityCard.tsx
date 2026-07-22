"use client";

import type { Product } from "@/lib/types/product";

import ProductIdentitySection from "./sections/ProductIdentitySection";

interface Props {
  product: Product;
}

export default function ProductIdentityCard({ product }: Props) {
  return <ProductIdentitySection product={product} />;
}

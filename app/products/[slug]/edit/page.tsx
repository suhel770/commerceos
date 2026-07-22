import { notFound } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import ProductStudio from "@/components/products/studio/ProductStudio";

import { products } from "@/lib/mocks/products";

interface EditProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { slug } = await params;

  const product = products.find(
    (p) => p.slug === slug
  );

  if (!product) {
    notFound();
  }

  return (
    <AppShell
      title={`Edit • ${product.name}`}
      subtitle="CommerceOS Product Studio"
    >
      <div className="mx-auto w-full max-w-[1800px] p-8">
        <ProductStudio product={product} />
      </div>
    </AppShell>
  );
}
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ProductPage from "@/components/products/page/ProductPage";
import { productRepository } from "@/lib/repositories/product.repository";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductDetailsPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;

  let product = await productRepository.findById(slug);
  if (!product) {
    product = await productRepository.findBySku(slug);
  }

  if (!product) {
    notFound();
  }

  return (
    <AppShell
      title={product.name}
      subtitle={`${product.category} • SKU: ${product.sku}`}
    >
      <div className="mx-auto w-full max-w-[1700px] p-6 lg:p-8">
        <ProductPage product={product} />
      </div>
    </AppShell>
  );
}
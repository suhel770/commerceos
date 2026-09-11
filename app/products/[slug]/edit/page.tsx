import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ProductStudio from "@/components/products/studio/ProductStudio";
import { StudioProvider } from "@/components/products/studio/context/StudioContext";
import { productRepository } from "@/lib/repositories/product.repository";

interface EditProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
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
      subtitle={`${product.category || "General"} • SKU: ${product.sku}`}
    >
      <div className="mx-auto w-full max-w-[1700px] px-6 py-2 lg:px-8 lg:py-2.5">
        <StudioProvider product={product}>
          <ProductStudio />
        </StudioProvider>
      </div>
    </AppShell>
  );
}

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
      title={`Edit • ${product.name}`}
      subtitle="CommerceOS Product Studio"
    >
      <div className="mx-auto w-full max-w-[1700px] p-6 lg:p-8">
        <StudioProvider product={product}>
          <ProductStudio />
        </StudioProvider>
      </div>
    </AppShell>
  );
}

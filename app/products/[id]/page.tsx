import { notFound } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import PageContainer from "@/components/ui/PageContainer";
import ProductWorkspace from "@/components/workspace/product/ProductWorkspace";

import { products } from "@/lib/data/products";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { id } = await params;

  const product = products.find(
    (p) => p.id === Number(id)
  );

  if (!product) {
    notFound();
  }

  return (
    <AppShell>
      <PageContainer>
        <ProductWorkspace product={product} />
      </PageContainer>
    </AppShell>
  );
}
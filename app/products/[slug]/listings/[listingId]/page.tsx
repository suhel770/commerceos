import { notFound } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import ListingWorkspace from "@/components/listings/ListingWorkspace";
import { productRepository } from "@/lib/repositories/product.repository";
import type { MarketplaceListing } from "@/lib/types/product";

interface ListingPageProps {
  params: Promise<{
    slug: string;
    listingId: string;
  }>;
}

export default async function ListingPage({
  params,
}: ListingPageProps) {
  const { slug, listingId } = await params;

  let product = await productRepository.findById(slug);
  if (!product) {
    product = await productRepository.findBySku(slug);
  }

  if (!product) {
    notFound();
  }

  const listing = product.listings?.find(
    (l: MarketplaceListing) => l.id === listingId,
  );

  if (!listing) {
    notFound();
  }

  return (
    <PageContainer>
      <ListingWorkspace
        product={product}
        listing={listing}
      />
    </PageContainer>
  );
}

import { notFound } from "next/navigation";

import PageContainer from "@/components/ui/PageContainer";
import ListingWorkspace from "@/components/listings/ListingWorkspace";

import { products } from "@/lib/mocks/products";

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

  const product = products.find(
    (p) => p.slug === slug
  );

  if (!product) {
    notFound();
  }

  const listing = product.listings.find(
    (l) => l.id === listingId
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

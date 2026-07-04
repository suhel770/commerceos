import { notFound } from "next/navigation";

import PageContainer from "@/components/ui/PageContainer";
import ListingWorkspace from "@/components/listings/ListingWorkspace";

import { listings } from "@/lib/data/listings";

interface ListingPageProps {
  params: Promise<{
    id: string;
    listingId: string;
  }>;
}

export default async function ListingPage({
  params,
}: ListingPageProps) {
  const { id, listingId } = await params;

  const listing = listings.find(
    (l) =>
      l.id === listingId &&
      l.productId === id
  );

  if (!listing) {
    notFound();
  }

  return (
    <PageContainer>
      <ListingWorkspace listing={listing} />
    </PageContainer>
  );
}
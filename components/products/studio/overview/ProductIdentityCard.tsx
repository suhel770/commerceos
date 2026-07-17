"use client";

import CatalogSection from "@/components/catalog/CatalogSection";
import { useCatalogSection } from "@/hooks/useCatalogSection";

interface Props {
  product: {
    identity: Record<string, unknown>;
  };
}

export default function ProductIdentityCard({
  product,
}: Props) {
  const {
    values,
    updateField,
  } = useCatalogSection({
    initialValues: product.identity,
  });

  return (
    <CatalogSection
      title="Product Identity"
      description="Core information that identifies this product."
      group="identity"
      values={values}
      onFieldChange={updateField}
    />
  );
}
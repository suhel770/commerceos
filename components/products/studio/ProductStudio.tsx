"use client";

import { StudioProvider, useStudio } from "./context/StudioContext";

import StudioHeader from "./navigation/StudioHeader";

import ProductHealthStrip from "./navigation/ProductHealthStrip";

import { STUDIO_WORKSPACE_COMPONENTS } from "./registry/studio-workspaces";

import StudioEditDialog from "./shared/StudioEditDialog";

import type { Product } from "@/lib/types/product";

interface ProductStudioProps {
  product: Product;
}

export default function ProductStudio({
  product,
}: ProductStudioProps) {
  return (
    <StudioProvider product={product}>
      <ProductStudioContent />
    </StudioProvider>
  );
}

function ProductStudioContent() {
  const {
    draft,
    activeWorkspace,
  } = useStudio();

  const ActiveWorkspace =
    STUDIO_WORKSPACE_COMPONENTS[
      activeWorkspace
    ];

  return (
    <div className="flex flex-col gap-5">

      <StudioHeader
        image={draft.image}
        productName={draft.name}
        sku={draft.sku}
        status={draft.status}
        slug={draft.slug}
      />

      <ProductHealthStrip />

      <main className="min-h-[700px]">
        <ActiveWorkspace product={draft} />

      </main>

      <StudioEditDialog />

    </div>
  );
}

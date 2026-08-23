"use client";

import { use } from "react";
import AppShell from "@/components/layout/AppShell";
import StorageLocationWorkspaceView from "@/components/storage/workspace/StorageLocationWorkspaceView";

export default function StorageLocationStockPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);

  return (
    <AppShell
      title="Storage Stock Inventory"
      subtitle="Warehouse Location SKU Inventory & Bins"
    >
      <StorageLocationWorkspaceView locationId={locationId} initialTab="stock" />
    </AppShell>
  );
}

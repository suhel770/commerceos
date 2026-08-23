"use client";

import { use } from "react";
import AppShell from "@/components/layout/AppShell";
import StorageLocationWorkspaceView from "@/components/storage/workspace/StorageLocationWorkspaceView";

export default function StorageLocationPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);

  return (
    <AppShell
      title="Storage Workspace"
      subtitle="Universal Location Workspace"
    >
      <StorageLocationWorkspaceView locationId={locationId} />
    </AppShell>
  );
}

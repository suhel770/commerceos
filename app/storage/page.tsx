"use client";

import AppShell from "@/components/layout/AppShell";
import StorageHomePageView from "@/components/storage/StorageHomePageView";

export default function StoragePage() {
  return (
    <AppShell
      title="Storage"
      subtitle="Where is your inventory physically located?"
    >
      <StorageHomePageView />
    </AppShell>
  );
}

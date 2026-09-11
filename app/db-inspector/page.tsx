import React from "react";
import type { Metadata } from "next";
import DatabaseInspectorView from "@/components/db-inspector/DatabaseInspectorView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Database Inspector — CommerceOS Master Data Registry",
  description: "Live PostgreSQL database inspector, table row counts, user ownership tracing, and vendor relationships.",
};

export default function DatabaseInspectorPage() {
  return <DatabaseInspectorView />;
}

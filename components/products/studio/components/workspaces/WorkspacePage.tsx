"use client";

import {
  ArrowLeft,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { StudioWorkspaceId } from "../../config/studio.config";
import { useStudio } from "../../context/StudioContext";

import IdentitySection from "../../overview/sections/IdentitySection";
import {
  ActivityWorkspace,
  AttributesWorkspace,
  CategoryMappingWorkspace,
  ChannelsWorkspace,
  CommercialsWorkspace,
  ComplianceWorkspace,
  ExceptionsWorkspace,
  GrowthWorkspace,
  InventoryWorkspace,
  MediaWorkspace,
  PreviewWorkspace,
  PublishingWorkspace,
  ReadinessWorkspace,
  SupplyWorkspace,
  VariantsWorkspace,
} from "./features";

type WorkspacePageId = Exclude<StudioWorkspaceId, "overview">;

const workspaceMeta: Record<
  WorkspacePageId,
  {
    title: string;
    description: string;
  }
> = {
  identity: {
    title: "Identity",
    description: "Brand, SKU and core product identity.",
  },
  media: {
    title: "Media",
    description: "Images, assets and video content.",
  },
  commercials: {
    title: "Commercials",
    description: "Pricing, cost and profitability.",
  },
  inventory: {
    title: "Inventory",
    description: "Stock, reservations, warehouses, thresholds and synchronization.",
  },
  supply: {
    title: "Supply",
    description: "Suppliers, procurement references and replenishment.",
  },
  attributes: {
    title: "Attributes",
    description: "Marketplace specifications and attribute coverage.",
  },
  variants: {
    title: "Variants",
    description: "Variants and configurations for each SKU.",
  },
  growth: {
    title: "Growth",
    description: "SEO, discoverability and optional AI optimization.",
  },
  channels: {
    title: "Channels",
    description: "Marketplace connections and channel mapping.",
  },
  compliance: {
    title: "Compliance",
    description: "GST, HSN and marketplace policy compliance.",
  },
  publishing: {
    title: "Publishing",
    description: "Readiness, validation and publishing workflow.",
  },
  activity: {
    title: "Activity",
    description: "Audit history and product timeline.",
  },
  exceptions: {
    title: "Exceptions & Actions Required",
    description: "Action items and delta channel requirements needing attention.",
  },
  readiness: {
    title: "Channel Readiness",
    description: "Real-time compliance score and factor fulfillment.",
  },
  preview: {
    title: "Marketplace Simulation Preview",
    description: "Internal transformed catalog representation across channels.",
  },
  category_mapping: {
    title: "Category Taxonomy Mapping",
    description: "Canonical category linkage to target marketplace verticals.",
  },
};

function renderWorkspace(workspace: WorkspacePageId) {
  switch (workspace) {
    case "identity":
      return <IdentitySection />;
    case "media":
      return <MediaWorkspace />;
    case "commercials":
      return <CommercialsWorkspace />;
    case "inventory":
      return <InventoryWorkspace />;
    case "supply":
      return <SupplyWorkspace />;
    case "attributes":
      return <AttributesWorkspace />;
    case "variants":
      return <VariantsWorkspace />;
    case "growth":
      return <GrowthWorkspace />;
    case "channels":
      return <ChannelsWorkspace />;
    case "compliance":
      return <ComplianceWorkspace />;
    case "publishing":
      return <PublishingWorkspace />;
    case "activity":
      return <ActivityWorkspace />;
    case "exceptions":
      return <ExceptionsWorkspace />;
    case "readiness":
      return <ReadinessWorkspace />;
    case "preview":
      return <PreviewWorkspace />;
    case "category_mapping":
      return <CategoryMappingWorkspace />;
  }
}

export default function WorkspacePage() {
  const {
    listing,
    activeWorkspace,
    setActiveWorkspace,
    dirty,
    saving,
    saveError,
    save,
    refresh,
  } = useStudio();

  if (activeWorkspace === "overview") {
    return null;
  }

  const workspace = activeWorkspace as WorkspacePageId;
  const meta = workspaceMeta[workspace];

  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-5 pt-2 sm:px-6">
      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Back to Product Control Center"
            onClick={() => setActiveWorkspace("overview")}
            className="h-8 w-8 rounded-xl shrink-0 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {meta.title} Workspace
              </h2>
              <span className="text-[11px] text-slate-400 font-normal truncate hidden md:inline">
                — {meta.description}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
          <span
            className={
              saveError
                ? "text-[11px] font-semibold text-red-600"
                : "text-[11px] font-semibold text-slate-500"
            }
            role={saveError ? "alert" : undefined}
          >
            {saving
              ? "Saving changes…"
              : saveError
                ? saveError
              : dirty
                ? "Unsaved changes"
                : "All changes saved"}
          </span>

          {saveError && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs rounded-xl"
              onClick={() => refresh()}
            >
              Reload
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            className="h-7.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition cursor-pointer"
            disabled={saving || !dirty || !listing?.permissions.canEdit}
            onClick={() => save()}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Update Master Listing
          </Button>
        </div>
      </div>

      <div className="min-w-0">
        {renderWorkspace(workspace)}
      </div>
    </div>
  );
}

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
  ChannelsWorkspace,
  CommercialsWorkspace,
  ComplianceWorkspace,
  GrowthWorkspace,
  InventoryWorkspace,
  MediaWorkspace,
  PublishingWorkspace,
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
    <div className="mx-auto max-w-[1500px] px-4 pb-5 pt-4 sm:px-6">
      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Back to Product Control Center"
            onClick={() => setActiveWorkspace("overview")}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900">
              {meta.title} Workspace
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {meta.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={
              saveError
                ? "text-xs font-medium text-red-600"
                : "text-xs font-medium text-slate-500"
            }
            role={
              saveError
                ? "alert"
                : undefined
            }
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
              onClick={() =>
                refresh()
              }
            >
              Reload Saved Version
            </Button>
          )}

          <Button
            type="button"
            disabled={
              saving ||
              !dirty ||
              !listing?.permissions
                .canEdit
            }
            onClick={() => save()}
          >
            <Save className="mr-2 h-4 w-4" />
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

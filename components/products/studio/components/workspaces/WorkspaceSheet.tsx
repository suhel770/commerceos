"use client";

/**
 * @deprecated Legacy drawer path. Product Studio uses WorkspacePage.
 * Preserved until verification of the full-page workspace path is complete.
 */

import type { StudioWorkspaceId } from "@/components/products/studio/config/studio.config";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useStudio } from "../../context/StudioContext";

import ActivitySection from "../../overview/sections/ActivitySection";
import AttributesSection from "../../overview/sections/AttributesSection";
import ChannelsSection from "../../overview/sections/ChannelsSection";
import CommercialSection from "../../overview/sections/CommercialSection";
import ComplianceSection from "../../overview/sections/ComplianceSection";
import GrowthSection from "../../overview/sections/GrowthSection";
import IdentitySection from "../../overview/sections/IdentitySection";
import InventorySection from "../../overview/sections/InventorySection";
import MediaSection from "../../overview/sections/MediaSection";
import PublishingSection from "../../overview/sections/PublishingSection";
import SupplySection from "../../overview/sections/SupplySection";
import VariantsSection from "../../overview/sections/VariantsSection";

const workspaceTitles: Record<
  Exclude<StudioWorkspaceId, "overview">,
  string
> = {
  identity: "Identity",
  media: "Media",
  commercials: "Commercials",
  inventory: "Inventory",
  supply: "Supply",
  attributes: "Attributes",
  variants: "Variants",
  growth: "Growth",
  channels: "Channels",
  compliance: "Compliance",
  publishing: "Publishing",
  activity: "Activity",
};

const workspaceDescriptions: Record<
  Exclude<StudioWorkspaceId, "overview">,
  string
> = {
  identity: "Brand, SKU and core product identity.",
  media: "Images, assets and video content.",
  commercials: "Pricing, cost and profitability.",
  inventory: "Stock, reservations, warehouses and thresholds.",
  supply: "Suppliers, procurement and replenishment.",
  attributes: "Marketplace specifications and attribute coverage.",
  variants: "Variants and configurations for each SKU.",
  growth: "SEO, discoverability and AI optimization.",
  channels: "Marketplace connections and channel mapping.",
  compliance: "GST, HSN and marketplace policy compliance.",
  publishing: "Readiness, validation and publishing workflow.",
  activity: "Audit history and product timeline.",
};

function renderWorkspaceSection(
  workspace: StudioWorkspaceId,
) {
  switch (workspace) {
    case "identity":
      return <IdentitySection />;

    case "media":
      return <MediaSection />;

    case "commercials":
      return <CommercialSection />;

    case "inventory":
      return <InventorySection />;

    case "supply":
      return <SupplySection />;

    case "attributes":
      return <AttributesSection />;

    case "variants":
      return <VariantsSection />;

    case "growth":
      return <GrowthSection />;

    case "channels":
      return <ChannelsSection />;

    case "compliance":
      return <ComplianceSection />;

    case "publishing":
      return <PublishingSection />;

    case "activity":
      return <ActivitySection />;

    default:
      return null;
  }
}

export default function WorkspaceSheet() {
  const {
    activeWorkspace,
    setActiveWorkspace,
  } = useStudio();

  const open =
    activeWorkspace !== "overview";

  const workspaceId = open
    ? (activeWorkspace as Exclude<StudioWorkspaceId, "overview">)
    : null;

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setActiveWorkspace("overview");
        }
      }}
    >
      <SheetContent
        side="right"
        className="!w-full !max-w-none overflow-x-hidden overflow-y-auto p-0 sm:!w-[min(90vw,900px)] sm:!max-w-[900px]"
      >
        {workspaceId && (
          <>
            <SheetHeader className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4 pr-14">

              <SheetTitle className="text-xl">
                {workspaceTitles[workspaceId]}
              </SheetTitle>

              <SheetDescription>
                {workspaceDescriptions[workspaceId]}
              </SheetDescription>

            </SheetHeader>

            <div className="min-w-0 overflow-x-hidden p-5 sm:p-6">
              {renderWorkspaceSection(workspaceId)}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

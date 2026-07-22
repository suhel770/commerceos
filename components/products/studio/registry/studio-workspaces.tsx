import type { ComponentType } from "react";

import type { Product } from "@/lib/types/product";

import type { StudioWorkspaceId } from "../config/studio.config";

import OverviewTab from "../overview/OverviewTab";
import ProductIdentitySection from "../overview/sections/ProductIdentitySection";
import MediaSection from "../overview/sections/MediaSection";
import CommercialSection from "../overview/sections/CommercialSection";
import SupplySection from "../overview/sections/SupplySection";
import AttributesSection from "../overview/sections/AttributesSection";
import VariantsSection from "../overview/sections/VariantsSection";
import GrowthSection from "../overview/sections/GrowthSection";
import ChannelsSection from "../overview/sections/ChannelsSection";
import ComplianceSection from "../overview/sections/ComplianceSection";
import PublishingSection from "../overview/sections/PublishingSection";
import ActivitySection from "../overview/sections/ActivitySection";

export const STUDIO_WORKSPACE_COMPONENTS: Record<
  StudioWorkspaceId,
  ComponentType<{ product: Product }>
> = {
  overview: OverviewTab,

  identity: ProductIdentitySection,

  media: MediaSection,

  commercials: CommercialSection,

  supply: SupplySection,

  attributes: AttributesSection,

  variants: VariantsSection,

  growth: GrowthSection,

  channels: ChannelsSection,

  compliance: ComplianceSection,

  publishing: PublishingSection,

  activity: ActivitySection,
};

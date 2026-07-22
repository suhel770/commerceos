import type { ComponentType } from "react";

import type { Product } from "@/lib/types/product";

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

export interface StudioSection {
  id: string;
  component: ComponentType<{ product: Product }>;
}

export const OVERVIEW_SECTIONS: StudioSection[] = [
  {
    id: "product",
    component: ProductIdentitySection,
  },
  {
    id: "media",
    component: MediaSection,
  },
  {
    id: "commercials",
    component: CommercialSection,
  },
  {
    id: "supply",
    component: SupplySection,
  },
  {
    id: "attributes",
    component: AttributesSection,
  },
  {
    id: "variants",
    component: VariantsSection,
  },
  {
    id: "growth",
    component: GrowthSection,
  },
  {
    id: "channels",
    component: ChannelsSection,
  },
  {
    id: "compliance",
    component: ComplianceSection,
  },
  {
    id: "publishing",
    component: PublishingSection,
  },
  {
    id: "activity",
    component: ActivitySection,
  },
];

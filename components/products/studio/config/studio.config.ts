import type { LucideIcon } from "lucide-react";

import {
  BadgeIndianRupee,
  Boxes,
  ClipboardCheck,
  FolderKanban,
  GalleryVertical,
  History,
  Package2,
  ScanSearch,
  Settings2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export type StudioWorkspaceId =
  | "overview"
  | "identity"
  | "media"
  | "commercials"
  | "supply"
  | "attributes"
  | "variants"
  | "growth"
  | "channels"
  | "compliance"
  | "publishing"
  | "activity";

export interface StudioWorkspaceConfig {
  id: StudioWorkspaceId;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
  badge?: "success" | "warning" | "ai";
  beta?: boolean;
  enterprise?: boolean;
}

export const PRODUCT_STUDIO_WORKSPACES: StudioWorkspaceConfig[] = [
  {
    id: "overview",
    label: "Overview",
    icon: Package2,
    enabled: true,
    badge: "success",
  },
  {
    id: "identity",
    label: "Product Identity",
    icon: Package2,
    enabled: true,
    badge: "success",
  },
  {
    id: "media",
    label: "Media Studio",
    icon: GalleryVertical,
    enabled: true,
    badge: "warning",
  },
  {
    id: "commercials",
    label: "Commercials",
    icon: BadgeIndianRupee,
    enabled: true,
    badge: "success",
  },
  {
    id: "supply",
    label: "Supply",
    icon: Boxes,
    enabled: true,
    badge: "success",
  },
  {
    id: "attributes",
    label: "Attributes",
    icon: FolderKanban,
    enabled: true,
  },
  {
    id: "variants",
    label: "Variants",
    icon: ScanSearch,
    enabled: true,
  },
  {
    id: "growth",
    label: "Growth",
    icon: TrendingUp,
    enabled: true,
    badge: "ai",
  },
  {
    id: "channels",
    label: "Channels",
    icon: Settings2,
    enabled: true,
    badge: "warning",
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: ShieldCheck,
    enabled: true,
    badge: "success",
  },
  {
    id: "publishing",
    label: "Publishing",
    icon: ClipboardCheck,
    enabled: true,
  },
  {
    id: "activity",
    label: "Activity",
    icon: History,
    enabled: true,
  },
];

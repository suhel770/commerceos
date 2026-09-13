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
  Truck,
} from "lucide-react";

export type StudioWorkspaceId =
  | "overview"
  | "identity"
  | "media"
  | "commercials"
  | "inventory"
  | "logistics"
  | "attributes"
  | "variants"
  | "growth"
  | "channels"
  | "compliance"
  | "publishing"
  | "activity"
  | "exceptions"
  | "readiness"
  | "preview"
  | "category_mapping";

export interface StudioWorkspaceConfig {
  id: StudioWorkspaceId;
  label: string;
  shortLabel?: string;
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
    shortLabel: "Overview",
    icon: Package2,
    enabled: true,
    badge: "success",
  },
  {
    id: "identity",
    label: "Identity",
    shortLabel: "Identity",
    icon: Package2,
    enabled: true,
    badge: "success",
  },
  {
    id: "media",
    label: "Media",
    shortLabel: "Media",
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
    id: "inventory",
    label: "Inventory",
    icon: Boxes,
    enabled: true,
    badge: "success",
  },
  {
    id: "logistics",
    label: "Logistics & Packaging",
    shortLabel: "Logistics",
    icon: Truck,
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
    id: "preview",
    label: "Live Preview",
    shortLabel: "Preview",
    icon: ScanSearch,
    enabled: true,
  },
  {
    id: "readiness",
    label: "Readiness",
    shortLabel: "Readiness",
    icon: ShieldCheck,
    enabled: true,
  },
  {
    id: "category_mapping",
    label: "Category Mapping",
    shortLabel: "Taxonomy",
    icon: FolderKanban,
    enabled: true,
  },
  {
    id: "activity",
    label: "Activity",
    icon: History,
    enabled: true,
  },
];

export const DEFAULT_STUDIO_WORKSPACE_ORDER: StudioWorkspaceId[] = [
  "identity",
  "media",
  "commercials",
  "inventory",
  "logistics",
  "attributes",
  "variants",
  "growth",
  "channels",
  "compliance",
  "publishing",
  "preview",
  "readiness",
  "category_mapping",
  "activity",
];

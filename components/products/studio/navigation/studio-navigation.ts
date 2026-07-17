import {
  BadgeIndianRupee,
  Boxes,
  BrainCircuit,
  ClipboardCheck,
  FileText,
  History,
  ImageIcon,
  Package,
  Settings2,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

export interface StudioNavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

export const PRODUCT_STUDIO_NAVIGATION: StudioNavigationItem[] = [
  {
    id: "general",
    label: "General",
    icon: Package,
  },
  {
    id: "media",
    label: "Media Studio",
    icon: ImageIcon,
  },
  {
    id: "pricing",
    label: "Pricing",
    icon: BadgeIndianRupee,
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Boxes,
  },
  {
    id: "attributes",
    label: "Attributes",
    icon: FileText,
  },
  {
    id: "variants",
    label: "Variants",
    icon: ShoppingBag,
  },
  {
    id: "seo",
    label: "SEO & Content",
    icon: FileText,
  },
  {
    id: "marketplaces",
    label: "Marketplace Overrides",
    icon: Settings2,
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: ShieldCheck,
  },
  {
    id: "ai",
    label: "AI Studio",
    icon: BrainCircuit,
  },
  {
    id: "publishing",
    label: "Publishing",
    icon: ClipboardCheck,
  },
  {
    id: "history",
    label: "History",
    icon: History,
  },
];
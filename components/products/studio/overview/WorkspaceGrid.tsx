"use client";

import {
  Activity,
  BadgeInfo,
  BarChart3,
  Boxes,
  ClipboardCheck,
  Globe2,
  ImageIcon,
  IndianRupee,
  Layers3,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";

import type { StudioWorkspaceId } from "@/components/products/studio/config/studio.config";

import { useStudio } from "../context/StudioContext";

import {
  computeWorkspaceSummaries,
} from "@/lib/studio/workspace-metrics";

import WorkspaceCard from "./WorkspaceCard";

interface WorkspaceDefinition {
  id: StudioWorkspaceId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconBackground: string;
  iconColor: string;
}

const workspaceDefinitions: WorkspaceDefinition[] = [
  {
    id: "identity",
    title: "Identity",
    subtitle: "Brand, SKU & identity details.",
    icon: BadgeInfo,
    iconBackground: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "media",
    title: "Media",
    subtitle: "Images, assets and video content.",
    icon: ImageIcon,
    iconBackground: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    id: "commercials",
    title: "Commercials",
    subtitle: "Pricing, cost and profitability.",
    icon: IndianRupee,
    iconBackground: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    id: "inventory",
    title: "Inventory",
    subtitle: "Stock, reservations, warehouses and thresholds.",
    icon: Boxes,
    iconBackground: "bg-cyan-50",
    iconColor: "text-cyan-600",
  },
  {
    id: "supply",
    title: "Supply",
    subtitle: "Suppliers, procurement and replenishment.",
    icon: Truck,
    iconBackground: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    id: "attributes",
    title: "Attributes",
    subtitle: "Marketplace specifications and product detail coverage.",
    icon: Boxes,
    iconBackground: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    id: "variants",
    title: "Variants",
    subtitle: "Variants and configurations for each SKU.",
    icon: Layers3,
    iconBackground: "bg-emerald-50",
    iconColor: "text-emerald-700",
  },
  {
    id: "growth",
    title: "Growth",
    subtitle: "SEO, discoverability, marketplace ranking and AI optimization.",
    icon: BarChart3,
    iconBackground: "bg-pink-50",
    iconColor: "text-pink-600",
  },
  {
    id: "channels",
    title: "Channels",
    subtitle: "Amazon, Flipkart, Shopify, Meesho and marketplace mapping.",
    icon: Globe2,
    iconBackground: "bg-blue-50",
    iconColor: "text-blue-700",
  },
  {
    id: "compliance",
    title: "Compliance",
    subtitle: "GST, HSN & marketplace policy compliance.",
    icon: ShieldCheck,
    iconBackground: "bg-emerald-50",
    iconColor: "text-emerald-700",
  },
  {
    id: "publishing",
    title: "Publishing",
    subtitle: "Readiness, validation and publishing workflow.",
    icon: ClipboardCheck,
    iconBackground: "bg-indigo-50",
    iconColor: "text-indigo-700",
  },
  {
    id: "activity",
    title: "Activity",
    subtitle: "Audit history, publishing logs, edits and product timeline.",
    icon: Activity,
    iconBackground: "bg-slate-100",
    iconColor: "text-slate-700",
  },
];

export default function WorkspaceGrid() {
  const {
    product,
    listing,
    activeWorkspace,
    setActiveWorkspace,
  } = useStudio();

  if (!listing) {
    return null;
  }

  const summaries = computeWorkspaceSummaries(
    listing,
    product,
  );

  return (
    <section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

        {workspaceDefinitions.map((workspace) => {
          const summary = summaries.find(
            (item) => item.id === workspace.id,
          );

          if (!summary) {
            return null;
          }

          return (
            <WorkspaceCard
              key={workspace.id}
              title={workspace.title}
              subtitle={workspace.subtitle}
              icon={workspace.icon}
              status={summary.status}
              metrics={summary.metrics}
              ai={summary.ai}
              active={activeWorkspace === workspace.id}
              iconBackground={workspace.iconBackground}
              iconColor={workspace.iconColor}
              onClick={() => setActiveWorkspace(workspace.id)}
            />
          );
        })}

      </div>

    </section>
  );
}

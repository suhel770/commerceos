"use client";

import { useState } from "react";
import {
  Activity,
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
import { computeWorkspaceSummaries } from "@/lib/studio/workspace-metrics";
import WorkspaceCard from "./WorkspaceCard";

interface WorkspaceDefinition {
  id: StudioWorkspaceId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconBackground: string;
  iconColor: string;
}

const WORKSPACE_DEFINITIONS: Record<string, WorkspaceDefinition> = {
  identity: {
    id: "identity",
    title: "Product Identity",
    subtitle: "Brand, SKU, category and core product information",
    icon: ShieldCheck,
    iconBackground: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  media: {
    id: "media",
    title: "Media Studio",
    subtitle: "Upload images, videos and rich media assets",
    icon: ImageIcon,
    iconBackground: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  commercials: {
    id: "commercials",
    title: "Commercials",
    subtitle: "Pricing, margins and profitability configuration",
    icon: IndianRupee,
    iconBackground: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  inventory: {
    id: "inventory",
    title: "Inventory",
    subtitle: "Stock, reservations and warehouse management",
    icon: Boxes,
    iconBackground: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  logistics: {
    id: "logistics",
    title: "Logistics & Packaging",
    subtitle: "Dimensions, volumetric weight, dispatch SLA & GTIN exemption",
    icon: Truck,
    iconBackground: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  attributes: {
    id: "attributes",
    title: "Attributes",
    subtitle: "Product attributes and specifications",
    icon: Boxes,
    iconBackground: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  variants: {
    id: "variants",
    title: "Variants",
    subtitle: "Size, color and other variants configuration",
    icon: Layers3,
    iconBackground: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  growth: {
    id: "growth",
    title: "Growth",
    subtitle: "SEO, discoverability and marketing optimization",
    icon: BarChart3,
    iconBackground: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  channels: {
    id: "channels",
    title: "Channels",
    subtitle: "Connected marketplaces and stores",
    icon: Globe2,
    iconBackground: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  compliance: {
    id: "compliance",
    title: "Compliance",
    subtitle: "GST, HSN, policies and regulatory compliance",
    icon: ShieldCheck,
    iconBackground: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  publishing: {
    id: "publishing",
    title: "Publishing",
    subtitle: "Readiness, validation and publishing status",
    icon: ClipboardCheck,
    iconBackground: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  activity: {
    id: "activity",
    title: "Activity",
    subtitle: "History, logs and recent activities",
    icon: Activity,
    iconBackground: "bg-slate-100",
    iconColor: "text-slate-700",
  },
};

export default function WorkspaceGrid() {
  const {
    product,
    listing,
    activeWorkspace,
    setActiveWorkspace,
    workspaceOrder,
    reorderWorkspaces,
  } = useStudio();

  const [draggedId, setDraggedId] = useState<StudioWorkspaceId | null>(null);
  const [dragOverId, setDragOverId] = useState<StudioWorkspaceId | null>(null);

  if (!listing) {
    return null;
  }

  const summaries = computeWorkspaceSummaries(listing, product);

  const handleDragStart = (id: StudioWorkspaceId, e: React.DragEvent) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (id: StudioWorkspaceId, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDrop = (targetId: StudioWorkspaceId, e: React.DragEvent) => {
    e.preventDefault();
    const sourceId = (e.dataTransfer.getData("text/plain") || draggedId) as StudioWorkspaceId;
    if (sourceId && targetId && sourceId !== targetId) {
      reorderWorkspaces(sourceId, targetId);
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <section>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {workspaceOrder.map((workspaceId) => {
          const workspace = WORKSPACE_DEFINITIONS[workspaceId];
          if (!workspace) return null;

          const summary = summaries.find((item) => item.id === workspace.id);
          if (!summary) return null;

          return (
            <WorkspaceCard
              key={workspace.id}
              id={workspace.id}
              title={workspace.title}
              subtitle={workspace.subtitle}
              icon={workspace.icon}
              status={summary.status}
              metrics={summary.metrics}
              ai={summary.ai}
              active={activeWorkspace === workspace.id}
              iconBackground={workspace.iconBackground}
              iconColor={workspace.iconColor}
              isDragging={draggedId === workspace.id}
              isOver={dragOverId === workspace.id && draggedId !== workspace.id}
              onDragStart={(e) => handleDragStart(workspace.id, e)}
              onDragOver={(e) => handleDragOver(workspace.id, e)}
              onDragLeave={handleDragLeave}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(workspace.id, e)}
              onClick={() => setActiveWorkspace(workspace.id)}
            />
          );
        })}
      </div>
    </section>
  );
}

"use client";

import { cn } from "@/lib/utils";

import {
  PRODUCT_STUDIO_WORKSPACES,
  type StudioWorkspaceId,
} from "../config/studio.config";
import { useStudio } from "../context/StudioContext";

const workflowOrder: StudioWorkspaceId[] =
  [
    "overview",
    "identity",
    "media",
    "commercials",
    "variants",
    "attributes",
    "inventory",
    "supply",
    "compliance",
    "publishing",
    "growth",
    "channels",
    "activity",
  ];

export default function StudioWorkflowNavigation() {
  const {
    activeWorkspace,
    setActiveWorkspace,
  } = useStudio();
  const workspaces =
    workflowOrder.flatMap((id) => {
      const workspace =
        PRODUCT_STUDIO_WORKSPACES.find(
          (item) => item.id === id,
        );

      return workspace?.enabled
        ? [workspace]
        : [];
    });

  return (
    <nav
      aria-label="Product Studio workflow"
      className="bg-white"
    >
      <div className="mx-auto max-w-[1800px] overflow-x-auto px-4 sm:px-6">
        <div className="flex min-w-max gap-1 pb-2 pt-0">
          {workspaces.map(
            (workspace) => {
              const active =
                activeWorkspace ===
                workspace.id;
              const Icon =
                workspace.icon;

              return (
                <button
                  key={workspace.id}
                  type="button"
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  onClick={() =>
                    setActiveWorkspace(
                      workspace.id,
                    )
                  }
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {workspace.label}
                </button>
              );
            },
          )}
        </div>
      </div>
    </nav>
  );
}

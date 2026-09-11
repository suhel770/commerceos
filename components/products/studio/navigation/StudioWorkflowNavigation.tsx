"use client";

import { cn } from "@/lib/utils";
import {
  PRODUCT_STUDIO_WORKSPACES,
  type StudioWorkspaceId,
} from "../config/studio.config";
import { useStudio } from "../context/StudioContext";

export default function StudioWorkflowNavigation() {
  const { activeWorkspace, setActiveWorkspace, workspaceOrder } = useStudio();

  // "overview" tab is always first, followed by dynamic user-customized workspaceOrder
  const fullOrder: StudioWorkspaceId[] = ["overview", ...workspaceOrder.filter((id) => id !== "overview")];

  const workspaces = fullOrder.flatMap((id) => {
    const workspace = PRODUCT_STUDIO_WORKSPACES.find((item) => item.id === id);
    return workspace?.enabled ? [workspace] : [];
  });

  return (
    <div className="bg-slate-50/50 pt-1 pb-1 px-4 sm:px-6">
      <div className="mx-auto max-w-[1800px]">
        <nav
          aria-label="Product Studio workflow"
          className="rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-2xs overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex min-w-max items-center gap-1.5">
            {workspaces.map((workspace) => {
              const active = activeWorkspace === workspace.id;
              const Icon = workspace.icon;

              return (
                <button
                  key={workspace.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => setActiveWorkspace(workspace.id)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer",
                    active
                      ? "bg-blue-50 text-blue-600 font-bold border border-blue-200/80 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 border border-transparent",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      active ? "text-blue-600" : "text-slate-400",
                    )}
                  />
                  <span>{workspace.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

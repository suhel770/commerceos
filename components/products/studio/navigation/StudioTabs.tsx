"use client";

import { PRODUCT_STUDIO_WORKSPACES } from "../config/studio.config";
import type { StudioWorkspaceId } from "../config/studio.config";

interface StudioTabsProps {
  activeTab: StudioWorkspaceId;
  onChange: (tab: StudioWorkspaceId) => void;
}

function StatusDot({
  badge,
}: {
  badge?: string;
}) {
  switch (badge) {
    case "success":
      return (
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
      );

    case "warning":
      return (
        <span className="h-2 w-2 rounded-full bg-amber-500" />
      );

    case "ai":
      return (
        <span className="h-2 w-2 rounded-full bg-violet-500" />
      );

    default:
      return (
        <span className="h-2 w-2 rounded-full bg-slate-300" />
      );
  }
}

export default function StudioTabs({
  activeTab,
  onChange,
}: StudioTabsProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="flex overflow-x-auto">

        {PRODUCT_STUDIO_WORKSPACES
          .filter((workspace) => workspace.enabled)
          .map((workspace) => {
            const Icon = workspace.icon;

            const active =
              activeTab === workspace.id;

            return (
              <button
                key={workspace.id}
                onClick={() =>
                  onChange(workspace.id)
                }
                className={`
                  relative
                  flex
                  h-12
                  min-w-fit
                  items-center
                  gap-2
                  border-b-2
                  px-4
                  text-[13px]
                  font-medium
                  whitespace-nowrap
                  transition-all
                  duration-200

                  ${
                    active
                      ? "border-blue-600 bg-blue-50/40 text-slate-900"
                      : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <Icon
                  size={16}
                  className={
                    active
                      ? "text-blue-600"
                      : "text-slate-500"
                  }
                />

                <span>{workspace.label}</span>

                <StatusDot
                  badge={workspace.badge}
                />

                {active && (
                  <div className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-blue-600" />
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
}
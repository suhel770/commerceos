import type { ComponentType } from "react";

import type { StudioWorkspaceId } from "../config/studio.config";

import OverviewTab from "../overview/OverviewTab";

function ComingSoonWorkspace() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-20">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-3xl font-bold text-slate-900">
          Workspace Under Development
        </h2>

        <p className="mt-4 text-slate-500">
          This workspace will be available in an upcoming sprint.
        </p>
      </div>
    </div>
  );
}

export const STUDIO_WORKSPACE_COMPONENTS: Record<
  StudioWorkspaceId,
  ComponentType
> = {
  overview: OverviewTab,

  media: ComingSoonWorkspace,

  commercials: ComingSoonWorkspace,

  supply: ComingSoonWorkspace,

  attributes: ComingSoonWorkspace,

  variants: ComingSoonWorkspace,

  growth: ComingSoonWorkspace,

  channels: ComingSoonWorkspace,

  compliance: ComingSoonWorkspace,

  publishing: ComingSoonWorkspace,

  activity: ComingSoonWorkspace,
};
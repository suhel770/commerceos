"use client";

import StudioHeader from "./components/header/StudioHeader";
import StudioAIDock from "./components/ai/StudioAIDock";
import StudioLoadingScreen from "./components/shared/StudioLoadingScreen";
import StudioFieldEditorDialog from "./components/dialogs/StudioFieldEditorDialog";
import WorkspacePage from "./components/workspaces/WorkspacePage";
import StudioWorkflowNavigation from "./navigation/StudioWorkflowNavigation";

import ProductControlCenter from "./overview/ProductControlCenter";
import WorkspaceGrid from "./overview/WorkspaceGrid";

import { useStudio } from "./context/StudioContext";

export default function ProductStudio() {
  const {
    loading,
    activeWorkspace,
    fieldEditor,
    closeFieldEditor,
  } = useStudio();

  if (loading) {
    return <StudioLoadingScreen />;
  }

  return (
    <div className="flex min-h-full flex-col bg-slate-50/60">
      <StudioHeader />
      <StudioWorkflowNavigation />

      <main className="flex-1">
        {activeWorkspace === "overview" ? (
          <div className="mx-auto max-w-[1800px] px-4 py-3 sm:px-6">
            <ProductControlCenter />
            <WorkspaceGrid />
          </div>
        ) : (
          <WorkspacePage />
        )}
      </main>

      <StudioAIDock />

      <StudioFieldEditorDialog
        open={Boolean(fieldEditor)}
        editor={fieldEditor}
        onClose={closeFieldEditor}
      />

    </div>
  );
}

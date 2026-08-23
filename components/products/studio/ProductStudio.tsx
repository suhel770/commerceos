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
    <div className="flex min-h-full flex-col bg-slate-50">

      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <StudioHeader />
        <StudioWorkflowNavigation />
      </div>

      <main className="flex-1">

        {activeWorkspace === "overview" ? (
          <div className="mx-auto max-w-[1800px] px-4 pb-5 pt-4 sm:px-6">

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <ProductControlCenter />

              <WorkspaceGrid />

            </section>

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

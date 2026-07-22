"use client";

import { Loader2 } from "lucide-react";

interface WorkspaceLoadingProps {
  title?: string;
  description?: string;
}

export default function WorkspaceLoading({
  title = "Loading workspace...",
  description = "Please wait while CommerceOS prepares your data.",
}: WorkspaceLoadingProps) {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">

      <Loader2
        size={42}
        className="animate-spin text-blue-600"
      />

      <h2 className="mt-6 text-xl font-semibold text-slate-900">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-center text-sm text-slate-500">
        {description}
      </p>

    </div>
  );
}
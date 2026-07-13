"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface WorkspaceErrorProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export default function WorkspaceError({
  title = "Something went wrong",
  description = "CommerceOS couldn't load this workspace. Please try again.",
  onRetry,
}: WorkspaceErrorProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 px-8 py-16 text-center shadow-sm">

      <div className="rounded-full bg-red-100 p-5">

        <AlertTriangle
          size={44}
          className="text-red-600"
        />

      </div>

      <h2 className="mt-6 text-2xl font-bold text-red-700">
        {title}
      </h2>

      <p className="mt-3 max-w-lg text-sm leading-6 text-red-600">
        {description}
      </p>

      {onRetry && (

        <button
          onClick={onRetry}
          className="
            mt-8
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-red-600
            px-6
            py-3
            font-semibold
            text-white
            transition
            hover:bg-red-700
          "
        >

          <RefreshCw size={18} />

          Try Again

        </button>

      )}

    </div>
  );
}
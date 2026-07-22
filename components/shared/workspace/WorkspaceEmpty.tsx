"use client";

import { Inbox } from "lucide-react";
import Link from "next/link";

interface WorkspaceEmptyProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function WorkspaceEmpty({
  title = "Nothing here yet",
  description = "There isn't any data available for this workspace.",
  actionLabel,
  actionHref,
}: WorkspaceEmptyProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">

      <div className="rounded-full bg-slate-100 p-6">

        <Inbox
          size={48}
          className="text-slate-400"
        />

      </div>

      <h2 className="mt-6 text-2xl font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
        {description}
      </p>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="
            mt-8
            inline-flex
            items-center
            rounded-xl
            bg-blue-600
            px-6
            py-3
            font-semibold
            text-white
            transition
            hover:bg-blue-700
          "
        >
          {actionLabel}
        </Link>
      )}

    </div>
  );
}
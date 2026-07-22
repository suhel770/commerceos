"use client";

import {
  CheckCircle2,
  CircleDashed,
  AlertTriangle,
} from "lucide-react";

import type {
  ReadinessSection as Section,
} from "./types";

interface Props {
  section: Section;
}

export default function ReadinessSection({
  section,
}: Props) {
  const icon =
    section.progress === 100 ? (
      <CheckCircle2
        size={16}
        className="text-emerald-600"
      />
    ) : section.progress >= 70 ? (
      <CircleDashed
        size={16}
        className="text-amber-500"
      />
    ) : (
      <AlertTriangle
        size={16}
        className="text-red-500"
      />
    );

  return (
    <button className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-slate-50">

      <div className="flex items-center gap-3">

        {icon}

        <span className="text-sm font-medium text-slate-700">
          {section.name}
        </span>

      </div>

      <span className="text-sm font-semibold text-slate-900">
        {section.progress}%
      </span>

    </button>
  );
}
"use client";

import ReadinessProgress from "./ReadinessProgress";
import ReadinessSection from "./ReadinessSection";

import type { ReadinessData } from "./types";

interface Props {
  data: ReadinessData;
  onSectionClick?: (id: string) => void;
}

export default function ReadinessPopover({
  data,
  onSectionClick,
}: Props) {
  const completed = data.sections.filter(
    (s) => s.progress === 100
  ).length;

  const pending =
    data.sections.length - completed;

  const nextSection =
    data.sections.find(
      (s) => s.progress < 100
    );

  return (
    <div className="w-[400px]">

      {/* Header */}

      <div className="border-b border-slate-200 p-5">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">

              {data.title}

            </p>

            <h2 className="mt-1 text-3xl font-bold text-slate-900">

              {data.overall}%

            </h2>

          </div>

          <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">

            {completed} Complete

          </div>

        </div>

        <ReadinessProgress
          value={data.overall}
        />

        <p className="mt-3 text-sm text-slate-500">

          {pending} section(s) still need
          attention.

        </p>

      </div>

      {/* Sections */}

      <div className="max-h-[420px] overflow-y-auto p-3">

        {data.sections.map((section) => (

          <div
            key={section.id}
            onClick={() =>
              onSectionClick?.(
                section.id
              )
            }
          >

            <ReadinessSection
              section={section}
            />

          </div>

        ))}

      </div>

      {/* Footer */}

      <div className="border-t border-slate-200 bg-slate-50 p-4">

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">

          Next Recommendation

        </p>

        <h4 className="mt-2 font-semibold text-slate-900">

          {nextSection
            ? `Complete ${nextSection.name}`
            : "Everything is complete 🎉"}

        </h4>

        <button
          onClick={() =>
            nextSection &&
            onSectionClick?.(
              nextSection.id
            )
          }
          className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >

          {nextSection
            ? `Open ${nextSection.name}`
            : "Close"}

        </button>

      </div>

    </div>
  );
}
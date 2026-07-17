"use client";

import Popover from "../popover/Popover";
import ReadinessPopover from "./ReadinessPopover";
import ReadinessProgress from "./ReadinessProgress";

import type { ReadinessData } from "./types";

interface Props {
  data: ReadinessData;
  onSectionClick?: (id: string) => void;
}

export default function ReadinessWidget({
  data,
  onSectionClick,
}: Props) {
  return (
    <Popover
      width={420}
      trigger={
        <button
          type="button"
          className="group flex h-[45px] w-[220px] flex-col justify-center rounded-xl border border-slate-200 bg-white px-4 transition-all duration-200 hover:border-emerald-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">

            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">

              Product Readiness

            </span>

            <span className="text-sm font-bold text-slate-900">

              {data.overall}%

            </span>

          </div>

          <div className="mt-2">

            <ReadinessProgress
              value={data.overall}
            />

          </div>

        </button>
      }
    >
      <ReadinessPopover
        data={data}
        onSectionClick={onSectionClick}
      />
    </Popover>
  );
}
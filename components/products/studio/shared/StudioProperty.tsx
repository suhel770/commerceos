"use client";

import { ReactNode } from "react";
import {
  ChevronRight,
  Sparkles,
} from "lucide-react";

import StudioStatus from "./StudioStatus";

interface StudioPropertyProps {
  title: string;

  value: ReactNode;

  description?: string;

  status?:
    | "verified"
    | "locked"
    | "ai"
    | "success"
    | "warning"
    | "draft";

  statusLabel?: string;

  aiSuggestion?: string;

  editable?: boolean;

  onEdit?: () => void;
}

export default function StudioProperty({
  title,
  value,
  description,
  status,
  statusLabel,
  aiSuggestion,
  editable = true,
  onEdit,
}: StudioPropertyProps) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:border-slate-300 hover:shadow-sm">

      <div className="flex items-start justify-between p-5">

        <div className="flex-1">

          <div className="flex items-center gap-3">

            <h4 className="text-sm font-semibold text-slate-500">

              {title}

            </h4>

            {status && (
              <StudioStatus
                type={status}
                label={statusLabel}
              />
            )}

          </div>

          <div className="mt-3 text-lg font-semibold text-slate-900">

            {value}

          </div>

          {description && (
            <p className="mt-2 text-sm leading-6 text-slate-500">

              {description}

            </p>
          )}

          {aiSuggestion && (

            <div className="mt-4 flex items-start gap-3 rounded-xl bg-violet-50 p-4">

              <Sparkles
                size={18}
                className="mt-0.5 text-violet-600"
              />

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">

                  CommerceOS AI

                </p>

                <p className="mt-1 text-sm leading-6 text-violet-700">

                  {aiSuggestion}

                </p>

              </div>

            </div>

          )}

        </div>

        {editable && (

          <button
            onClick={onEdit}
            className="ml-6 flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-slate-100"
          >

            <ChevronRight size={18} />

          </button>

        )}

      </div>

    </div>
  );
}
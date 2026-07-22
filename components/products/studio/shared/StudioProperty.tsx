"use client";

import {
  ReactNode,
  type KeyboardEvent,
} from "react";
import { ChevronRight, Sparkles } from "lucide-react";

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

  compact?: boolean;

  actions?: ReactNode;

  footer?: ReactNode;

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
  compact = false,
  actions,
  footer,
  onEdit,
}: StudioPropertyProps) {
  const interactive =
    editable &&
    Boolean(onEdit) &&
    !actions;

  const handleKeyDown = (
    event: KeyboardEvent<HTMLDivElement>
  ) => {
    if (!interactive) return;

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      onEdit?.();
    }
  };

  return (
    <div
      role={
        interactive ? "button" : undefined
      }
      tabIndex={interactive ? 0 : undefined}
      onClick={
        interactive ? onEdit : undefined
      }
      onKeyDown={handleKeyDown}
      className={`
        group
        rounded-xl
        border
        border-slate-200
        bg-white
        transition-all
        duration-200
        hover:border-slate-300
        hover:shadow-sm
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        focus:ring-offset-2
        ${interactive ? "cursor-pointer" : ""}
      `}
    >
      <div className={compact ? "p-4" : "p-5"}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs font-semibold text-slate-500">
                {title}
              </h4>

              {status && (
                <StudioStatus
                  type={status}
                  label={statusLabel}
                />
              )}
            </div>

            <div className="mt-3 break-words text-base font-semibold leading-6 text-slate-900">
              {value}
            </div>

            {description && (
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                {description}
              </p>
            )}

            {aiSuggestion && (
              <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles
                    size={18}
                    className="mt-0.5 shrink-0 text-violet-600"
                  />

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                      CommerceOS AI
                    </p>

                    <p className="mt-1 text-sm leading-6 text-violet-700">
                      {aiSuggestion}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {footer && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                {footer}
              </div>
            )}
          </div>

          {actions ? (
            <div className="shrink-0">
              {actions}
            </div>
          ) : (
            interactive && (
              <span
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-500
                  transition
                  group-hover:bg-slate-100
                  group-hover:text-slate-900
                "
              >
                <ChevronRight size={17} />
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { GripVertical } from "lucide-react";

export interface ReorderableKpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  isDragging?: boolean;
  isOver?: boolean;
  showGrip?: boolean;
  gripPosition?: "top-right" | "top-left" | "none";
  className?: string;
  children: React.ReactNode;
}

/**
 * CommerceOS Standard Reorderable KPI Card Wrapper
 *
 * Wraps any KPI card with standard drag visual cues, grip handle,
 * smooth hover elevation, and accessibility outline.
 */
export const ReorderableKpiCard = React.forwardRef<HTMLDivElement, ReorderableKpiCardProps>(
  (
    {
      isDragging = false,
      isOver = false,
      showGrip = true,
      gripPosition = "top-right",
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`group relative rounded-2xl border bg-white shadow-xs transition-all duration-200 cursor-grab active:cursor-grabbing select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
          isDragging
            ? "opacity-40 scale-95 border-dashed border-violet-400 shadow-none pointer-events-none"
            : isOver
              ? "border-violet-500 ring-2 ring-violet-200 scale-102 shadow-md bg-violet-50/20"
              : "border-slate-200/80 hover:shadow-sm hover:border-slate-300"
        } ${className}`}
        {...props}
      >
        {showGrip && gripPosition !== "none" && (
          <div
            className={`absolute ${
              gripPosition === "top-right" ? "top-2.5 right-2.5" : "top-2.5 left-2.5"
            } opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity text-slate-300 pointer-events-none z-10`}
            aria-hidden="true"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        {children}
      </div>
    );
  }
);

ReorderableKpiCard.displayName = "ReorderableKpiCard";

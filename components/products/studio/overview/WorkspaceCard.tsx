"use client";

import { motion } from "framer-motion";
import { ChevronRight, GripVertical, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkspaceStatus =
  | "ready"
  | "attention"
  | "progress";

export interface Metric {
  label: string;
  value: string | number;
}

interface WorkspaceCardProps {
  id?: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  status: WorkspaceStatus;
  metrics: Metric[];
  active?: boolean;
  ai?: boolean;
  iconColor: string;
  iconBackground: string;
  isDragging?: boolean;
  isOver?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: () => void;
  onDragEnd?: () => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onClick?: () => void;
}

const STATUS = {
  ready: {
    label: "Ready",
    className: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  attention: {
    label: "Attention",
    className: "bg-amber-50 text-amber-600 border-amber-200",
  },
  progress: {
    label: "In Progress",
    className: "bg-blue-50 text-blue-600 border-blue-200",
  },
};

export default function WorkspaceCard({
  id,
  title,
  subtitle,
  icon: Icon,
  status,
  metrics,
  active = false,
  ai = false,
  iconBackground,
  iconColor,
  isDragging = false,
  isOver = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
  onClick,
}: WorkspaceCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-2xs transition-all duration-200 flex flex-col justify-between select-none cursor-grab active:cursor-grabbing",
        active
          ? "border-blue-500 shadow-md ring-1 ring-blue-500/20"
          : "border-slate-200/90 hover:border-slate-300 hover:shadow-sm",
        isDragging && "opacity-40 scale-[0.98] border-dashed border-blue-400 shadow-lg",
        isOver && "ring-2 ring-blue-500 border-blue-500 bg-blue-50/20 scale-[1.01]",
      )}
      onClick={(e) => {
        // Prevent click if we were dragging
        if (!isDragging && onClick) {
          onClick();
        }
      }}
    >
      {/* Header Row */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {/* Drag Handle Icon */}
            <div
              className="text-slate-300 group-hover:text-slate-500 transition -ml-1 cursor-grab"
              title="Drag to rearrange"
            >
              <GripVertical className="h-4 w-4" />
            </div>

            <div
              className={cn(
                "flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg border border-slate-100",
                iconBackground,
                iconColor,
              )}
            >
              <Icon className="h-4 w-4" />
            </div>

            <h3 className="truncate text-sm font-bold text-slate-900">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {ai && (
              <span className="rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                AI
              </span>
            )}

            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                STATUS[status].className,
              )}
            >
              {STATUS[status].label}
            </span>
          </div>
        </div>

        {/* Subtitle */}
        <p className="mt-2 text-xs leading-relaxed text-slate-500 font-normal line-clamp-2 h-8 pl-3">
          {subtitle}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-end justify-between gap-2 pl-3">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="min-w-0"
            >
              <p className="truncate text-[10px] font-medium text-slate-400">
                {metric.label}
              </p>

              <p className="mt-0.5 truncate text-xs font-bold font-mono text-slate-900 leading-tight">
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition shrink-0 mb-0.5" />
      </div>
    </div>
  );
}

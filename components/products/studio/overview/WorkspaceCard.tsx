"use client";

import { motion } from "framer-motion";
import { ChevronRight, type LucideIcon } from "lucide-react";

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
  title: string;
  subtitle: string;
  icon: LucideIcon;
  status: WorkspaceStatus;
  metrics: Metric[];
  active?: boolean;
  ai?: boolean;
  iconColor: string;
  iconBackground: string;
  onClick?: () => void;
}

const STATUS = {
  ready: {
    label: "Ready",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  attention: {
    label: "Attention",
    className:
      "bg-orange-50 text-orange-700 border-orange-200",
  },
  progress: {
    label: "In Progress",
    className:
      "bg-blue-50 text-blue-700 border-blue-200",
  },
};

export default function WorkspaceCard({
  title,
  subtitle,
  icon: Icon,
  status,
  metrics,
  active = false,
  ai = false,
  iconBackground,
  iconColor,
  onClick,
}: WorkspaceCardProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border bg-white p-4 text-left shadow-sm transition-all duration-200",
        active
          ? "border-blue-500 shadow-md ring-1 ring-blue-500"
          : "border-slate-200 hover:border-blue-300 hover:shadow-md",
      )}
    >
      {active && (
        <div className="absolute inset-x-0 top-0 h-1 bg-blue-600" />
      )}

      <div className="flex items-center justify-between gap-2">

        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              iconBackground,
              iconColor,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>

          <h3 className="truncate text-sm font-semibold text-slate-900">
            {title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5">

          {ai && (
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
              AI
            </span>
          )}

          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[9px] font-semibold",
              STATUS[status].className,
            )}
          >
            {STATUS[status].label}
          </span>

        </div>

      </div>

      <p className="mt-2 truncate pl-10 text-xs text-slate-500">
        {subtitle}
      </p>

      <div className="mt-4 flex items-end">

        <div className="grid min-w-0 flex-1 grid-cols-2 divide-x divide-slate-200">

          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={cn("min-w-0", index === 0 ? "pr-3" : "pl-3")}
            >
              <p className="truncate text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400">
                {metric.label}
              </p>

              <p className="mt-1 truncate text-sm font-bold leading-none text-slate-900">
                {metric.value}
              </p>
            </div>
          ))}

        </div>

        <span
          aria-hidden="true"
          className={cn(
            "ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-200",
            active
              ? "bg-blue-600 text-white"
              : "text-slate-500 group-hover:bg-blue-600 group-hover:text-white",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </span>

      </div>

    </motion.button>
  );
}

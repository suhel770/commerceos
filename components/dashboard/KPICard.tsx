import {
  ArrowDownRight,
  ArrowUpRight,
  LucideIcon,
} from "lucide-react";

import DashboardCard from "./DashboardCard";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change: number;

  icon: LucideIcon;

  iconBg?: string;
  iconColor?: string;

  description?: string;

  sparkline?: React.ReactNode;

  aiCard?: boolean;
  aiScore?: number;

  className?: string;
}

export default function KPICard({
  title,
  value,
  change,
  icon: Icon,

  iconBg = "bg-slate-100",
  iconColor = "text-slate-700",

  description,
  sparkline,

  aiCard = false,
  aiScore,

  className,
}: KPICardProps) {
  const positive = change >= 0;

  return (
    <DashboardCard
      className={cn(
        "h-[120px]",
        className
      )}
      contentClassName="flex h-full flex-col justify-between p-4"
    >
      <div className="flex items-start justify-between">

        <div className="min-w-0 flex-1">

          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {title}
          </p>

          <h2 className="mt-2 truncate text-[26px] font-bold leading-none tracking-tight text-slate-900 dark:text-white">
            {value}
          </h2>

        </div>

        <div
          className={cn(
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
            iconBg
          )}
        >
          <Icon
            className={cn(
              "h-4.5 w-4.5",
              iconColor
            )}
          />
        </div>

      </div>

      {sparkline && (
        <div className="my-2 h-6">
          {sparkline}
        </div>
      )}

      {aiCard ? (
        <div className="flex items-end justify-between">
          <p className="text-[11px] font-semibold text-emerald-600">Excellent</p>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-[5px] border-emerald-500 bg-white text-sm font-bold text-slate-900">{aiScore}</div>
        </div>
      ) : (
        <div className="flex items-center justify-between">

          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold",
              positive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}

            {Math.abs(change)}%
          </div>

          {description && (
            <p className="max-w-[58%] text-right text-[10px] leading-4 text-slate-500">
              {description}
            </p>
          )}

        </div>
      )}
    </DashboardCard>
  );
}

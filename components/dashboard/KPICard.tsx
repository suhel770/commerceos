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

          <p className="truncate text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            {title}
          </p>

          <h2 className="mt-1.5 truncate text-2xl font-black leading-none tracking-tight text-slate-900">
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
        <div className="flex items-center gap-3">
          <p className="shrink-0 text-[11px] font-semibold text-emerald-600">
            Excellent
          </p>

          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-emerald-100"
            role="progressbar"
            aria-label={`${title} progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={aiScore ?? 0}
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width]"
              style={{
                width: `${Math.min(100, Math.max(0, aiScore ?? 0))}%`,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">

          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold",
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
            <p className="max-w-[58%] text-right text-[11px] leading-4 text-slate-500">
              {description}
            </p>
          )}

        </div>
      )}
    </DashboardCard>
  );
}

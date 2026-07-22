import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function DashboardCard({
  children,
  title,
  subtitle,
  action,
  className,
  contentClassName,
}: DashboardCardProps) {
  return (
    <section
      className={cn(
        // Layout
        "relative overflow-hidden",

        // Shape
        "rounded-xl",

        // Border
        "border border-slate-200/80 dark:border-slate-800",

        // Background
        "bg-white dark:bg-slate-950",

        // Shadow
        "shadow-sm",

        // Animation
        "transition-all duration-200 ease-out",
        "hover:-translate-y-0.5",
        "hover:shadow-md",

        className
      )}
    >
      {(title || subtitle || action) && (
        <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">

            {title && (
              <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h2>
            )}

            {subtitle && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}

          </div>

          {action && (
            <div className="ml-4 flex items-center">
              {action}
            </div>
          )}
        </header>
      )}

      <div
        className={cn(
          "p-5",
          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
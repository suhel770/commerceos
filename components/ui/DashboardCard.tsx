import { ReactNode } from "react";

interface DashboardCardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function DashboardCard({
  title,
  description,
  action,
  children,
  className = "",
}: DashboardCardProps) {
  return (
    <div
      className={`
        rounded-[28px]
        border
        border-slate-200
        bg-white
        p-6
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-1
        hover:shadow-xl
        ${className}
      `}
    >
      {(title || description || action) && (
        <div className="mb-6 flex items-start justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 text-sm text-slate-500">
                {description}
              </p>
            )}
          </div>

          {action && (
            <div className="flex items-center">
              {action}
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
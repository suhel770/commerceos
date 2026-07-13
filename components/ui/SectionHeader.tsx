import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function SectionHeader({
  title,
  subtitle,
  action,
}: SectionHeaderProps) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">
            {subtitle}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}
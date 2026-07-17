"use client";

import { ReactNode } from "react";

interface StudioSectionProps {
  title: string;

  description?: string;

  action?: ReactNode;

  children: ReactNode;
}

export default function StudioSection({
  title,
  description,
  action,
  children,
}: StudioSectionProps) {
  return (
    <div className="space-y-6">

      <div className="flex items-start justify-between gap-6">

        <div>

          <h2 className="text-xl font-semibold text-slate-900">
            {title}
          </h2>

          {description && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}

        </div>

        {action && (
          <div>

            {action}

          </div>
        )}

      </div>

      {children}

    </div>
  );
}
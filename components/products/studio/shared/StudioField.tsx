"use client";

import { ReactNode } from "react";

interface StudioFieldProps {
  label: string;

  required?: boolean;

  hint?: string;

  children: ReactNode;
}

export default function StudioField({
  label,
  required,
  hint,
  children,
}: StudioFieldProps) {
  return (
    <div className="space-y-3">

      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">

        {label}

        {required && (
          <span className="text-red-500">
            *
          </span>
        )}

      </label>

      {children}

      {hint && (
        <p className="text-xs text-slate-500">
          {hint}
        </p>
      )}

    </div>
  );
}
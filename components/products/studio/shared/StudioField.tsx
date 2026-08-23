"use client";

import { ReactNode } from "react";

interface StudioFieldProps {
  label: string;

  required?: boolean;

  hint?: string;

  value?: ReactNode;

  multiline?: boolean;

  icon?: ReactNode;

  children?: ReactNode;
}

export default function StudioField({
  label,
  required,
  hint,
  value,
  multiline = false,
  icon,
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

      {children ?? (
        <div
          className={`flex min-w-0 gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 ${
            multiline
              ? "min-h-24 items-start whitespace-pre-wrap"
              : "items-center"
          }`}
        >
          {icon && (
            <span className="mt-0.5 shrink-0 text-slate-400">
              {icon}
            </span>
          )}

          <span className="min-w-0 break-words">
            {value ?? "Not provided"}
          </span>
        </div>
      )}

      {hint && (
        <p className="text-xs text-slate-500">
          {hint}
        </p>
      )}

    </div>
  );
}
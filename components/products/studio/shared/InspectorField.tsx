"use client";

import { ReactNode } from "react";
import {
  BadgeCheck,
  BrainCircuit,
  CircleAlert,
  Lock,
  Sparkles,
} from "lucide-react";

interface InspectorFieldProps {
  label: string;

  required?: boolean;

  ai?: boolean;

  verified?: boolean;

  locked?: boolean;

  warning?: string;

  hint?: string;

  children: ReactNode;
}

export default function InspectorField({
  label,
 required,
  ai,
  verified,
  locked,
  warning,
  hint,
  children,
}: InspectorFieldProps) {
  return (
    <div className="space-y-3">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2">

          <label className="text-sm font-semibold text-slate-800">

            {label}

            {required && (
              <span className="ml-1 text-red-500">*</span>
            )}

          </label>

        </div>

        <div className="flex items-center gap-2">

          {verified && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">

              <BadgeCheck size={13} />

              Verified

            </span>
          )}

          {locked && (
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">

              <Lock size={13} />

              Locked

            </span>
          )}

          {ai && (
            <span className="flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">

              <BrainCircuit size={13} />

              AI Ready

            </span>
          )}

        </div>

      </div>

      {/* Field */}

      {children}

      {/* Warning */}

      {warning && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">

          <CircleAlert
            size={16}
            className="mt-0.5 text-amber-600"
          />

          <p className="text-sm text-amber-700">
            {warning}
          </p>

        </div>
      )}

      {/* AI Hint */}

      {hint && (
        <div className="flex items-start gap-2 rounded-xl border border-violet-200 bg-violet-50 p-3">

          <Sparkles
            size={16}
            className="mt-0.5 text-violet-600"
          />

          <p className="text-sm text-violet-700">
            {hint}
          </p>

        </div>
      )}

    </div>
  );
}
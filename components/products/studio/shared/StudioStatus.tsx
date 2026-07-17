"use client";

import {
  AlertTriangle,
  BadgeCheck,
  BrainCircuit,
  CheckCircle2,
  Lock,
  Sparkles,
} from "lucide-react";

type StudioStatusType =
  | "verified"
  | "locked"
  | "ai"
  | "success"
  | "warning"
  | "draft";

interface StudioStatusProps {
  type: StudioStatusType;
  label?: string;
}

const config = {
  verified: {
    icon: BadgeCheck,
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Verified",
  },

  locked: {
    icon: Lock,
    className:
      "bg-slate-100 text-slate-700 border-slate-200",
    label: "Locked",
  },

  ai: {
    icon: BrainCircuit,
    className:
      "bg-violet-50 text-violet-700 border-violet-200",
    label: "AI Ready",
  },

  success: {
    icon: CheckCircle2,
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Healthy",
  },

  warning: {
    icon: AlertTriangle,
    className:
      "bg-amber-50 text-amber-700 border-amber-200",
    label: "Needs Attention",
  },

  draft: {
    icon: Sparkles,
    className:
      "bg-sky-50 text-sky-700 border-sky-200",
    label: "Draft",
  },
};

export default function StudioStatus({
  type,
  label,
}: StudioStatusProps) {
  const current = config[type];

  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${current.className}`}
    >
      <Icon size={13} />

      {label ?? current.label}
    </span>
  );
}
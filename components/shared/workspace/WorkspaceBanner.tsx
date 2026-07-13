"use client";

import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export type BannerVariant =
  | "ai"
  | "warning"
  | "success"
  | "info";

interface WorkspaceBannerProps {

  variant: BannerVariant;

  title: string;

  description: string;

  actionLabel?: string;

  actionHref?: string;

}

export default function WorkspaceBanner({

  variant,

  title,

  description,

  actionLabel,

  actionHref,

}: WorkspaceBannerProps) {

  const config = {

    ai: {
      bg: "from-violet-50 to-blue-50",
      border: "border-violet-200",
      icon: Sparkles,
      iconColor: "text-violet-600",
    },

    warning: {
      bg: "from-amber-50 to-orange-50",
      border: "border-amber-200",
      icon: AlertTriangle,
      iconColor: "text-amber-600",
    },

    success: {
      bg: "from-green-50 to-emerald-50",
      border: "border-green-200",
      icon: Sparkles,
      iconColor: "text-green-600",
    },

    info: {
      bg: "from-blue-50 to-cyan-50",
      border: "border-blue-200",
      icon: Sparkles,
      iconColor: "text-blue-600",
    },

  }[variant];

  const Icon = config.icon;

  return (

    <div
      className={`
        rounded-3xl
        border
        ${config.border}
        bg-gradient-to-r
        ${config.bg}
        px-8
        py-6
      `}
    >

      <div className="flex items-center justify-between gap-8">

        <div className="flex items-start gap-4">

          <div className="rounded-2xl bg-white p-3 shadow-sm">

            <Icon
              size={22}
              className={config.iconColor}
            />

          </div>

          <div>

            <h3 className="text-lg font-bold">

              {title}

            </h3>

            <p className="mt-2 text-sm text-slate-600">

              {description}

            </p>

          </div>

        </div>

        {actionLabel && actionHref && (

          <Link
            href={actionHref}
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-white
              px-5
              py-3
              font-semibold
              shadow-sm
              transition
              hover:shadow-md
            "
          >

            {actionLabel}

            <ArrowRight size={18} />

          </Link>

        )}

      </div>

    </div>

  );

}
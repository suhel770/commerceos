"use client";

import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ImageIcon,
  PackageCheck,
  Rocket,
  Search,
  Video,
} from "lucide-react";

interface HealthCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  status: "good" | "warning" | "ai";
}

function HealthCard({
  title,
  value,
  icon: Icon,
  status,
}: HealthCardProps) {
  const styles = {
    good: {
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      icon: "text-emerald-600",
      value: "text-emerald-700",
      badge: <CheckCircle2 size={15} className="text-emerald-500" />,
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-100",
      icon: "text-amber-600",
      value: "text-amber-700",
      badge: <AlertTriangle size={15} className="text-amber-500" />,
    },
    ai: {
      bg: "bg-violet-50",
      border: "border-violet-100",
      icon: "text-violet-600",
      value: "text-violet-700",
      badge: <BrainCircuit size={15} className="text-violet-500" />,
    },
  };

  const current = styles[status];

  return (
    <div
      className={`
        rounded-2xl
        border
        ${current.border}
        ${current.bg}
        px-4
        py-3
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:shadow-md
      `}
    >
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2">

          <Icon
            size={18}
            className={current.icon}
          />

          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">

            {title}

          </span>

        </div>

        {current.badge}

      </div>

      <div className="mt-4">

        <p
          className={`text-xl font-bold ${current.value}`}
        >
          {value}
        </p>

      </div>
    </div>
  );
}

export default function ProductHealthStrip() {
  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-6">

      <HealthCard
        title="Media"
        value="Images Ready"
        icon={ImageIcon}
        status="good"
      />

      <HealthCard
        title="Video"
        value="Missing"
        icon={Video}
        status="warning"
      />

      <HealthCard
        title="SEO"
        value="91 / 100"
        icon={Search}
        status="good"
      />

      <HealthCard
        title="Marketplace"
        value="2 Issues"
        icon={PackageCheck}
        status="warning"
      />

      <HealthCard
        title="AI Suggestions"
        value="5 Pending"
        icon={BrainCircuit}
        status="ai"
      />

      <HealthCard
        title="Publishing"
        value="Ready"
        icon={Rocket}
        status="good"
      />

    </section>
  );
}
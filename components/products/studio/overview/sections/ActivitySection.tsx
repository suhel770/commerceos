"use client";

import {
  Activity,
  Bot,
  CheckCircle2,
  Clock3,
  Pencil,
  UploadCloud,
} from "lucide-react";

import StudioAccordion from "../../shared/StudioAccordion";

export default function ActivitySection() {
  return (
    <StudioAccordion
      title="Activity Timeline"
      description="Track every change made to this product."
      badge="Live"
      rightSlot={
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Auto Saved
        </div>
      }
    >
      <div className="space-y-4">

        <TimelineItem
          icon={<UploadCloud size={16} />}
          title="Product Published"
          description="Published successfully to Amazon."
          user="CommerceOS"
          time="2 minutes ago"
          color="emerald"
        />

        <TimelineItem
          icon={<Bot size={16} />}
          title="AI Optimized Product Title"
          description="Generated SEO friendly marketplace title."
          user="AI Assistant"
          time="8 minutes ago"
          color="violet"
        />

        <TimelineItem
          icon={<Pencil size={16} />}
          title="Price Updated"
          description="Selling price changed from ₹679 to ₹699."
          user="Amir"
          time="23 minutes ago"
          color="blue"
        />

        <TimelineItem
          icon={<CheckCircle2 size={16} />}
          title="Inventory Synced"
          description="Inventory synchronized successfully."
          user="CommerceOS"
          time="1 hour ago"
          color="emerald"
        />

        <TimelineItem
          icon={<Clock3 size={16} />}
          title="Product Created"
          description="Master product created."
          user="Amir"
          time="Yesterday"
          color="slate"
        />

      </div>

    </StudioAccordion>
  );
}

interface TimelineItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  user: string;
  time: string;
  color:
    | "emerald"
    | "blue"
    | "violet"
    | "slate";
}

function TimelineItem({
  icon,
  title,
  description,
  user,
  time,
  color,
}: TimelineItemProps) {

  const colors = {
    emerald:
      "bg-emerald-100 text-emerald-700",

    blue:
      "bg-sky-100 text-sky-700",

    violet:
      "bg-violet-100 text-violet-700",

    slate:
      "bg-slate-100 text-slate-700",
  };

  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}
      >
        {icon}
      </div>

      <div className="flex-1">

        <div className="flex items-center justify-between">

          <h4 className="font-semibold text-slate-900">
            {title}
          </h4>

          <span className="text-xs text-slate-500">
            {time}
          </span>

        </div>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {description}
        </p>

        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">

          <Activity size={14} />

          {user}

        </div>

      </div>

    </div>
  );
}
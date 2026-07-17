"use client";

import {
  ListTree,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import StudioAccordion from "../../shared/StudioAccordion";

export default function AttributesSection() {
  return (
    <StudioAccordion
      title="Marketplace Attributes"
      description="Complete category-specific attributes required by marketplaces."
      badge="86% Complete"
      rightSlot={
        <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          4 Missing
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-4">

        <AttributeCard
          title="Required"
          value="28"
          color="emerald"
        />

        <AttributeCard
          title="Completed"
          value="24"
          color="blue"
        />

        <AttributeCard
          title="Missing"
          value="4"
          color="amber"
        />

        <AttributeCard
          title="Marketplace Ready"
          value="86%"
          color="violet"
        />

      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">

        <AttributeRow
          name="Material"
          value="EVA"
          status="Completed"
        />

        <AttributeRow
          name="Closure"
          value="Slip-On"
          status="Completed"
        />

        <AttributeRow
          name="Heel Type"
          value="Flat"
          status="Completed"
        />

        <AttributeRow
          name="Water Resistance"
          value="-"
          status="Missing"
        />

        <AttributeRow
          name="Occasion"
          value="-"
          status="Missing"
        />

      </div>

      <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">

        <div className="flex items-center gap-3">

          <Sparkles
            size={18}
            className="text-violet-600"
          />

          <h3 className="font-semibold text-violet-700">

            AI Attribute Assistant

          </h3>

        </div>

        <p className="mt-3 text-sm leading-7 text-violet-700">

          AI detected enough information from your images
          and title to automatically fill the remaining
          marketplace attributes.

        </p>

        <div className="mt-5 flex gap-3">

          <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white">

            Auto Fill Attributes

          </button>

          <button className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700">

            Review Suggestions

          </button>

        </div>

      </div>

    </StudioAccordion>
  );
}

interface AttributeCardProps {
  title: string;
  value: string;
  color:
    | "emerald"
    | "blue"
    | "amber"
    | "violet";
}

function AttributeCard({
  title,
  value,
  color,
}: AttributeCardProps) {

  const styles = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    blue:
      "border-sky-200 bg-sky-50 text-sky-700",

    amber:
      "border-amber-200 bg-amber-50 text-amber-700",

    violet:
      "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    <div
      className={`rounded-2xl border p-5 ${styles[color]}`}
    >
      <div className="flex items-center justify-between">

        <ListTree size={18} />

      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wider opacity-70">

        {title}

      </p>

      <h3 className="mt-2 text-2xl font-bold">

        {value}

      </h3>

    </div>
  );
}

interface AttributeRowProps {
  name: string;
  value: string;
  status: string;
}

function AttributeRow({
  name,
  value,
  status,
}: AttributeRowProps) {
  const complete = status === "Completed";

  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 last:border-0">

      <div>

        <p className="font-semibold text-slate-900">

          {name}

        </p>

        <p className="mt-1 text-sm text-slate-500">

          {value}

        </p>

      </div>

      <div
        className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
          complete
            ? "bg-emerald-100 text-emerald-700"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        {complete ? (
          <CheckCircle2 size={14} />
        ) : (
          <AlertTriangle size={14} />
        )}

        {status}

      </div>

    </div>
  );
}
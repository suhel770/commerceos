"use client";

import {
  ShieldCheck,
  AlertTriangle,
  Globe2,
  FileCheck,
  Sparkles,
} from "lucide-react";

import StudioAccordion from "../../shared/StudioAccordion";

export default function ComplianceSection() {
  return (
    <StudioAccordion
      title="Compliance"
      description="Regulatory information required across marketplaces."
      badge="82% Complete"
      rightSlot={
        <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          3 Pending
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-4">

        <ComplianceCard
          icon={<ShieldCheck size={18} />}
          title="Compliance"
          value="82%"
          color="emerald"
        />

        <ComplianceCard
          icon={<FileCheck size={18} />}
          title="Documents"
          value="5"
          color="blue"
        />

        <ComplianceCard
          icon={<Globe2 size={18} />}
          title="Country"
          value="India"
          color="violet"
        />

        <ComplianceCard
          icon={<AlertTriangle size={18} />}
          title="Warnings"
          value="3"
          color="amber"
        />

      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">

        <ComplianceRow
          label="Country of Origin"
          value="India"
          status="Complete"
        />

        <ComplianceRow
          label="HSN Code"
          value="64029990"
          status="Complete"
        />

        <ComplianceRow
          label="GST Rate"
          value="18%"
          status="Complete"
        />

        <ComplianceRow
          label="Manufacturer"
          value="Pending"
          status="Required"
        />

        <ComplianceRow
          label="Importer"
          value="Pending"
          status="Required"
        />

        <ComplianceRow
          label="Warranty"
          value="Not Configured"
          status="Optional"
        />

      </div>

      <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">

        <div className="flex items-center gap-3">

          <Sparkles
            size={18}
            className="text-violet-600"
          />

          <h3 className="font-semibold text-violet-700">

            AI Compliance Advisor

          </h3>

        </div>

        <p className="mt-3 text-sm leading-7 text-violet-700">

          CommerceOS detected missing manufacturer
          information required for Amazon and ONDC.
          Completing these fields will improve
          publishing success.

        </p>

        <div className="mt-5 flex flex-wrap gap-3">

          <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white">

            Complete Compliance

          </button>

          <button className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700">

            Review Requirements

          </button>

        </div>

      </div>

    </StudioAccordion>
  );
}

interface ComplianceCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: "emerald" | "blue" | "violet" | "amber";
}

function ComplianceCard({
  icon,
  title,
  value,
  color,
}: ComplianceCardProps) {

  const styles = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    blue:
      "border-sky-200 bg-sky-50 text-sky-700",

    violet:
      "border-violet-200 bg-violet-50 text-violet-700",

    amber:
      "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <div className={`rounded-2xl border p-5 ${styles[color]}`}>

      <div className="flex items-center justify-between">
        {icon}
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

function ComplianceRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: string;
}) {
  const colors = {
    Complete: "bg-emerald-100 text-emerald-700",
    Required: "bg-amber-100 text-amber-700",
    Optional: "bg-slate-100 text-slate-700",
  } as const;

  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 last:border-0">

      <div>

        <p className="font-semibold text-slate-900">
          {label}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {value}
        </p>

      </div>

      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          colors[status as keyof typeof colors]
        }`}
      >
        {status}
      </span>

    </div>
  );
}
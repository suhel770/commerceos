"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Sparkles,
} from "lucide-react";

import { useStudio } from "../../context/StudioContext";
import StudioCard from "../../shared/StudioCard";
import StudioProperty from "../../shared/StudioProperty";
import StudioSection from "../../shared/StudioSection";
import { computeDetailedChannelReadiness } from "@/lib/listing-engine/readiness/compute-readiness";

export default function AttributesSection() {
  const {
    listing,
    updateAttribute,
    openFieldEditor,
  } = useStudio();

  const channelReadiness = useMemo(() => {
    if (!listing) return [];
    return computeDetailedChannelReadiness(listing);
  }, [listing]);

  if (!listing) {
    return null;
  }

  const attributes = listing.attributes;

  return (
    <StudioCard>
      <StudioSection
        title="Marketplace Attributes"
        description="Complete marketplace-specific attributes to maximize listing quality."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {attributes.map((attribute) => (
            <StudioProperty
              key={attribute.key}
              title={attribute.label}
              value={
                attribute.value
                  ? String(attribute.value)
                  : "Not Assigned"
              }
              compact
              onEdit={() =>
                openFieldEditor({
                  title: attribute.label,
                  value: String(attribute.value ?? ""),
                  description:
                    "Marketplace attribute value.",
                  onSave: (newValue) =>
                    updateAttribute({
                      ...attribute,
                      value: newValue,
                    }),
                })
              }
            />
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Marketplace Channel
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Attribute Coverage
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Channel Specification Details
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {channelReadiness.map((ch) => {
                const isReady = ch.factors.attributes.isReady;
                return (
                  <tr key={ch.marketplace}>
                    <td className="px-5 py-4 font-bold text-slate-800">
                      {ch.name}
                    </td>

                    <td className="px-5 py-4">
                      {isReady ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 size={13} />
                          Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                          <CircleDashed size={13} />
                          Action Required
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-xs font-medium text-slate-600">
                      {ch.factors.attributes.message || (isReady ? "All required channel attributes completed" : "Channel specific attributes need attention")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">
          <div className="flex items-center gap-3">
            <Sparkles
              size={18}
              className="text-violet-600"
            />

            <h3 className="font-semibold text-violet-700">
              CommerceOS AI
            </h3>
          </div>

          <p className="mt-3 text-sm leading-7 text-violet-700">
            AI can automatically generate and map marketplace-specific
            attributes from your product title, description, specifications
            and images.
          </p>
        </div>
      </StudioSection>
    </StudioCard>
  );
}

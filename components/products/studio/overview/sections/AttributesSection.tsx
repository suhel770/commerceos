"use client";

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

export default function AttributesSection() {
  const {
    listing,
    updateAttribute,
    openFieldEditor,
  } = useStudio();

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
                  Marketplace
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Required Fields
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {[
                {
                  marketplace: "Amazon",
                  status: "Complete",
                  pending: 0,
                },
                {
                  marketplace: "Flipkart",
                  status: "Pending",
                  pending: 3,
                },
                {
                  marketplace: "Meesho",
                  status: "Pending",
                  pending: 2,
                },
                {
                  marketplace: "Shopify",
                  status: "Complete",
                  pending: 0,
                },
              ].map((row) => (
                <tr key={row.marketplace}>
                  <td className="px-5 py-4 font-medium text-slate-800">
                    {row.marketplace}
                  </td>

                  <td className="px-5 py-4">
                    {row.pending === 0 ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 size={14} />
                        {row.status}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        <CircleDashed size={14} />
                        {row.status}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {row.pending === 0
                      ? "All attributes completed"
                      : `${row.pending} attributes remaining`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle
              size={18}
              className="text-amber-600"
            />

            <h3 className="font-semibold text-amber-700">
              Missing Attributes
            </h3>
          </div>

          <p className="mt-3 text-sm leading-7 text-amber-700">
            Flipkart and Meesho require additional mandatory attributes
            before the listing can be published.
          </p>
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

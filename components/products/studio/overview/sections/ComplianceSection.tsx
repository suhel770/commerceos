"use client";

import {
  ShieldCheck,
  FileCheck2,
  BadgeCheck,
  Sparkles,
} from "lucide-react";

import StudioField from "../../shared/StudioField";
import { useStudio } from "../../context/StudioContext";

export default function ComplianceSection() {
  const { listing, setActiveWorkspace } = useStudio();

  const hasHsn = Boolean(listing?.identity.hsn?.trim());
  const hasTax = Boolean(listing?.identity.taxCode?.trim());
  const hasOrigin = Boolean(listing?.compliance.countryOfOrigin?.trim());
  const hasMfg = Boolean(listing?.compliance.manufacturerName?.trim() || listing?.identity.manufacturer?.trim());
  const hasConsumerCare = Boolean(listing?.compliance.consumerCareEmail?.trim() || listing?.compliance.consumerCarePhone?.trim());

  let score = 0;
  if (hasHsn) score += 25;
  if (hasTax) score += 20;
  if (hasOrigin) score += 20;
  if (hasMfg) score += 20;
  if (hasConsumerCare) score += 15;

  const marketplaceCompliance = (listing?.marketplaces || []).map((m) => ({
    name: m.marketplace.toUpperCase(),
    status: m.enabled ? "Active" : "Not Enabled",
    color: m.enabled ? "emerald" : "orange",
  }));

  const requiredDocuments = (listing?.compliance?.documents || []).map((d) => ({
    title: d.name,
    status: d.url ? "Uploaded" : "Pending",
  }));

  const complianceTimeline = (listing?.activity || [])
    .filter((a) => a.type?.toLowerCase().includes("compliance") || a.title?.toLowerCase().includes("compliance"))
    .map((a) => ({
      title: a.title,
      date: a.timestamp,
    }));

  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div>

          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Compliance Workspace
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Compliance & Regulations
          </h2>

          <p className="mt-2 max-w-3xl text-[15px] leading-7 text-slate-500">
            Manage GST, HSN, Legal Metrology declarations, manufacturer details,
            and regulatory requirements across your marketplace channels.
          </p>

        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </div>

            <div>

              <p className="text-xs text-slate-500">
                Compliance Score
              </p>

              <h3 className="text-2xl font-bold text-emerald-700">
                {score}%
              </h3>

            </div>

          </div>

        </div>

      </div>

      <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center justify-between">

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                <FileCheck2 className="h-5 w-5 text-emerald-600" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Tax & Legal Metrology
                </h3>

                <p className="text-sm text-slate-500">
                  Mandatory marketplace information
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveWorkspace("compliance")}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              Edit Compliance →
            </button>

          </div>

          <div className="space-y-5">

            <StudioField
              label="GST Rate Slab"
              value={listing?.identity.taxCode || "18% (Standard)"}
            />

            <StudioField
              label="HSN Code"
              value={listing?.identity.hsn || "Not Configured"}
            />

            <StudioField
              label="Country of Origin"
              value={listing?.compliance.countryOfOrigin || "India"}
            />

            <StudioField
              label="Manufacturer Name"
              value={listing?.compliance.manufacturerName || listing?.identity.manufacturer || "Not Configured"}
            />

            <StudioField
              label="Net Quantity"
              value={listing?.compliance.netQuantity || "1 N"}
            />

            <StudioField
              label="Consumer Care Contact"
              value={listing?.compliance.consumerCareEmail || listing?.compliance.consumerCarePhone || "Configured in Settings"}
            />

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <BadgeCheck className="h-5 w-5 text-blue-600" />
            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Certifications
              </h3>

              <p className="text-sm text-slate-500">
                Required certificates and declarations
              </p>

            </div>

          </div>

          <div className="space-y-5">

            <StudioField
              label="BIS Certification"
              value="—"
            />

            <StudioField
              label="Quality Certificate"
              value="—"
            />

            <StudioField
              label="Safety Declaration"
              value="—"
            />

            <StudioField
              label="Packaging Compliance"
              value="—"
            />

            <StudioField
              label="Marketplace Validation"
              value="—"
            />

          </div>

        </div>

      </div>
            <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-slate-900">
              Marketplace Compliance
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Validation status across connected marketplaces.
            </p>

          </div>

          <div className="space-y-4">

            {marketplaceCompliance.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              marketplaceCompliance.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-5"
                >
                  <div>

                    <h4 className="font-semibold text-slate-900">
                      {item.name}
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      Product compliance validation
                    </p>

                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.color === "emerald"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-orange-50 text-orange-700"
                    }`}
                  >
                    {item.status}
                  </span>

                </div>
              ))
            )}

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-slate-900">
              CommerceOS Compliance Intelligence
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              AI continuously checks your product against marketplace
              policies.
            </p>

          </div>

          <div className="space-y-4">

            <p className="text-sm text-slate-500">No data yet</p>

          </div>

        </div>

      </div>
            <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-slate-900">
              Required Documents
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Documents linked with this product.
            </p>

          </div>

          <div className="space-y-4">

            {requiredDocuments.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              requiredDocuments.map((doc) => (
                <div
                  key={doc.title}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-5"
                >
                  <div>

                    <h4 className="font-semibold text-slate-900">
                      {doc.title}
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      Compliance document
                    </p>

                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {doc.status}
                  </span>

                </div>
              ))
            )}

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-slate-900">
              Compliance Timeline
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Recent validation history.
            </p>

          </div>

          <div className="space-y-5">

            {complianceTimeline.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              complianceTimeline.map((event) => (
                <div
                  key={event.title}
                  className="flex gap-4"
                >

                  <div className="mt-2 h-3 w-3 rounded-full bg-emerald-500" />

                  <div>

                    <h4 className="font-semibold text-slate-900">
                      {event.title}
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      {event.date}
                    </p>

                  </div>

                </div>
              ))
            )}

          </div>

        </div>

      </div>

            {/* Workspace Footer */}

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h3 className="text-xl font-semibold text-slate-900">
              Compliance Workspace Status
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Regulatory information, tax configuration, certifications,
              manufacturer details and marketplace validations sync from
              your product data. CommerceOS monitors policy changes and
              alerts you before compliance issues affect your listings.
            </p>

          </div>

          <div className="flex gap-10">

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Documents
              </p>

              <h3 className="mt-2 text-4xl font-bold text-emerald-600">
                0
              </h3>

            </div>

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Validations
              </p>

              <h3 className="mt-2 text-4xl font-bold text-blue-600">
                0/0
              </h3>

            </div>

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                AI Score
              </p>

              <h3 className="mt-2 text-4xl font-bold text-violet-600">
                0%
              </h3>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

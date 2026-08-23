"use client";

import {
  Layers3,
  Palette,
  Ruler,
  Sparkles,
} from "lucide-react";

import StudioField from "../../shared/StudioField";

const variantMatrix: string[][] = [];

const marketplaceMapping: Array<{
  marketplace: string;
  status: string;
  attributes: string;
}> = [];

const variantPerformance: Array<[string, number]> = [];

export default function VariantsSection() {
  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div>

          <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
            <Layers3 className="h-4 w-4" />
            Variants Workspace
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Product Variants
          </h2>

          <p className="mt-2 max-w-3xl text-[15px] leading-7 text-slate-500">
            Create and manage all product variations including size,
            color, SKU mapping and marketplace variant relationships
            from one master catalog.
          </p>

        </div>

        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
              <Sparkles className="h-5 w-5 text-orange-600" />
            </div>

            <div>

              <p className="text-xs text-slate-500">
                Variant Health
              </p>

              <h3 className="text-2xl font-bold text-orange-700">
                0%
              </h3>

            </div>

          </div>

        </div>

      </div>

      <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
              <Layers3 className="h-5 w-5 text-orange-600" />
            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Variant Group
              </h3>

              <p className="text-sm text-slate-500">
                Master variant configuration
              </p>

            </div>

          </div>

          <div className="space-y-5">

            <StudioField
              label="Variant Theme"
              value="—"
            />

            <StudioField
              label="Parent SKU"
              value="—"
            />

            <StudioField
              label="Total Variants"
              value="0"
            />

            <StudioField
              label="Marketplace Family"
              value="—"
            />

            <StudioField
              label="Default Variant"
              value="—"
            />

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <Palette className="h-5 w-5 text-blue-600" />
            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Variant Attributes
              </h3>

              <p className="text-sm text-slate-500">
                Configure available options
              </p>

            </div>

          </div>

          <div className="space-y-5">

            <StudioField
              label="Colors"
              value="—"
            />

            <StudioField
              label="Sizes"
              value="—"
            />

            <StudioField
              label="Material"
              value="—"
            />

            <StudioField
              label="Variant Images"
              value="—"
            />

            <StudioField
              label="Barcode Mapping"
              value="—"
            />

          </div>

        </div>

      </div>
            <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <Ruler className="h-5 w-5 text-emerald-600" />
            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Variant Matrix
              </h3>

              <p className="text-sm text-slate-500">
                Generated combinations
              </p>

            </div>

          </div>

          {variantMatrix.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">

              <table className="w-full text-sm">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-4 py-3 text-left font-semibold">
                      SKU
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Color
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Size
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Stock
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {variantMatrix.map((row) => (
                    <tr
                      key={row[0]}
                      className="border-t border-slate-100"
                    >
                      {row.map((cell) => (
                        <td
                          key={cell}
                          className="px-4 py-3"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                AI Variant Intelligence
              </h3>

              <p className="text-sm text-slate-500">
                Optimize your variant catalog automatically
              </p>

            </div>

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
              Marketplace Variant Mapping
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Verify how CommerceOS maps variants to every connected
              marketplace.
            </p>

          </div>

          <div className="space-y-4">

            {marketplaceMapping.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              marketplaceMapping.map((item) => (
                <div
                  key={item.marketplace}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-5"
                >
                  <div>

                    <h4 className="font-semibold text-slate-900">
                      {item.marketplace}
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      {item.attributes}
                    </p>

                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === "Linked"
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
              Variant Performance
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Sales contribution by variant.
            </p>

          </div>

          <div className="space-y-5">

            {variantPerformance.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              variantPerformance.map(([label, value]) => (
                <div key={label}>

                  <div className="mb-2 flex items-center justify-between">

                    <span className="text-sm font-medium text-slate-700">
                      {label}
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {value} Sold
                    </span>

                  </div>

                  <div className="h-2 rounded-full bg-slate-100">

                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{
                        width: `${Number(value) * 2}%`,
                      }}
                    />

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
              Variant Workspace Status
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Your variant family syncs across supported marketplaces once
              configured. CommerceOS maintains parent-child relationships,
              SKU mappings and marketplace-specific variant attributes
              automatically.
            </p>

          </div>

          <div className="flex gap-10">

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Variants
              </p>

              <h3 className="mt-2 text-4xl font-bold text-orange-600">
                0
              </h3>

            </div>

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Mapping
              </p>

              <h3 className="mt-2 text-4xl font-bold text-emerald-600">
                0%
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

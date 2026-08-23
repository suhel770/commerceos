"use client";

import {
  ImageIcon,
  Video,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import StudioField from "../../shared/StudioField";

export default function MediaSection() {
  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div>

          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            <ImageIcon className="h-4 w-4" />
            Media Workspace
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Product Media
          </h2>

          <p className="mt-2 max-w-3xl text-[15px] leading-7 text-slate-500">
            Manage marketplace-ready product images, lifestyle photos,
            videos and AI generated creative assets from one place.
          </p>

        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>

            <div>

              <p className="text-xs text-slate-500">
                AI Assets
              </p>

              <h3 className="text-2xl font-bold text-violet-700">
                0 Ready
              </h3>

            </div>

          </div>

        </div>

      </div>

      <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
              <ImageIcon className="h-5 w-5 text-violet-600" />
            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Image Assets
              </h3>

              <p className="text-sm text-slate-500">
                Primary gallery used across marketplaces
              </p>

            </div>

          </div>

          <div className="grid grid-cols-4 gap-4">

            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square rounded-2xl border border-dashed border-slate-300 bg-slate-50"
              />
            ))}

          </div>

          <div className="mt-6 space-y-5">

            <StudioField
              label="Primary Image"
              value="—"
            />

            <StudioField
              label="Total Images"
              value="0"
            />

            <StudioField
              label="Marketplace Resolution"
              value="—"
            />

          </div>

        </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <Video className="h-5 w-5 text-blue-600" />
            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Videos & Marketplace Assets
              </h3>

              <p className="text-sm text-slate-500">
                Videos, 360° media and marketplace-specific creatives
              </p>

            </div>

          </div>

          <div className="space-y-5">

            <StudioField
              label="Product Video"
              value="—"
            />

            <StudioField
              label="360° Images"
              value="—"
            />

            <StudioField
              label="Lifestyle Images"
              value="0 Uploaded"
            />

            <StudioField
              label="Infographics"
              value="0 Uploaded"
            />

            <StudioField
              label="Marketplace Banner"
              value="—"
            />

          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <div className="flex items-start gap-3">

              <CheckCircle2 className="mt-1 h-5 w-5 text-slate-400" />

              <div>

                <h4 className="font-semibold text-slate-900">
                  Marketplace Validation
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  No data yet
                </p>

              </div>

            </div>

          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <div className="flex items-start gap-3">

              <Sparkles className="mt-1 h-5 w-5 text-slate-400" />

              <div>

                <h4 className="font-semibold text-slate-900">
                  AI Recommendation
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  No data yet
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
            <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Media Validation
              </h3>

              <p className="text-sm text-slate-500">
                Automatic quality checks before publishing
              </p>

            </div>

          </div>

          <div className="space-y-4">

            <p className="text-sm text-slate-500">No data yet</p>

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                AI Media Studio
              </h3>

              <p className="text-sm text-slate-500">
                Generate marketplace-ready creative assets instantly
              </p>

            </div>

          </div>

          <div className="space-y-4">

            <p className="text-sm text-slate-500">No data yet</p>

          </div>

        </div>

      </div>
            {/* Workspace Footer */}

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h3 className="text-xl font-semibold text-slate-900">
              Media Workspace Status
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Your media library syncs across connected marketplaces once
              assets are uploaded. Add images and creatives to improve
              conversion and marketplace ranking.
            </p>

          </div>

          <div className="flex gap-10">

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Images
              </p>

              <h3 className="mt-2 text-4xl font-bold text-blue-600">
                0
              </h3>

            </div>

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Validation
              </p>

              <h3 className="mt-2 text-4xl font-bold text-emerald-600">
                0%
              </h3>

            </div>

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                AI Assets
              </p>

              <h3 className="mt-2 text-4xl font-bold text-violet-600">
                0
              </h3>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

"use client";

import {
  Globe,
  Send,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import StudioField from "../../shared/StudioField";

const publishingChecklist: string[] = [];

const connectedMarketplaces: Array<{
  marketplace: string;
  status: string;
  listings: string;
  color: string;
}> = [];

const publishingHistory: Array<{
  title: string;
  date: string;
  status: string;
}> = [];

const channelReadiness: Array<{
  channel: string;
  score: string;
}> = [];

export default function PublishingSection() {
  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div>

          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Globe className="h-4 w-4" />
            Publishing Workspace
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Marketplace Publishing
          </h2>

          <p className="mt-2 max-w-3xl text-[15px] leading-7 text-slate-500">
            Publish products from one master listing across every connected
            marketplace while CommerceOS automatically transforms,
            validates and optimizes marketplace-specific data.
          </p>

        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">

              <Sparkles className="h-5 w-5 text-indigo-600" />

            </div>

            <div>

              <p className="text-xs text-slate-500">
                Publishing Readiness
              </p>

              <h3 className="text-2xl font-bold text-indigo-700">
                0%
              </h3>

            </div>

          </div>

        </div>

      </div>

      <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">

              <Send className="h-5 w-5 text-indigo-600" />

            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Publishing Configuration
              </h3>

              <p className="text-sm text-slate-500">
                Default publishing preferences
              </p>

            </div>

          </div>

          <div className="space-y-5">

            <StudioField
              label="Publishing Mode"
              value="—"
            />

            <StudioField
              label="Listing Visibility"
              value="—"
            />

            <StudioField
              label="Default Marketplace"
              value="—"
            />

            <StudioField
              label="Inventory Sync"
              value="—"
            />

            <StudioField
              label="Price Sync"
              value="—"
            />

            <StudioField
              label="Auto Republish"
              value="—"
            />

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">

              <CheckCircle2 className="h-5 w-5 text-emerald-600" />

            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Publishing Checklist
              </h3>

              <p className="text-sm text-slate-500">
                Pre-publication validation
              </p>

            </div>

          </div>

          <div className="space-y-4">

            {publishingChecklist.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              publishingChecklist.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4"
                >

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">

                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />

                  </div>

                  <span className="font-medium text-slate-800">
                    {item}
                  </span>

                </div>
              ))
            )}

          </div>

        </div>

      </div>
            <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-slate-900">
              Connected Marketplaces
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Current publishing status across all channels.
            </p>

          </div>

          <div className="space-y-4">

            {connectedMarketplaces.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              connectedMarketplaces.map((marketplace) => (
                <div
                  key={marketplace.marketplace}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between">

                    <div>

                      <h4 className="font-semibold text-slate-900">
                        {marketplace.marketplace}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        {marketplace.listings}
                      </p>

                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        marketplace.color === "emerald"
                          ? "bg-emerald-50 text-emerald-700"
                          : marketplace.color === "blue"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {marketplace.status}
                    </span>

                  </div>

                </div>
              ))
            )}

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-slate-900">
              CommerceOS Publishing Intelligence
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              AI validates every marketplace before publishing.
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
              Publishing History
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Recent publishing activities across connected channels.
            </p>

          </div>

          <div className="space-y-5">

            {publishingHistory.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              publishingHistory.map((event) => (
                <div
                  key={event.title}
                  className="flex items-start justify-between rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex gap-4">

                    <div className="mt-2 h-3 w-3 rounded-full bg-indigo-500" />

                    <div>

                      <h4 className="font-semibold text-slate-900">
                        {event.title}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        {event.date}
                      </p>

                    </div>

                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      event.status === "Pending"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {event.status}
                  </span>

                </div>
              ))
            )}

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-slate-900">
              Channel Readiness
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Marketplace-specific publishing health.
            </p>

          </div>

          <div className="space-y-5">

            {channelReadiness.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              channelReadiness.map((channel) => (
                <div key={channel.channel}>

                  <div className="mb-2 flex items-center justify-between">

                    <span className="font-medium text-slate-700">
                      {channel.channel}
                    </span>

                    <span className="font-semibold text-slate-900">
                      {channel.score}
                    </span>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{
                        width: channel.score,
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
              Publishing Workspace Status
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Your master listing syncs across connected marketplaces once
              configured. CommerceOS validates listing quality, transforms
              marketplace-specific attributes, synchronizes inventory and
              pricing, and monitors publishing health in real time.
            </p>

          </div>

          <div className="flex gap-10">

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Channels
              </p>

              <h3 className="mt-2 text-4xl font-bold text-indigo-600">
                0
              </h3>

            </div>

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Live Listings
              </p>

              <h3 className="mt-2 text-4xl font-bold text-emerald-600">
                0
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

"use client";

import {
  Share2,
  Link2,
  Sparkles,
  Globe2,
} from "lucide-react";

import StudioField from "../../shared/StudioField";

const connectedChannels: string[] = [];

const marketplaceStatus: Array<{
  channel: string;
  status: string;
  sync: string;
  color: string;
}> = [];

const syncTimeline: Array<{
  title: string;
  date: string;
  color: string;
}> = [];

const channelPerformance: Array<{
  channel: string;
  score: string;
}> = [];

export default function ChannelsSection() {
  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div>

          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
            <Share2 className="h-4 w-4" />
            Channel Management
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Sales Channels
          </h2>

          <p className="mt-2 max-w-3xl text-[15px] leading-7 text-slate-500">
            Manage marketplace connections, synchronization rules,
            publishing preferences and channel-specific configurations
            from one centralized CommerceOS workspace.
          </p>

        </div>

        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">

              <Sparkles className="h-5 w-5 text-cyan-600" />

            </div>

            <div>

              <p className="text-xs text-slate-500">
                Channel Health
              </p>

              <h3 className="text-2xl font-bold text-cyan-700">
                0%
              </h3>

            </div>

          </div>

        </div>

      </div>

      <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50">

              <Globe2 className="h-5 w-5 text-cyan-600" />

            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Channel Configuration
              </h3>

              <p className="text-sm text-slate-500">
                Global synchronization settings
              </p>

            </div>

          </div>

          <div className="space-y-5">

            <StudioField
              label="Default Sales Channel"
              value="—"
            />

            <StudioField
              label="Inventory Synchronization"
              value="—"
            />

            <StudioField
              label="Price Synchronization"
              value="—"
            />

            <StudioField
              label="Order Synchronization"
              value="—"
            />

            <StudioField
              label="Catalog Synchronization"
              value="—"
            />

            <StudioField
              label="Status Synchronization"
              value="—"
            />

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">

              <Link2 className="h-5 w-5 text-emerald-600" />

            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Connected Channels
              </h3>

              <p className="text-sm text-slate-500">
                Active marketplace integrations
              </p>

            </div>

          </div>

          <div className="space-y-4">

            {connectedChannels.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              connectedChannels.map((channel) => (
                <div
                  key={channel}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4"
                >

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">

                    <Link2 className="h-4 w-4 text-emerald-600" />

                  </div>

                  <span className="font-medium text-slate-800">
                    {channel}
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
              Marketplace Status
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Health and synchronization status across connected channels.
            </p>

          </div>

          <div className="space-y-4">

            {marketplaceStatus.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              marketplaceStatus.map((channel) => (
                <div
                  key={channel.channel}
                  className="rounded-2xl border border-slate-200 p-5"
                >

                  <div className="flex items-start justify-between">

                    <div>

                      <h4 className="font-semibold text-slate-900">
                        {channel.channel}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        {channel.sync}
                      </p>

                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        channel.color === "emerald"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {channel.status}
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
              CommerceOS Channel Intelligence
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              AI monitors synchronization health across every marketplace.
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
              Synchronization Timeline
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Latest synchronization events across all connected channels.
            </p>

          </div>

          <div className="space-y-5">

            {syncTimeline.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              syncTimeline.map((event) => (
                <div
                  key={event.title}
                  className="flex gap-4"
                >

                  <div
                    className={`mt-2 h-3 w-3 rounded-full ${event.color}`}
                  />

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

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-slate-900">
              Channel Performance
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Health score of every connected sales channel.
            </p>

          </div>

          <div className="space-y-5">

            {channelPerformance.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              channelPerformance.map((channel) => (
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
                      className="h-full rounded-full bg-cyan-600"
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
              Channel Workspace Status
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Connected sales channels are monitored by CommerceOS.
              Inventory, pricing, catalog updates and listing status sync
              automatically while AI detects failed synchronizations and
              marketplace outages before they impact your business.
            </p>

          </div>

          <div className="flex gap-10">

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Connected
              </p>

              <h3 className="mt-2 text-4xl font-bold text-cyan-600">
                0
              </h3>

            </div>

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Live Sync
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

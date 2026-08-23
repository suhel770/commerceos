"use client";

import {
  Activity,
  Clock3,
  Sparkles,
  History,
} from "lucide-react";

import StudioField from "../../shared/StudioField";

const recentEvents: string[] = [];

const auditTimeline: Array<{
  title: string;
  user: string;
  time: string;
  color: string;
}> = [];

const userActivity: Array<{
  user: string;
  action: string;
  role: string;
  time: string;
}> = [];

const systemEvents: Array<{
  event: string;
  status: string;
  progress: string;
}> = [];

export default function ActivitySection() {
  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div>

          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <Activity className="h-4 w-4" />
            Activity Workspace
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Product Activity & Audit Trail
          </h2>

          <p className="mt-2 max-w-3xl text-[15px] leading-7 text-slate-500">
            Every action performed on this product is automatically
            recorded by CommerceOS. Review edits, AI changes,
            marketplace events, publishing history and user activity
            from a single audit timeline.
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">

              <Sparkles className="h-5 w-5 text-slate-700" />

            </div>

            <div>

              <p className="text-xs text-slate-500">
                Activity Health
              </p>

              <h3 className="text-2xl font-bold text-slate-900">
                0%
              </h3>

            </div>

          </div>

        </div>

      </div>

      <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">

              <History className="h-5 w-5 text-slate-700" />

            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Audit Configuration
              </h3>

              <p className="text-sm text-slate-500">
                Activity logging settings
              </p>

            </div>

          </div>

          <div className="space-y-5">

            <StudioField
              label="Activity Logging"
              value="—"
            />

            <StudioField
              label="Version History"
              value="—"
            />

            <StudioField
              label="AI Changes"
              value="—"
            />

            <StudioField
              label="Marketplace Events"
              value="—"
            />

            <StudioField
              label="Retention Period"
              value="—"
            />

            <StudioField
              label="Last Updated"
              value="—"
            />

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">

              <Clock3 className="h-5 w-5 text-blue-600" />

            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Recent Events
              </h3>

              <p className="text-sm text-slate-500">
                Latest product activities
              </p>

            </div>

          </div>

          <div className="space-y-4">

            {recentEvents.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              recentEvents.map((event) => (
                <div
                  key={event}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4"
                >

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">

                    <Activity className="h-4 w-4 text-blue-600" />

                  </div>

                  <span className="font-medium text-slate-800">
                    {event}
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
              Audit Timeline
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Chronological history of all product changes.
            </p>

          </div>

          <div className="space-y-5">

            {auditTimeline.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              auditTimeline.map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4"
                >

                  <div
                    className={`mt-2 h-3 w-3 rounded-full ${item.color}`}
                  />

                  <div className="flex-1">

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <h4 className="font-semibold text-slate-900">
                          {item.title}
                        </h4>

                        <p className="mt-1 text-sm text-slate-500">
                          {item.user}
                        </p>

                      </div>

                      <span className="text-sm text-slate-500">
                        {item.time}
                      </span>

                    </div>

                  </div>

                </div>
              ))
            )}

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-slate-900">
              CommerceOS Activity Intelligence
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              AI continuously monitors user activity, system events and
              marketplace operations.
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
              User Activity
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Recent actions performed by users and system services.
            </p>

          </div>

          <div className="space-y-4">

            {userActivity.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              userActivity.map((activity) => (
                <div
                  key={`${activity.user}-${activity.action}`}
                  className="rounded-2xl border border-slate-200 p-5"
                >

                  <div className="flex items-start justify-between">

                    <div>

                      <h4 className="font-semibold text-slate-900">
                        {activity.user}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        {activity.action}
                      </p>

                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {activity.role}
                    </span>

                  </div>

                  <p className="mt-3 text-sm text-slate-500">
                    {activity.time}
                  </p>

                </div>
              ))
            )}

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-slate-900">
              System Events
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Automatic events generated by CommerceOS services.
            </p>

          </div>

          <div className="space-y-5">

            {systemEvents.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              systemEvents.map((event) => (
                <div key={event.event}>

                  <div className="mb-2 flex items-center justify-between">

                    <div>

                      <h4 className="font-semibold text-slate-900">
                        {event.event}
                      </h4>

                      <p className="text-sm text-slate-500">
                        {event.status}
                      </p>

                    </div>

                    <span className="font-semibold text-slate-900">
                      {event.progress}
                    </span>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                    <div
                      className="h-full rounded-full bg-slate-700"
                      style={{
                        width: event.progress,
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
              Activity Workspace Status
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              CommerceOS maintains a complete audit trail for every product
              operation. Every user action, AI-generated modification,
              synchronization event, publishing activity and system process
              is securely recorded, versioned and available for review,
              ensuring enterprise-grade transparency, accountability and
              compliance across your organization.
            </p>

          </div>

          <div className="flex gap-10">

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Events
              </p>

              <h3 className="mt-2 text-4xl font-bold text-slate-900">
                0
              </h3>

            </div>

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Versions
              </p>

              <h3 className="mt-2 text-4xl font-bold text-indigo-600">
                0
              </h3>

            </div>

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Integrity
              </p>

              <h3 className="mt-2 text-4xl font-bold text-emerald-600">
                —
              </h3>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

"use client";

import { useStudio } from "../../../context/StudioContext";
import { Panel, EmptyState } from "./workspace-ui";

export function ActivityWorkspace() {
  const {
    listing,
    engine,
  } = useStudio();

  if (!listing) return null;

  const events = [
    ...listing.activity.map(
      (event) => ({
        ...event,
        source: "audit" as const,
      }),
    ),
    ...(engine?.activity.getTimeline() ??
      []).map((event) => ({
      ...event,
      source: "session" as const,
    })),
  ].sort(
    (left, right) =>
      new Date(
        right.timestamp,
      ).getTime() -
      new Date(
        left.timestamp,
      ).getTime(),
  );
  const history = engine?.history.state;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Panel
          title="Activity Timeline"
          description="Persisted audit records and in-session editing events."
        >
          {events.length === 0 ? (
            <EmptyState>
              Activity will appear after edits, validation, saving or publishing.
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="font-semibold text-slate-900">
                    {event.title}
                  </p>

                  {event.description && (
                    <p className="mt-1 text-sm text-slate-500">
                      {event.description}
                    </p>
                  )}

                  <time className="mt-2 block text-xs text-slate-400">
                    {new Date(event.timestamp).toLocaleString()}
                    {" · "}
                    {event.source ===
                    "audit"
                      ? "Audit record"
                      : "Current session"}
                  </time>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel
          title="Record Metadata"
          description="Version and audit information."
        >
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Version</dt>
              <dd className="font-semibold text-slate-900">
                {listing.audit.version}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">Last updated</dt>
              <dd className="font-semibold text-slate-900">
                {new Date(listing.audit.updatedAt).toLocaleString()}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">Updated by</dt>
              <dd className="font-semibold text-slate-900">
                {listing.audit.updatedBy}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel
          title="Edit History"
          description="In-session undo/redo snapshot availability."
        >
          <p className="text-sm text-slate-600">
            {history?.undoCount ?? 0} undo snapshots and{" "}
            {history?.redoCount ?? 0} redo snapshots.
          </p>
        </Panel>
      </div>
    </div>
  );
}

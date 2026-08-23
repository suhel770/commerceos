"use client";

import { useMemo } from "react";

import { productActivityEvents } from "@/lib/mocks/product-activity";
import type { Product } from "@/lib/types/product";
import { WorkspacePanel } from "../shared/WorkspacePanel";

interface ActivityWorkspaceProps {
  product: Product;
}

export default function ActivityWorkspace({
  product,
}: ActivityWorkspaceProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, typeof productActivityEvents>();

    for (const event of productActivityEvents) {
      const bucket = map.get(event.day) ?? [];
      bucket.push(event);
      map.set(event.day, bucket);
    }

    return Array.from(map.entries());
  }, []);

  return (
    <WorkspacePanel
      title="Activity"
      description={`Audit trail and version-style history for ${product.name}.`}
    >
      <div className="space-y-8">
        {grouped.map(([day, events]) => (
          <section key={day}>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              {day}
            </h3>

            <div className="space-y-0">
              {events.map((event, index) => {
                const Icon = event.icon;

                return (
                  <div
                    key={event.id}
                    className="relative flex gap-4 pb-6 last:pb-0"
                  >
                    {index !== events.length - 1 ? (
                      <div className="absolute left-[19px] top-10 bottom-0 w-px bg-slate-200" />
                    ) : null}

                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${event.color}`}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900">
                            {event.title}
                          </h4>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                            {event.type}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-slate-400">
                          {event.time}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {event.description}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        Actor:{" "}
                        <span className="font-medium text-slate-600">
                          {event.actor}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </WorkspacePanel>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { Package, Clock, ShieldCheck, Tag, Layers, RefreshCw, Activity } from "lucide-react";
import type { Product } from "@/lib/types/product";
import { safeResponseJson } from "@/lib/api/client";
import { WorkspacePanel } from "../shared/WorkspacePanel";

interface ActivityWorkspaceProps {
  product: Product;
}

interface ActivityEvent {
  id: string;
  title: string;
  type: string;
  description: string;
  actor: string;
  time: string;
  day: string;
  icon: typeof Package;
  color: string;
}

function formatDayHeader(isoString: string): string {
  try {
    const date = new Date(isoString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Recent";
  }
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ActivityWorkspace({
  product,
}: ActivityWorkspaceProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadLogs() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/settings/audit?entityId=${encodeURIComponent(product.id)}`);
        const json = await safeResponseJson(res);

        const realEvents: ActivityEvent[] = [];

        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          for (const log of json.data) {
            realEvents.push({
              id: log.id,
              title: log.action || "Product Event",
              type: log.entityType || "Product",
              description: log.details?.summary || log.details?.message || `${log.action} performed on SKU ${product.sku}.`,
              actor: log.userEmail || log.userId || "System",
              time: formatTime(log.createdAt),
              day: formatDayHeader(log.createdAt),
              icon: log.action?.includes("INVENTORY") ? Layers : log.action?.includes("PRICE") ? Tag : ShieldCheck,
              color: "bg-blue-50 text-blue-600",
            });
          }
        }

        // Add real fallback timestamps if no specific audit entries exist
        if (realEvents.length === 0) {
          if (product.updatedAt && product.updatedAt !== product.createdAt) {
            realEvents.push({
              id: "evt-update",
              title: "Product Master Record Updated",
              type: "Catalog",
              description: `Master SKU ${product.sku} metadata, classification, or inventory was updated.`,
              actor: "System",
              time: formatTime(product.updatedAt),
              day: formatDayHeader(product.updatedAt),
              icon: RefreshCw,
              color: "bg-indigo-50 text-indigo-600",
            });
          }

          if (product.listings && product.listings.length > 0) {
            realEvents.push({
              id: "evt-channels",
              title: "Sales Channels Linked",
              type: "Listing",
              description: `Connected to ${product.listings.map((l) => l.marketplace).join(", ")}.`,
              actor: "Integration",
              time: formatTime(product.listings[0].lastSync || product.createdAt),
              day: formatDayHeader(product.listings[0].lastSync || product.createdAt),
              icon: Tag,
              color: "bg-emerald-50 text-emerald-600",
            });
          }

          if (product.createdAt) {
            realEvents.push({
              id: "evt-create",
              title: "Product Master Created",
              type: "Catalog",
              description: `Product created in master catalog as ${product.name} (${product.sku}).`,
              actor: "Merchant",
              time: formatTime(product.createdAt),
              day: formatDayHeader(product.createdAt),
              icon: Package,
              color: "bg-blue-50 text-blue-600",
            });
          }
        }

        if (!cancelled) {
          setEvents(realEvents);
        }
      } catch {
        if (!cancelled) {
          setEvents([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadLogs();
    return () => {
      cancelled = true;
    };
  }, [product]);

  const grouped = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>();
    for (const event of events) {
      const bucket = map.get(event.day) ?? [];
      bucket.push(event);
      map.set(event.day, bucket);
    }
    return Array.from(map.entries());
  }, [events]);

  return (
    <WorkspacePanel
      title="Activity & Audit Trail"
      description={`Authoritative event history and timeline for ${product.name} (${product.sku}).`}
    >
      {loading ? (
        <div className="space-y-4 py-6">
          <div className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
          <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No Activity Recorded</h3>
          <p className="text-xs text-slate-400 mt-1">Audit logs will automatically record updates, syncs, and price adjustments.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([day, dayEvents]) => (
            <section key={day}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                {day}
              </h3>

              <div className="space-y-0">
                {dayEvents.map((event, index) => {
                  const Icon = event.icon;

                  return (
                    <div
                      key={event.id}
                      className="relative flex gap-4 pb-6 last:pb-0"
                    >
                      {index !== dayEvents.length - 1 ? (
                        <div className="absolute left-[19px] top-10 bottom-0 w-px bg-slate-200" />
                      ) : null}

                      <div
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${event.color} border border-slate-200 shadow-2xs`}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-slate-300">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">
                              {event.title}
                            </h4>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                              {event.type}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-slate-400">
                            {event.time}
                          </span>
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                          {event.description}
                        </p>

                        <p className="mt-2 text-[11px] text-slate-400">
                          Actor:{" "}
                          <span className="font-semibold text-slate-600">
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
      )}
    </WorkspacePanel>
  );
}

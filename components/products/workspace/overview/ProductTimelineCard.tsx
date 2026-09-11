"use client";

import { useEffect, useState } from "react";
import { History, Package, Clock, ShieldCheck, Tag, Layers, RefreshCw } from "lucide-react";
import WorkspaceCard from "@/components/ui/WorkspaceCard";
import type { Product } from "@/lib/types/product";
import { safeResponseJson } from "@/lib/api/client";

interface ProductTimelineCardProps {
  product: Product;
  onViewAll?: () => void;
}

interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: typeof Package;
  color: string;
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return isoString;
  }
}

export default function ProductTimelineCard({
  product,
  onViewAll,
}: ProductTimelineCardProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAuditTimeline() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/settings/audit?entityId=${encodeURIComponent(product.id)}`);
        const json = await safeResponseJson(res);

        const realEvents: ActivityEvent[] = [];

        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          for (const log of json.data.slice(0, 5)) {
            realEvents.push({
              id: log.id,
              title: log.action || "Product Action",
              description: log.details?.summary || log.details?.message || `${log.action} executed on this product.`,
              time: formatRelativeTime(log.createdAt),
              icon: log.action?.includes("INVENTORY") ? Layers : log.action?.includes("PRICE") ? Tag : ShieldCheck,
              color: "bg-blue-50 text-blue-600",
            });
          }
        }

        // If no audit records found, construct verified chronological milestones from real product timestamps
        if (realEvents.length === 0) {
          if (product.updatedAt && product.updatedAt !== product.createdAt) {
            realEvents.push({
              id: "evt-updated",
              title: "Product Record Updated",
              description: `Master SKU ${product.sku} metadata, classification, or inventory was updated.`,
              time: formatRelativeTime(product.updatedAt),
              icon: RefreshCw,
              color: "bg-indigo-50 text-indigo-600",
            });
          }

          if (product.listings && product.listings.length > 0) {
            realEvents.push({
              id: "evt-listings",
              title: "Channels Linked",
              description: `Mapped to ${product.listings.length} sales channel${product.listings.length > 1 ? "s" : ""} (${product.listings.map((l) => l.marketplace).join(", ")}).`,
              time: formatRelativeTime(product.listings[0].lastSync || product.createdAt),
              icon: Tag,
              color: "bg-emerald-50 text-emerald-600",
            });
          }

          if (product.createdAt) {
            realEvents.push({
              id: "evt-created",
              title: "Product Created",
              description: `Product created in catalog as ${product.name} (${product.sku}).`,
              time: formatRelativeTime(product.createdAt),
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

    loadAuditTimeline();
    return () => {
      cancelled = true;
    };
  }, [product]);

  return (
    <WorkspaceCard
      height="h-auto"
      header={
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <History size={16} className="text-slate-400" />
              <span>Product Timeline</span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 font-semibold">
              Recent activity history for this SKU
            </p>
          </div>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              View All
            </button>
          )}
        </div>
      }
      footer={
        <div className="flex items-center justify-between bg-slate-50 px-5 py-3 border-t border-slate-100">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Clock size={12} className="text-slate-400" />
            <span>Audit-Verified</span>
          </span>

          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              View Complete History →
            </button>
          )}
        </div>
      }
    >
      <div className="px-5 py-4">
        {loading ? (
          <div className="space-y-3 py-2">
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse w-3/4" />
          </div>
        ) : events.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400 font-medium">
            No recent activity recorded for this product yet.
          </div>
        ) : (
          <div className="space-y-0">
            {events.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
                  {index !== events.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200" />
                  )}

                  <div
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.color} border border-slate-200/50 shadow-2xs`}
                  >
                    <Icon size={14} />
                  </div>

                  <div className="min-w-0 flex-1 rounded-xl border border-slate-150 bg-white p-3 shadow-2xs transition hover:border-slate-300">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-bold text-slate-900 truncate">
                        {item.title}
                      </h3>
                      <span className="shrink-0 text-[11px] font-medium text-slate-400">
                        {item.time}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </WorkspaceCard>
  );
}

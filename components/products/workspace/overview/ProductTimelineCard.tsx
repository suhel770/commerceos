"use client";

import WorkspaceCard from "@/components/ui/WorkspaceCard";

import {
  Package,
  Rocket,
  BadgeIndianRupee,
  Boxes,
  ShoppingCart,
  RotateCcw,
  User,
  RefreshCw,
} from "lucide-react";

const timeline = [
  {
    id: 1,
    title: "Product Created",
    description: "Product added to CommerceOS",
    time: "12 Jul 2026 • 10:42 AM",
    icon: Package,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: 2,
    title: "Published to Amazon",
    description: "Listing successfully published",
    time: "13 Jul 2026 • 09:15 AM",
    icon: Rocket,
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    id: 3,
    title: "Price Updated",
    description: "Selling price increased by ₹20",
    time: "15 Jul 2026 • 03:40 PM",
    icon: BadgeIndianRupee,
    color: "bg-amber-100 text-amber-600",
  },
  {
    id: 4,
    title: "Inventory Synced",
    description: "Inventory synced across marketplaces",
    time: "Today • 2 min ago",
    icon: Boxes,
    color: "bg-violet-100 text-violet-600",
  },
  {
    id: 5,
    title: "Last Order",
    description: "Amazon Order #LW23891",
    time: "Today • 1 hour ago",
    icon: ShoppingCart,
    color: "bg-green-100 text-green-600",
  },
  {
    id: 6,
    title: "Last Return",
    description: "Flipkart Return Request",
    time: "Yesterday",
    icon: RotateCcw,
    color: "bg-red-100 text-red-600",
  },
  {
    id: 7,
    title: "Edited by Admin",
    description: "Product description updated",
    time: "Today • 11:32 AM",
    icon: User,
    color: "bg-slate-200 text-slate-700",
  },
  {
    id: 8,
    title: "Marketplace Sync",
    description: "Amazon & Flipkart synced",
    time: "Just now",
    icon: RefreshCw,
    color: "bg-cyan-100 text-cyan-600",
  },
];

export default function ProductTimelineCard() {
  return (
    <WorkspaceCard
      height="h-[570px]"
      header={
        <div className="flex items-center justify-between px-6 py-5">

          <div>

            <h2 className="text-xl font-bold text-slate-900">
              Product Timeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Complete activity history for this product
            </p>

          </div>

          <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            View All
          </button>

        </div>
      }
      footer={
        <div className="flex items-center justify-between bg-slate-50 px-6 py-4">

          <span className="text-xs text-slate-500">
            Updated just now
          </span>

          <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            View Complete History →
          </button>

        </div>
      }
    >

    <div className="px-6 py-5">

  {timeline.map((item, index) => {

    const Icon = item.icon;

    return (

      <div
        key={item.id}
        className="relative flex gap-4 pb-7 last:pb-0"
      >

        {/* Timeline Line */}

        {index !== timeline.length - 1 && (

          <div className="absolute left-[19px] top-10 bottom-0 w-px bg-slate-200" />

        )}

        {/* Icon */}

        <div
          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.color}`}
        >

          <Icon size={18} />

        </div>

        {/* Event */}

        <div className="min-w-0 flex-1">

          <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-slate-300 hover:shadow-sm">

            <div className="flex items-center justify-between gap-3">

              <h3 className="text-sm font-semibold text-slate-900">
                {item.title}
              </h3>

              <span className="shrink-0 text-xs font-medium text-slate-400">
                {item.time}
              </span>

            </div>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {item.description}
            </p>

          </div>

        </div>

      </div>

    );

  })}
      </div>

  </WorkspaceCard>
);
}
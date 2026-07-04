"use client";

import {
  LayoutDashboard,
  Boxes,
  BadgeIndianRupee,
  ImageIcon,
  Search,
  History,
} from "lucide-react";

export type ListingTab =
  | "overview"
  | "inventory"
  | "pricing"
  | "images"
  | "seo"
  | "history";

interface ListingTabsProps {
  activeTab: ListingTab;
  onChange: (tab: ListingTab) => void;
}

const tabs = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Boxes,
  },
  {
    id: "pricing",
    label: "Pricing",
    icon: BadgeIndianRupee,
  },
  {
    id: "images",
    label: "Images",
    icon: ImageIcon,
  },
  {
    id: "seo",
    label: "SEO",
    icon: Search,
  },
  {
    id: "history",
    label: "History",
    icon: History,
  },
] as const;

export default function ListingTabs({
  activeTab,
  onChange,
}: ListingTabsProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">

      <div className="flex flex-wrap gap-2">

        {tabs.map((tab) => {

          const Icon = tab.icon;

          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={16} />

              {tab.label}
            </button>
          );
        })}

      </div>

    </div>
  );
}
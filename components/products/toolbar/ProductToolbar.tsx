"use client";

import { useState } from "react";

import {
  Bookmark,
  Download,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import CommerceSelect, {
  CommerceSelectOption,
} from "@/components/ui/CommerceSelect";

const marketplaceOptions: CommerceSelectOption[] = [
  {
    value: "all",
    label: "Marketplace",
  },
  {
    value: "amazon",
    label: "Amazon",
  },
  {
    value: "flipkart",
    label: "Flipkart",
  },
  {
    value: "meesho",
    label: "Meesho",
  },
  {
    value: "shopify",
    label: "Shopify",
  },
];

const categoryOptions: CommerceSelectOption[] = [
  {
    value: "all",
    label: "Category",
  },
  {
    value: "footwear",
    label: "Footwear",
  },
  {
    value: "clothing",
    label: "Clothing",
  },
  {
    value: "accessories",
    label: "Accessories",
  },
];

const statusOptions: CommerceSelectOption[] = [
  {
    value: "all",
    label: "Status",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
];

export default function ProductToolbar() {
  const [marketplace, setMarketplace] =
    useState("all");

  const [category, setCategory] =
    useState("all");

  const [status, setStatus] =
    useState("all");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs">

      <div className="flex items-center gap-3 overflow-x-auto">

        {/* Search */}

        <div className="relative min-w-0 flex-1">

          <Search
            size={14}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search by product, SKU, barcode, brand..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

        </div>

        {/* Marketplace */}

        <div className="min-w-[170px]">

          <CommerceSelect
            value={marketplace}
            options={marketplaceOptions}
            onChange={setMarketplace}
            searchable={false}
          />

        </div>

        {/* Category */}

        <div className="min-w-[160px]">

          <CommerceSelect
            value={category}
            options={categoryOptions}
            onChange={setCategory}
            searchable={false}
          />

        </div>

        {/* Status */}

        <div className="min-w-[150px]">

          <CommerceSelect
            value={status}
            options={statusOptions}
            onChange={setStatus}
            searchable={false}
          />

        </div>

        {/* More Filters */}

        <button className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">

          <SlidersHorizontal size={18} />

          More Filters

        </button>

        {/* Save View */}

        <button className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">

          <Bookmark size={18} />

          Save View

        </button>

        {/* Export */}

        <button className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">

          <Download size={18} />

          Export

        </button>

      </div>

    </div>
  );
}
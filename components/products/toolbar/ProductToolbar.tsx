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

import {
  FilterDrawer,
} from "@/components/shared/filters";

import ProductFiltersContent from "./ProductFiltersContent";

import type { ProductFilters } from "@/lib/types/product-filter";

import { v4 as uuid } from "uuid";

import SaveViewDialog from "@/components/products/dialogs/SaveViewDialog";

import { savedViewService } from "@/lib/services/savedView.service";


interface ProductToolbarProps {
  filters: ProductFilters;
  onFiltersChange: (
    filters: ProductFilters
  ) => void;
}

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
  {
    value: "own website",
    label: "Own Website",
  },
];

const categoryOptions: CommerceSelectOption[] = [
  {
    value: "all",
    label: "Category",
  },
  {
    value: "kids clogs",
    label: "Kids Clogs",
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
    value: "draft",
    label: "Draft",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
  {
    value: "archived",
    label: "Archived",
  },
];

export default function ProductToolbar({
  filters,
  onFiltersChange,
}: ProductToolbarProps) {
    const [showFilters, setShowFilters] =
    useState(false);
    const [showSaveView, setShowSaveView] =
  useState(false);

  return (
    <>
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
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  search: e.target.value,
                })
              }
              placeholder="Search by product, SKU, brand..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Marketplace */}

          <div className="min-w-[180px]">
            <CommerceSelect
              value={filters.marketplace}
              options={marketplaceOptions}
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  marketplace: value,
                })
              }
              searchable={false}
            />
          </div>

          {/* Category */}

          <div className="min-w-[170px]">
            <CommerceSelect
              value={filters.category}
              options={categoryOptions}
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  category: value,
                })
              }
              searchable={false}
            />
          </div>

          {/* Status */}

          <div className="min-w-[170px]">
            <CommerceSelect
              value={filters.status}
              options={statusOptions}
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  status: value,
                })
              }
              searchable={false}
            />
          </div>

          {/* More Filters */}

          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <SlidersHorizontal size={18} />
            More Filters
          </button>

          {/* Save View */}

          <button
            type="button"
            onClick={() => setShowSaveView(true)}
            className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Bookmark size={18} />
            Save View
          </button>

          {/* Export */}

            <button
              type="button"
              className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Download size={18} />
              Export
            </button>

        </div>
      </div>
              <FilterDrawer
  open={showFilters}
  title="More Filters"
  onClose={() => setShowFilters(false)}
  footer={
    <div className="flex items-center justify-end gap-3">
      <button
        type="button"
        onClick={() => setShowFilters(false)}
        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Reset
      </button>

      <button
        type="button"
        onClick={() => setShowFilters(false)}
        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Apply Filters
      </button>
    </div>
  }
>
  <ProductFiltersContent
    filters={filters}
    onFiltersChange={onFiltersChange}
  />
</FilterDrawer>
<SaveViewDialog
  open={showSaveView}
  onClose={() => setShowSaveView(false)}
  onSave={(name, description, isDefault) => {
    const now = new Date().toISOString();

    if (isDefault) {
      const existing =
        savedViewService.getAll();

      existing.forEach((view) =>
        savedViewService.save({
          ...view,
          isDefault: false,
        })
      );
    }

    savedViewService.save({
      id: uuid(),

      name,

      description,

      filters,

      isDefault,

      createdAt: now,

      updatedAt: now,
    });

    setShowSaveView(false);
  }}
/>
    </>
  );
}
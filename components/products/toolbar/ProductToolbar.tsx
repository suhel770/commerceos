"use client";

import { useState, useEffect, useMemo } from "react";

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

import { defaultProductFilters, type ProductFilters } from "@/lib/types/product-filter";
import type { Product } from "@/lib/types/product";

import { v4 as uuid } from "uuid";

import SaveViewDialog from "@/components/products/dialogs/SaveViewDialog";
import { savedViewService } from "@/lib/services/savedView.service";

interface ProductToolbarProps {
  products?: Product[];
  filters: ProductFilters;
  onFiltersChange: (
    filters: ProductFilters
  ) => void;
}

export default function ProductToolbar({
  products = [],
  filters,
  onFiltersChange,
}: ProductToolbarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveView, setShowSaveView] = useState(false);
  const [savedViews, setSavedViews] = useState<any[]>([]);

  useEffect(() => {
    setSavedViews(savedViewService.getAll());
  }, [showSaveView]);

  // 1. Dynamic Connected Marketplaces (only show channels that are actually connected)
  const marketplaceOptions: CommerceSelectOption[] = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      for (const l of p.listings || []) {
        if (l.marketplace && l.marketplace.toLowerCase() !== "all" && l.marketplace.toLowerCase() !== "none") {
          set.add(l.marketplace.trim());
        }
      }
    }
    const list = Array.from(set).sort();
    if (list.length === 0) {
      return [
        { value: "all", label: "No Channels Connected" },
      ];
    }
    return [
      { value: "all", label: "All Marketplaces" },
      ...list.map((m) => ({ value: m.toLowerCase(), label: m })),
    ];
  }, [products]);

  // 2. Dynamic Categories from real active products
  const categoryOptions: CommerceSelectOption[] = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category && p.category.trim() && p.category.toLowerCase() !== "general") {
        set.add(p.category.trim());
      }
    }
    const list = Array.from(set).sort();
    return [
      { value: "all", label: "All Categories" },
      ...list.map((c) => ({ value: c.toLowerCase(), label: c })),
    ];
  }, [products]);

  // 3. Status Options (real statuses)
  const statusOptions: CommerceSelectOption[] = [
    { value: "all", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "draft", label: "Draft" },
    { value: "inactive", label: "Inactive" },
    { value: "archived", label: "Archived" },
  ];

  // 4. Curated Presets + User Saved Views
  const savedViewOptions: CommerceSelectOption[] = useMemo(() => {
    const options: CommerceSelectOption[] = [
      { value: "preset:all-products", label: "All Products" },
      { value: "preset:low-stock", label: "Low Stock (ATS ≤ 10)" },
      { value: "preset:active", label: "Active Products" },
      { value: "preset:needs-attention", label: "Needs Attention" },
    ];

    if (savedViews.length > 0) {
      options.push(...savedViews.map((v) => ({
        value: `custom:${v.id}`,
        label: `⭐ ${v.name}`,
      })));
      options.push({ value: "action:clear-custom-views", label: "🗑️ Clear Saved Views" });
    }

    return options;
  }, [savedViews]);

  return (
    <>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
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
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
            />
          </div>

          {/* Saved Views */}
          <div className="w-[145px] shrink-0">
            <CommerceSelect
              value=""
              placeholder="Saved Views"
              size="sm"
              options={savedViewOptions}
              onChange={(value) => {
                if (value === "action:clear-custom-views") {
                  savedViewService.clear();
                  setSavedViews([]);
                  onFiltersChange(defaultProductFilters);
                  return;
                }
                if (value === "preset:all-products") {
                  onFiltersChange(defaultProductFilters);
                } else if (value === "preset:low-stock") {
                  onFiltersChange({ ...defaultProductFilters, stockStatus: ["low-stock"] });
                } else if (value === "preset:active") {
                  onFiltersChange({ ...defaultProductFilters, status: "active" });
                } else if (value === "preset:needs-attention") {
                  onFiltersChange({ ...defaultProductFilters, productHealth: ["attention"] });
                } else if (value.startsWith("custom:")) {
                  const viewId = value.replace("custom:", "");
                  const view = savedViews.find((v) => v.id === viewId);
                  if (view) {
                    onFiltersChange(view.filters);
                  }
                }
              }}
              searchable={false}
            />
          </div>

          {/* Marketplace */}
          <div className="w-[165px] shrink-0">
            <CommerceSelect
              value={filters.marketplace}
              options={marketplaceOptions}
              size="sm"
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
          <div className="w-[140px] shrink-0">
            <CommerceSelect
              value={filters.category}
              options={categoryOptions}
              size="sm"
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
          <div className="w-[130px] shrink-0">
            <CommerceSelect
              value={filters.status}
              options={statusOptions}
              size="sm"
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  status: value,
                })
              }
              searchable={false}
            />
          </div>

          {/* Action Buttons Right Group */}
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            {/* More Filters */}
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
            >
              <SlidersHorizontal size={14} className="text-slate-500" />
              <span>More Filters</span>
            </button>

            {/* Save View */}
            <button
              type="button"
              onClick={() => setShowSaveView(true)}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
            >
              <Bookmark size={14} className="text-slate-500" />
              <span>Save View</span>
            </button>

            {/* Export */}
            <button
              type="button"
              onClick={() => {
                const event = new CustomEvent("commerceos_export_products_csv");
                window.dispatchEvent(event);
              }}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
            >
              <Download size={14} className="text-slate-500" />
              <span>Export</span>
            </button>
          </div>
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
    products={products}
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
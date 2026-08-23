"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X, Package } from "lucide-react";
import type { StockBalance } from "@/lib/inventory/types";

export interface SearchableSkuSelectProps {
  balances: StockBalance[];
  selectedSkuKey: string;
  onSelectSkuKey: (key: string) => void;
  placeholder?: string;
  unitLabel?: string;
  accentColor?: "amber" | "indigo" | "violet";
}

export default function SearchableSkuSelect({
  balances,
  selectedSkuKey,
  onSelectSkuKey,
  placeholder = "Select SKU...",
  unitLabel = "Current Units",
  accentColor = "amber",
}: SearchableSkuSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const selectedItem = useMemo(() => {
    if (!selectedSkuKey && balances.length > 0) return balances[0];
    return balances.find((b) => (b.sku || b.id) === selectedSkuKey) || balances[0];
  }, [balances, selectedSkuKey]);

  const filteredBalances = useMemo(() => {
    if (!searchQuery.trim()) return balances;
    const q = searchQuery.toLowerCase().trim();
    return balances.filter(
      (b) =>
        (b.sku && b.sku.toLowerCase().includes(q)) ||
        (b.productName && b.productName.toLowerCase().includes(q))
    );
  }, [balances, searchQuery]);

  const activeColorClasses = {
    amber: {
      borderFocus: "focus:border-amber-600",
      selectedBg: "bg-amber-50/70 border-amber-200/80",
      selectedCheck: "text-amber-600",
      unitText: "text-amber-700",
    },
    indigo: {
      borderFocus: "focus:border-indigo-600",
      selectedBg: "bg-indigo-50/70 border-indigo-200/80",
      selectedCheck: "text-indigo-600",
      unitText: "text-emerald-700",
    },
    violet: {
      borderFocus: "focus:border-violet-600",
      selectedBg: "bg-violet-50/70 border-violet-200/80",
      selectedCheck: "text-violet-600",
      unitText: "text-violet-700",
    },
  }[accentColor];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-left hover:border-slate-300 focus:outline-none transition-all shadow-2xs group"
      >
        {selectedItem ? (
          <div className="flex flex-col gap-0.5 min-w-0 pr-2">
            <span className="font-extrabold text-xs text-slate-900 truncate">
              {selectedItem.productName}
            </span>
            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
              <span className="font-mono text-slate-600 font-bold">{selectedItem.sku}</span>
              <span>•</span>
              <span className={`font-bold ${activeColorClasses.unitText}`}>
                {selectedItem.available || 0} {unitLabel}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-xs font-semibold text-slate-400">{placeholder}</span>
        )}

        <ChevronDown
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180 text-slate-700" : ""
          }`}
        />
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl animate-fadeIn space-y-1.5">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU or product name..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-8 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 rounded-md p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* List of SKUs */}
          <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1 pr-0.5">
            {filteredBalances.length === 0 ? (
              <div className="p-4 text-center space-y-1">
                <Package className="h-6 w-6 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No SKU found</p>
                <p className="text-[11px] text-slate-400">
                  No products matched &quot;{searchQuery}&quot;
                </p>
              </div>
            ) : (
              filteredBalances.map((b) => {
                const itemKey = b.sku || b.id;
                const isSelected = selectedItem ? (selectedItem.sku || selectedItem.id) === itemKey : false;

                return (
                  <button
                    key={itemKey}
                    type="button"
                    onClick={() => {
                      onSelectSkuKey(itemKey);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left transition-all border ${
                      isSelected
                        ? `${activeColorClasses.selectedBg} shadow-2xs`
                        : "border-transparent hover:bg-slate-50 hover:border-slate-100"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                      <span className="font-extrabold text-xs text-slate-900 leading-tight truncate">
                        {b.productName}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                        <span className="font-mono text-slate-600 font-bold">{b.sku}</span>
                        <span>•</span>
                        <span className={`font-bold ${activeColorClasses.unitText}`}>
                          {b.available || 0} {unitLabel}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className={`h-4 w-4 shrink-0 ${activeColorClasses.selectedCheck}`} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

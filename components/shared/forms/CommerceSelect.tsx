"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommerceSelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface CommerceSelectProps {
  options: CommerceSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export default function CommerceSelect({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  label,
  searchable = false,
  disabled = false,
  className,
  triggerClassName,
}: CommerceSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) => {
    if (!searchable || !searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      opt.label.toLowerCase().includes(query) ||
      (opt.description && opt.description.toLowerCase().includes(query)) ||
      (opt.badge && opt.badge.toLowerCase().includes(query))
    );
  });

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className={cn("relative w-full text-xs", className)}>
      {label && <label className="font-bold text-slate-700 block mb-1">{label}</label>}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 flex items-center justify-between transition cursor-pointer text-left shadow-2xs hover:bg-slate-100/80 disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen && "border-indigo-500 bg-white ring-2 ring-indigo-100",
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200",
            isOpen && "transform rotate-180 text-indigo-600"
          )}
        />
      </button>

      {/* Floating Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-[160] rounded-2xl border border-slate-200 bg-white shadow-2xl p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 max-h-64 overflow-hidden flex flex-col cursor-default">
          {/* Optional Search Bar */}
          {searchable && (
            <div className="relative p-1 border-b border-slate-100 pb-1.5">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto space-y-0.5 max-h-48 pr-0.5 [scrollbar-width:none]">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-400 text-[11px] font-medium">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "p-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-between text-slate-700 hover:bg-indigo-50 hover:text-indigo-950 font-medium",
                      isSelected && "bg-indigo-50/90 text-indigo-950 font-bold border border-indigo-100"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{opt.label}</span>
                          {opt.badge && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <p className="text-[10px] text-slate-400 font-normal truncate">
                            {opt.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

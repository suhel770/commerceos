"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export interface CommerceSelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  group?: string;
  description?: string;
}

interface SingleSelectProps {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
}

interface MultiSelectProps {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
}

type CommerceSelectProps = (SingleSelectProps | MultiSelectProps) & {
  label?: string;
  options: CommerceSelectOption[];
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  disabled?: boolean;
  /** Trigger height. Default md (h-10). Use sm (h-9) for compact rows, lg (h-12) for large. */
  size?: "sm" | "md" | "lg";
  labelClassName?: string;
  badge?: ReactNode;
  clearable?: boolean;
  error?: boolean;
  triggerClassName?: string;
  panelClassName?: string;
};

export default function CommerceSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
  searchable = true,
  className = "",
  disabled = false,
  size = "md",
  labelClassName,
  badge,
  multiple = false,
  clearable = false,
  error = false,
  triggerClassName = "",
  panelClassName = "",
}: CommerceSelectProps) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsContainerRef = useRef<HTMLDivElement>(null);
  const mounted = typeof document !== "undefined";

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [style, setStyle] = useState<CSSProperties>({});
  const [activeIndex, setActiveIndex] = useState(-1);

  // Derive selection labels
  const selectedOptions = useMemo(() => {
    if (multiple) {
      const vals = Array.isArray(value) ? value : [];
      return options.filter((o) => vals.includes(o.value));
    }
    return options.filter((o) => o.value === value);
  }, [value, options, multiple]);

  const selectedLabel = useMemo(() => {
    if (multiple) {
      const count = selectedOptions.length;
      if (count === 0) return placeholder;
      if (count === 1) return selectedOptions[0].label;
      return `${count} items selected`;
    }
    return selectedOptions[0]?.label ?? placeholder;
  }, [selectedOptions, placeholder, multiple]);

  const filtered = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase()) ||
      option.description?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, searchable, options]);

  // Grouped options mappings
  const groupedOptions = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    const ungrouped: typeof filtered = [];

    for (const opt of filtered) {
      if (opt.group) {
        if (!map[opt.group]) map[opt.group] = [];
        map[opt.group].push(opt);
      } else {
        ungrouped.push(opt);
      }
    }

    return { map, ungrouped };
  }, [filtered]);

  // Reset activeIndex on search or open
  useEffect(() => {
    setActiveIndex(-1);
  }, [search, open]);

  useLayoutEffect(() => {
    if (!open) return;

    const placePanel = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();

      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setOpen(false);
        return;
      }

      const width = Math.max(rect.width, size === "sm" ? 140 : 220);
      let left = rect.left;
      if (left + width > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - width - 8);
      }

      const gap = 6;
      const viewportPad = 8;
      const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPad;
      const spaceAbove = rect.top - gap - viewportPad;
      const openBelow = spaceBelow >= 150 || spaceBelow >= spaceAbove;

      const maxHeight = Math.max(150, openBelow ? spaceBelow : spaceAbove);

      const next: CSSProperties = openBelow
        ? {
            position: "fixed",
            top: rect.bottom + gap,
            bottom: "auto",
            left,
            width,
            maxHeight,
            zIndex: 9999,
          }
        : {
            position: "fixed",
            top: "auto",
            bottom: window.innerHeight - rect.top + gap,
            left,
            width,
            maxHeight,
            zIndex: 9999,
          };

      setStyle(next);
    };

    placePanel();
    window.addEventListener("resize", placePanel);
    document.addEventListener("scroll", placePanel, true);
    return () => {
      window.removeEventListener("resize", placePanel);
      document.removeEventListener("scroll", placePanel, true);
    };
  }, [open, size]);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      const panel = document.getElementById(panelId);
      if (panel?.contains(target)) return;
      setOpen(false);
      setSearch("");
    };

    window.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("mousedown", handleClick);
    };
  }, [open, panelId]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        setOpen(false);
        setSearch("");
        triggerRef.current?.focus();
        break;
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) => {
          const next = prev + 1;
          return next >= filtered.length ? 0 : next;
        });
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((prev) => {
          const next = prev - 1;
          return next < 0 ? filtered.length - 1 : next;
        });
        break;
      case "Enter":
        event.preventDefault();
        if (activeIndex >= 0 && activeIndex < filtered.length) {
          const opt = filtered[activeIndex];
          if (!opt.disabled) {
            handleSelectOption(opt.value);
          }
        }
        break;
      case "Tab":
        setOpen(false);
        setSearch("");
        break;
    }
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDownWindow = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        setSearch("");
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDownWindow, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDownWindow, true);
    };
  }, [open]);

  useEffect(() => {
    if (activeIndex >= 0 && optionsContainerRef.current) {
      const activeEl = optionsContainerRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex]);

  useEffect(() => {
    if (!open || !searchable) return;
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }, [open, searchable]);

  const handleSelectOption = (optVal: string) => {
    if (multiple) {
      const currentVals = Array.isArray(value) ? value : [];
      const nextVals = currentVals.includes(optVal)
        ? currentVals.filter((v) => v !== optVal)
        : [...currentVals, optVal];
      (onChange as (val: string[]) => void)(nextVals);
    } else {
      (onChange as (val: string) => void)(optVal);
      setOpen(false);
      setSearch("");
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      (onChange as (val: string[]) => void)([]);
    } else {
      (onChange as (val: string) => void)("");
    }
    setSearch("");
  };

  const triggerHeight =
    size === "sm"
      ? "h-9 px-2.5 text-[13px]"
      : size === "lg"
      ? "h-12 px-4 text-base"
      : "h-11 px-3.5 text-sm";

  const renderOption = (option: CommerceSelectOption, flatIdx: number) => {
    const isSelected = multiple
      ? (Array.isArray(value) ? value.includes(option.value) : false)
      : option.value === value;
    const isActive = flatIdx === activeIndex;

    return (
      <button
        key={option.value}
        type="button"
        role="option"
        aria-selected={isSelected}
        disabled={option.disabled}
        onClick={() => {
          if (option.disabled) return;
          handleSelectOption(option.value);
        }}
        className={`flex w-full items-center justify-between rounded-lg px-2.5 text-left transition cursor-pointer ${
          size === "sm" ? "py-1.5" : "py-2"
        } ${
          option.disabled
            ? "cursor-not-allowed opacity-40 bg-slate-50/50"
            : isActive
              ? "bg-slate-100 text-slate-900"
              : "hover:bg-slate-50"
        } ${
          isSelected
            ? "bg-violet-50 text-violet-800 hover:bg-violet-50/80"
            : "text-slate-700"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {multiple && (
            <input
              type="checkbox"
              checked={isSelected}
              readOnly
              className="rounded border-slate-350 text-violet-600 focus:ring-violet-500 h-3.5 w-3.5 mr-1 shrink-0"
            />
          )}
          {option.icon ? (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-slate-500">
              {option.icon}
            </span>
          ) : null}
          <div className="flex flex-col min-w-0 text-left">
            <span
              className={`truncate font-semibold ${
                size === "sm" ? "text-xs" : "text-sm"
              } ${isSelected ? "text-violet-800" : "text-slate-800"}`}
            >
              {option.label}
            </span>
            {option.description && (
              <span className="text-xs font-normal text-slate-400 mt-0.5 leading-tight truncate">
                {option.description}
              </span>
            )}
          </div>
        </div>
        {isSelected && !multiple ? (
          <Check
            size={size === "sm" ? 12 : 14}
            className="shrink-0 text-violet-600"
          />
        ) : null}
      </button>
    );
  };

  return (
    <>
      <div className={className} onKeyDown={handleKeyDown}>
        {label || badge ? (
          <div className="mb-1.5 flex h-5 items-center justify-between">
            {label ? (
              <label className={labelClassName || "text-xs font-semibold text-slate-700"}>
                {label}
              </label>
            ) : (
              <span />
            )}
            {badge ? <div>{badge}</div> : null}
          </div>
        ) : null}

        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setOpen((current) => !current);
          }}
          className={`flex w-full min-w-0 items-center justify-between border transition duration-150 ${triggerHeight} ${
            size === "sm" ? "rounded-lg" : "rounded-xl"
          } ${
            disabled
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              : error
                ? "border-red-500 ring-2 ring-red-100 hover:border-red-500 focus:border-red-500"
                : open
                  ? "border-violet-500 ring-2 ring-violet-100 hover:border-violet-500"
                  : triggerClassName
                    ? triggerClassName
                    : "border-slate-200 hover:border-slate-350 hover:bg-slate-50/50 bg-white"
          } ${triggerClassName ? triggerClassName : ""}`}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <div className="flex min-w-0 items-center gap-2">
            {!multiple && selectedOptions[0]?.icon ? (
              <span className="shrink-0 text-slate-500">{selectedOptions[0].icon}</span>
            ) : null}

            {!multiple && selectedOptions[0] ? (
              <div className="flex flex-col min-w-0 text-left">
                <span
                  className={`truncate font-semibold text-slate-800 leading-tight ${
                    size === "sm" ? "text-xs" : "text-sm"
                  }`}
                >
                  {selectedOptions[0].label}
                </span>
                {selectedOptions[0].description && (
                  <span className="text-xs font-normal text-slate-400 truncate leading-none mt-0.5">
                    {selectedOptions[0].description}
                  </span>
                )}
              </div>
            ) : (
              <span
                className={`truncate font-medium text-slate-400 ${
                  size === "sm" ? "text-xs" : "text-sm"
                }`}
              >
                {selectedLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {clearable && selectedOptions.length > 0 && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition shrink-0"
                aria-label="Clear selection"
              >
                <X size={size === "sm" ? 12 : 14} />
              </button>
            )}
            <ChevronDown
              size={size === "sm" ? 14 : 16}
              className={`text-slate-450 transition duration-150 ${
                open ? "rotate-180 text-violet-600" : ""
              }`}
            />
          </div>
        </button>
      </div>

      {mounted && open
        ? createPortal(
            <div
              id={panelId}
              style={style}
              role="listbox"
              className={`flex flex-col overflow-hidden rounded-2xl border shadow-2xl ${panelClassName || "border-slate-200 bg-white shadow-slate-900/12"}`}
            >
              {searchable ? (
                <div className="shrink-0 border-b border-slate-100 p-2 bg-slate-50/20">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      ref={searchInputRef}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search..."
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-8 pr-3 text-sm outline-none focus:border-violet-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              ) : null}

              {multiple && (
                <div className="flex items-center justify-between border-b border-slate-100 p-2 shrink-0 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => {
                      const allVals = options.filter((o) => !o.disabled).map((o) => o.value);
                      (onChange as (val: string[]) => void)(allVals);
                    }}
                    className="text-xs font-bold uppercase tracking-wider text-violet-700 hover:text-violet-900 cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      (onChange as (val: string[]) => void)([]);
                    }}
                    className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}

              <div
                ref={optionsContainerRef}
                className="flex-1 min-h-0 max-h-[280px] overflow-y-auto overscroll-contain p-1.5 space-y-0.5"
              >
                {filtered.length === 0 ? (
                  <div className="px-3 py-8 text-center">
                    <p className="text-sm font-semibold text-slate-750">
                      No results found
                    </p>
                    <p className="mt-1 text-xs text-slate-400 font-semibold">
                      Try another search.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {/* Ungrouped options */}
                    {groupedOptions.ungrouped.map((option) => {
                      const flatIdx = filtered.indexOf(option);
                      return renderOption(option, flatIdx);
                    })}

                    {/* Grouped options */}
                    {Object.entries(groupedOptions.map).map(([groupName, groupOpts]) => (
                      <div key={groupName} className="flex flex-col">
                        <div className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 select-none bg-slate-50/50 rounded-md mt-1 mb-0.5">
                          {groupName}
                        </div>
                        {groupOpts.map((option) => {
                          const flatIdx = filtered.indexOf(option);
                          return renderOption(option, flatIdx);
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

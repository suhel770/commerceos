"use client";

import { Check, ChevronDown, Search } from "lucide-react";
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
}

interface CommerceSelectProps {
  label?: string;
  value: string;
  options: CommerceSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  disabled?: boolean;
  /** Trigger height. Default md (h-10). Use sm (h-9) for compact rows, lg (h-12) for large. */
  size?: "sm" | "md" | "lg";
  labelClassName?: string;
  badge?: ReactNode;
}

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
}: CommerceSelectProps) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mounted = typeof document !== "undefined";

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [style, setStyle] = useState<CSSProperties>({});

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, searchable, options]);

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
      const openBelow =
        spaceBelow >= 120 || spaceBelow >= spaceAbove;

      const maxHeight = Math.max(120, openBelow ? spaceBelow : spaceAbove);

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

      setStyle((prev) => {
        if (
          prev.position === next.position &&
          prev.top === next.top &&
          prev.bottom === next.bottom &&
          prev.left === next.left &&
          prev.width === next.width &&
          prev.maxHeight === next.maxHeight
        ) {
          return prev;
        }
        return next;
      });
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

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };

    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, panelId]);

  useEffect(() => {
    if (!open || !searchable) return;
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }, [open, searchable]);

  const triggerHeight =
    size === "sm"
      ? "h-9 px-2 text-xs"
      : size === "lg"
      ? "h-12 px-4 text-sm"
      : "h-10 px-3 text-sm";

  return (
    <>
      <div className={className}>
        {label || badge ? (
          <div className="mb-1 flex h-5 items-center justify-between">
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
          className={`flex w-full min-w-0 items-center justify-between border bg-white transition duration-200 ${triggerHeight} ${
            size === "md" ? "rounded-xl" : "rounded-md"
          } ${
            disabled
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              : open
                ? "border-violet-500 ring-2 ring-violet-100 hover:border-violet-500"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <div className="flex min-w-0 items-center gap-2">
            {selected?.icon ? (
              <span className="shrink-0">{selected.icon}</span>
            ) : null}
            <span
              className={`truncate font-medium ${
                selected ? "text-slate-900" : "text-slate-400"
              } ${size === "sm" ? "text-xs" : "text-sm"}`}
            >
              {selected?.label ?? placeholder}
            </span>
          </div>
          <ChevronDown
            size={size === "sm" ? 14 : 16}
            className={`shrink-0 text-slate-400 transition duration-200 ${
              open ? "rotate-180 text-violet-600" : ""
            }`}
          />
        </button>
      </div>

      {mounted && open
        ? createPortal(
            <div
              id={panelId}
              style={style}
              role="listbox"
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
            >
              {searchable ? (
                <div className="shrink-0 border-b border-slate-100 p-2">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      ref={searchInputRef}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={`Search ${label ?? ""}`.trim()}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm outline-none focus:border-violet-500 focus:bg-white"
                    />
                  </div>
                </div>
              ) : null}

              <div className="flex-1 min-h-0 max-h-[260px] overflow-y-auto overscroll-contain p-1">
                {filtered.length === 0 ? (
                  <div className="px-3 py-8 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      No results found
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Try another search.
                    </p>
                  </div>
                ) : (
                  filtered.map((option) => {
                    const isSelected = option.value === value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={option.disabled}
                        onClick={() => {
                          if (option.disabled) return;
                          onChange(option.value);
                          setOpen(false);
                          setSearch("");
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 text-left transition ${
                          size === "sm" ? "py-1.5" : "py-2"
                        } ${
                          option.disabled
                            ? "cursor-not-allowed opacity-50"
                            : "hover:bg-slate-50"
                        } ${
                          isSelected
                            ? "bg-violet-50 text-violet-800"
                            : "text-slate-700"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          {option.icon ? (
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                              {option.icon}
                            </span>
                          ) : null}
                          <span
                            className={`truncate font-medium ${
                              size === "sm" ? "text-xs" : "text-sm"
                            }`}
                          >
                            {option.label}
                          </span>
                        </div>
                        {isSelected ? (
                          <Check
                            size={size === "sm" ? 12 : 14}
                            className="shrink-0 text-violet-600"
                          />
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

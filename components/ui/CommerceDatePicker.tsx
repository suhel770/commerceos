"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

interface CommerceDatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  size?: "sm" | "md" | "lg";
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

function parseValue(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplay(value: string) {
  const date = parseValue(value);
  if (!date) return "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCells(month: Date) {
  const first = startOfMonth(month);
  const startOffset = first.getDay();
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const cell = new Date(gridStart);
    cell.setDate(gridStart.getDate() + index);
    return cell;
  });
}

export default function CommerceDatePicker({
  label,
  value,
  onChange,
  placeholder = "Select date",
  className = "",
  required = false,
  size = "md",
}: CommerceDatePickerProps) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const mounted = typeof document !== "undefined";
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({});
  const selected = parseValue(value);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(selected ?? new Date()),
  );

  useEffect(() => {
    const next = parseValue(value);
    if (!next) return;
    const nextMonth = startOfMonth(next);
    setVisibleMonth((prev) =>
      prev.getFullYear() === nextMonth.getFullYear() &&
      prev.getMonth() === nextMonth.getMonth()
        ? prev
        : nextMonth,
    );
  }, [value]);

  useLayoutEffect(() => {
    if (!open) return;

    const placePanel = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();

      // Trigger scrolled away — close so panel doesn't float orphaned
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setOpen(false);
        return;
      }

      const width = Math.max(rect.width, 288);
      let left = rect.left;
      if (left + width > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - width - 8);
      }

      const estimatedHeight = 340;
      const gap = 8;
      const below = rect.bottom + gap;
      const above = rect.top - estimatedHeight - gap;
      const fitsBelow = below + estimatedHeight <= window.innerHeight - 8;
      const top = fitsBelow
        ? below
        : Math.max(8, above > 0 ? above : below);

      setStyle((prev) => {
        if (
          prev.position === "fixed" &&
          prev.top === top &&
          prev.left === left &&
          prev.width === width
        ) {
          return prev;
        }
        return {
          position: "fixed",
          top,
          left,
          width,
          zIndex: 9999,
        };
      });
    };

    placePanel();
    window.addEventListener("resize", placePanel);
    // Capture scroll on any ancestor so panel stays stuck to the input
    document.addEventListener("scroll", placePanel, true);
    return () => {
      window.removeEventListener("resize", placePanel);
      document.removeEventListener("scroll", placePanel, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      const panel = document.getElementById(panelId);
      if (panel?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, panelId]);

  const cells = useMemo(() => buildCells(visibleMonth), [visibleMonth]);
  const monthLabel = visibleMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const pick = (date: Date) => {
    onChange(toValue(date));
    setOpen(false);
  };

  const triggerHeight =
    size === "sm"
      ? "h-8 px-2.5 text-xs"
      : size === "lg"
      ? "h-12 px-4 text-sm"
      : "h-10 px-3 text-xs";

  return (
    <div className={className}>
      {label ? (
        <span className="mb-1 block text-xs font-extrabold text-slate-700">
          {label}
          {required ? " *" : ""}
        </span>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border bg-white font-bold outline-none transition duration-150 ${triggerHeight} ${
          open
            ? "border-violet-500 ring-2 ring-violet-100"
            : "border-slate-300 text-slate-900 hover:border-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        }`}
        aria-label={label ?? "Choose date"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="inline-flex min-w-0 items-center gap-2 truncate">
          <CalendarDays
            className={`h-4 w-4 shrink-0 ${
              open || value ? "text-violet-600" : "text-slate-400"
            }`}
          />
          <span className={value ? "text-slate-900 font-bold" : "text-slate-400 font-normal"}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </span>
      </button>

      {mounted && open
        ? createPortal(
            <div
              id={panelId}
              style={style}
              role="dialog"
              aria-label={label ?? "Choose date"}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl shadow-slate-900/15 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-100 p-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleMonth(
                      new Date(
                        visibleMonth.getFullYear(),
                        visibleMonth.getMonth() - 1,
                        1,
                      ),
                    )
                  }
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-xs active:scale-95"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="text-xs font-black tracking-wide text-slate-900">
                  {monthLabel}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setVisibleMonth(
                      new Date(
                        visibleMonth.getFullYear(),
                        visibleMonth.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-xs active:scale-95"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-1.5 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="py-0.5 text-center text-[10px] font-black uppercase tracking-wider text-slate-400"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {cells.map((cell) => {
                  const inMonth =
                    cell.getMonth() === visibleMonth.getMonth();
                  const valueKey = toValue(cell);
                  const isSelected = value === valueKey;
                  const isToday = toValue(new Date()) === valueKey;
                  return (
                    <button
                      key={valueKey + String(inMonth)}
                      type="button"
                      onClick={() => pick(cell)}
                      className={`h-8 rounded-xl text-xs font-bold transition-all duration-150 ${
                        isSelected
                          ? "bg-violet-600 font-black text-white shadow-md shadow-violet-500/25 scale-105"
                          : isToday
                            ? "bg-violet-50 font-black text-violet-700 ring-1 ring-inset ring-violet-300"
                            : inMonth
                              ? "text-slate-800 hover:bg-violet-50 hover:text-violet-900 hover:font-black"
                              : "text-slate-300 hover:bg-slate-50 hover:text-slate-500"
                      }`}
                    >
                      {cell.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="rounded-lg px-2.5 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => pick(new Date())}
                  className="rounded-lg bg-violet-50 border border-violet-200 px-3 py-1 text-xs font-black text-violet-700 transition hover:bg-violet-100 active:scale-95 shadow-xs"
                >
                  Today
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

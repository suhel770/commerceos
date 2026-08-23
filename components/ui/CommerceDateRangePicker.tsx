"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface CommerceDateRangePickerProps {
  from: string;
  to: string;
  onChange(from: string, to: string): void;
  placeholder?: string;
  className?: string;
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

function formatShort(value: string) {
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

function sameDay(a: Date, b: Date) {
  return toValue(a) === toValue(b);
}

function inRange(date: Date, from: Date | null, to: Date | null) {
  if (!from || !to) return false;
  const t = date.getTime();
  return t > from.getTime() && t < to.getTime();
}

export default function CommerceDateRangePicker({
  from,
  to,
  onChange,
  placeholder = "Select date range",
  className = "",
}: CommerceDateRangePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const fromDate = parseValue(from);
  const toDate = parseValue(to);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(fromDate ?? toDate ?? new Date()),
  );

  useEffect(() => {
    if (!open) {
      setDraftFrom(from);
      setDraftTo(to);
    }
  }, [from, to, open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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
  }, [open]);

  const cells = useMemo(() => buildCells(visibleMonth), [visibleMonth]);
  const monthLabel = visibleMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const draftFromDate = parseValue(draftFrom);
  const draftToDate = parseValue(draftTo);

  const displayLabel =
    from && to
      ? `${formatShort(from)} – ${formatShort(to)}`
      : from
        ? `${formatShort(from)} – …`
        : placeholder;

  const pick = (date: Date) => {
    const key = toValue(date);
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(key);
      setDraftTo("");
      return;
    }
    const start = parseValue(draftFrom)!;
    if (date.getTime() < start.getTime()) {
      setDraftFrom(key);
      setDraftTo(draftFrom);
    } else {
      setDraftTo(key);
    }
  };

  const applyDates = () => {
    if (draftFrom && draftTo) {
      onChange(draftFrom, draftTo);
      setOpen(false);
      return;
    }
    if (draftFrom && !draftTo) {
      onChange(draftFrom, draftFrom);
      setOpen(false);
    }
  };

  const clearSelection = () => {
    setDraftFrom("");
    setDraftTo("");
    onChange("", "");
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        aria-label="Choose date range"
        aria-expanded={open}
      >
        <span className="inline-flex min-w-0 items-center gap-2 truncate">
          <CalendarDays className="h-4 w-4 shrink-0 text-emerald-600" />
          <span
            className={`truncate ${from || to ? "text-slate-900" : "text-slate-400"}`}
          >
            {displayLabel}
          </span>
        </span>
      </button>

      {open ? (
        <div
          id="commerce-date-range-panel"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
        >
          <div className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs">
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-400">
                From
              </p>
              <p className="mt-0.5 font-medium text-slate-800">
                {draftFrom ? formatShort(draftFrom) : "Select start"}
              </p>
            </div>
            <span className="text-slate-300">→</span>
            <div className="text-right">
              <p className="font-semibold uppercase tracking-wide text-slate-400">
                To
              </p>
              <p className="mt-0.5 font-medium text-slate-800">
                {draftTo ? formatShort(draftTo) : "Select end"}
              </p>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between gap-2">
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
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-slate-900">{monthLabel}</p>
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
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-1 text-center text-[11px] font-semibold text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const inMonth = cell.getMonth() === visibleMonth.getMonth();
              const valueKey = toValue(cell);
              const isFrom =
                draftFromDate != null && sameDay(cell, draftFromDate);
              const isTo = draftToDate != null && sameDay(cell, draftToDate);
              const isBetween = inRange(cell, draftFromDate, draftToDate);
              const isEndpoint = isFrom || isTo;

              return (
                <button
                  key={valueKey + String(inMonth)}
                  type="button"
                  onClick={() => pick(cell)}
                  className={`h-9 rounded-lg text-sm font-medium transition ${
                    isEndpoint
                      ? "bg-violet-600 text-white"
                      : isBetween
                        ? "bg-violet-100 text-violet-800"
                        : inMonth
                          ? "text-slate-700 hover:bg-slate-50"
                          : "text-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {cell.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => {
                clearSelection();
                setOpen(false);
              }}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear selection
            </button>
            <button
              type="button"
              disabled={!draftFrom}
              onClick={applyDates}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-40"
            >
              Apply dates
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

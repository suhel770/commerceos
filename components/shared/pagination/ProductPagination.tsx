"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

interface ProductPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange(page: number): void;
  onPageSizeChange(pageSize: number): void;
  itemLabel?: string;
  pageSizeOptions?: number[];
  variant?: "default" | "compact";
}

export default function ProductPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  itemLabel = "products",
  pageSizeOptions = [25, 50, 100, 250],
  variant = "compact",
}: ProductPaginationProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [sizeOpen, setSizeOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);
  const firstPage = Math.max(1, Math.min(safePage - 2, totalPages - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstPage + index,
  );

  useEffect(() => {
    if (!sizeOpen) return;

    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setSizeOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSizeOpen(false);
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [sizeOpen]);

  const isCompact = variant === "compact";

  return (
    <div
      className={
        isCompact
          ? "flex flex-col gap-2 px-3 py-1.5 sm:flex-row sm:items-center sm:justify-between text-xs"
          : "flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between"
      }
    >
      <div className={isCompact ? "text-xs text-slate-500" : "text-sm text-slate-500"}>
        Showing
        <span className="mx-1.5 font-semibold text-slate-900">
          {start}–{end}
        </span>
        of
        <span className="mx-1.5 font-semibold text-slate-900">
          {totalItems.toLocaleString()}
        </span>
        {itemLabel}
      </div>

      <div className="relative flex items-center gap-1.5" ref={rootRef}>
        <span className={isCompact ? "text-xs text-slate-500" : "text-sm text-slate-500"}>
          Rows
        </span>
        <button
          type="button"
          aria-label="Rows per page"
          aria-haspopup="listbox"
          aria-expanded={sizeOpen}
          aria-controls={menuId}
          onClick={() => setSizeOpen((open) => !open)}
          className={`inline-flex items-center justify-between gap-1.5 rounded-lg border bg-white text-xs font-semibold transition ${
            isCompact ? "h-7 min-w-[3.8rem] px-2" : "h-10 min-w-[4.5rem] px-3 text-sm rounded-xl"
          } ${
            sizeOpen
              ? "border-violet-500 text-slate-900 ring-2 ring-violet-100"
              : "border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          {pageSize}
          <ChevronDown
            size={13}
            className={`text-slate-400 transition ${sizeOpen ? "rotate-180 text-violet-600" : ""}`}
          />
        </button>

        {sizeOpen ? (
          <div
            id={menuId}
            role="listbox"
            aria-label="Rows per page"
            className="absolute bottom-[calc(100%+6px)] left-8 z-30 min-w-[4rem] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10"
          >
            {pageSizeOptions.map((size) => {
              const selected = size === pageSize;
              return (
                <button
                  key={size}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onPageSizeChange(size);
                    setSizeOpen(false);
                  }}
                  className={`flex w-full items-center justify-center rounded-lg px-2 py-1 text-xs font-semibold transition ${
                    selected
                      ? "bg-violet-600 text-white"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Previous page"
          disabled={safePage === 1}
          onClick={() => onPageChange(safePage - 1)}
          className={`rounded-lg border border-slate-200 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 ${
            isCompact ? "p-1" : "p-2 rounded-xl"
          }`}
        >
          <ChevronLeft size={isCompact ? 14 : 18} />
        </button>

        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            aria-label={`Page ${pageNumber}`}
            aria-current={pageNumber === safePage ? "page" : undefined}
            onClick={() => onPageChange(pageNumber)}
            className={
              pageNumber === safePage
                ? `flex items-center justify-center font-semibold text-white bg-violet-600 ${
                    isCompact ? "h-7 w-7 rounded-lg text-xs" : "h-10 w-10 rounded-xl text-sm"
                  }`
                : `flex items-center justify-center font-medium border border-slate-200 text-slate-700 hover:bg-slate-100 ${
                    isCompact ? "h-7 w-7 rounded-lg text-xs" : "h-10 w-10 rounded-xl text-sm"
                  }`
            }
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          aria-label="Next page"
          disabled={safePage === totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className={`rounded-lg border border-slate-200 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 ${
            isCompact ? "p-1" : "p-2 rounded-xl"
          }`}
        >
          <ChevronRight size={isCompact ? 14 : 18} />
        </button>
      </div>
    </div>
  );
}
